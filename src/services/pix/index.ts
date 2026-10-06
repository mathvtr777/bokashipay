import { timingSafeEqual } from 'node:crypto'

import { INTEGRATION_NOT_CONFIGURED, type Result } from '@/lib/types'
import type {
  PixChargeRequest,
  PixChargeResult,
  PixProvider,
} from './types'

/**
 * Provedor PIX — Pushin Pay.
 *
 * Contrato verificado na documentação oficial do provedor:
 *   POST {base}/pix/cashIn       cria a cobrança
 *   GET  {base}/transactions/{id} consulta o status
 *   Authorization: Bearer <token>
 *
 * Atenção ao plural: o índice da documentação resume a consulta como
 * `/transaction/{id}`, mas o endpoint real é `/transactions/{id}`. Com o
 * singular a API devolve 404 ("The route ... could not be found") e a
 * confirmação manual nunca funciona.
 *
 * Dois detalhes do contrato que a implementação precisa respeitar:
 *  - o `value` é sempre em CENTAVOS, com mínimo de 50 (R$ 0,50);
 *  - `qr_code_base64` já vem como data URL (`data:image/png;base64,...`),
 *    então o prefixo é removido antes de gravar — o resto do produto assume
 *    base64 puro.
 *
 * A interface `PixProvider` continua genérica: trocar de PSP significa
 * implementar esta interface, e nada mais no produto muda.
 */

export interface PushinPayTransaction {
  id: string
  status: 'created' | 'paid' | 'canceled' | 'expired' | string
  value?: number
  qr_code?: string
  qr_code_base64?: string
  end_to_end_id?: string | null
  payer_name?: string | null
  payer_national_registration?: string | null
}

/** Valor mínimo aceito pela Pushin Pay, em centavos. */
export const MIN_VALUE_CENTS = 50

/** Remove o prefixo de data URL, devolvendo base64 puro. */
export function stripDataUrl(value: string | null | undefined): string {
  if (!value) return ''
  const match = /^data:[^;,]+;base64,(.+)$/s.exec(value)
  return match ? match[1] : value
}

/** Converte o vocabulário da Pushin Pay para o domínio do BokashiPay. */
export function mapStatus(status: string): 'pending' | 'paid' | 'canceled' | 'expired' {
  switch (status) {
    case 'paid':
      return 'paid'
    case 'canceled':
    case 'cancelled':
      return 'canceled'
    case 'expired':
      return 'expired'
    default:
      // "created" e qualquer estado desconhecido continuam pendentes:
      // um estado não reconhecido nunca pode ser lido como pago.
      return 'pending'
  }
}

export class PushinPayProvider implements PixProvider {
  readonly name = 'pushinpay'

  private readonly baseUrl: string
  private readonly token: string

  constructor() {
    this.baseUrl = (
      process.env.PUSHINPAY_API_URL ?? 'https://api.pushinpay.com.br/api'
    ).replace(/\/+$/, '')
    this.token = process.env.PUSHINPAY_API_TOKEN ?? ''
  }

  isConfigured(): boolean {
    return this.baseUrl.length > 0 && this.token.length > 0
  }

  private headers(): Record<string, string> {
    return {
      // O token já vem no formato completo (ex.: "id|segredo").
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  async createCharge(req: PixChargeRequest): Promise<PixChargeResult> {
    if (!this.isConfigured()) throw new Error(INTEGRATION_NOT_CONFIGURED)

    // A API trabalha em centavos — enviar reais rejeitados seria um erro
    // silencioso de 100x, então a conversão é explícita.
    const valueCents = Math.round(req.amount * 100)

    if (valueCents < MIN_VALUE_CENTS) {
      throw new Error('O valor mínimo para cobrança PIX é R$ 0,50.')
    }

    const response = await fetch(`${this.baseUrl}/pix/cashIn`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        value: valueCents,
        // Sem URL de webhook não há como ser avisado de um pagamento depois.
        ...(req.webhookUrl ? { webhook_url: req.webhookUrl } : {}),
      }),
      signal: AbortSignal.timeout(25_000),
    })

    const payload = await readJson(response)

    if (!response.ok) {
      throw new Error(pushinError(payload, response.status))
    }

    const id = payload?.id
    const copyPasteCode = payload?.qr_code

    if (typeof id !== 'string' || typeof copyPasteCode !== 'string') {
      throw new Error('Resposta da Pushin Pay veio sem id ou qr_code.')
    }

    return {
      // A Pushin Pay devolve o id em minúsculas na criação e em MAIÚSCULAS
      // na consulta e no webhook. Gravamos sempre em minúsculas e
      // normalizamos na leitura, senão a cobrança nunca é encontrada.
      providerRequestId: id.toLowerCase(),
      copyPasteCode,
      qrCodeBase64: stripDataUrl(payload?.qr_code_base64),
      // A Pushin Pay não devolve expiração no cashIn; o PIX expira por padrão
      // no prazo do banco. Um prazo explícito evita mostrar "pendente" para
      // sempre na interface.
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  async getChargeStatus(
    providerRequestId: string,
  ): Promise<{ status: string; paidAt?: string }> {
    if (!this.isConfigured()) throw new Error(INTEGRATION_NOT_CONFIGURED)

    const response = await fetch(
      `${this.baseUrl}/transactions/${encodeURIComponent(providerRequestId)}`,
      { headers: this.headers(), signal: AbortSignal.timeout(15_000) },
    )

    const payload = await readJson(response)

    if (!response.ok) {
      throw new Error(pushinError(payload, response.status))
    }

    // A documentação avisa: consultas diretas são limitadas a 1 por minuto e
    // quem estourar pode ter a conta bloqueada. Se não vier nada (404 devolve
    // array vazio), tratamos como "ainda não sei" em vez de falha.
    if (Array.isArray(payload) && payload.length === 0) {
      throw new Error('Cobrança não encontrada na Pushin Pay.')
    }

    // A data de pagamento só existe depois do status virar "paid"; nesse
    // momento usamos a atualização do próprio recurso.
    const paidAt =
      mapStatus(payload?.status) === 'paid' && typeof payload?.updated_at === 'string'
        ? payload.updated_at
        : undefined

    return { status: mapStatus(payload?.status), paidAt }
  }
}

/** Lê a resposta JSON tolerando corpo vazio ou não-JSON. */
async function readJson(response: Response): Promise<any> {
  const text = await response.text().catch(() => '')
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { message: text.slice(0, 200) }
  }
}

/**
 * Extrai a mensagem de erro do provedor. A Pushin Pay devolve `message` ou
 * `error`; mostrar o texto dela é mais útil que um "erro 422" genérico.
 */
export function pushinError(payload: any, status: number): string {
  const message =
    payload?.message ?? payload?.error ?? payload?.errors?.[0]?.message ?? payload?.detail

  if (typeof message === 'string' && message.length > 0) {
    return `Pushin Pay: ${message}`
  }

  if (status === 401 || status === 403) {
    return 'Pushin Pay recusou o token. Confira PUSHINPAY_API_TOKEN.'
  }

  return `Pushin Pay respondeu ${status}.`
}

/** Provedor usado quando não há credencial: falha explicitamente, nunca simula. */
export class UnconfiguredPixProvider implements PixProvider {
  readonly name = 'none'

  isConfigured(): boolean {
    return false
  }

  async createCharge(): Promise<PixChargeResult> {
    throw new Error(INTEGRATION_NOT_CONFIGURED)
  }

  async getChargeStatus(): Promise<{ status: string; paidAt?: string }> {
    throw new Error(INTEGRATION_NOT_CONFIGURED)
  }
}

let provider: PixProvider | null = null

export function getPixProvider(): PixProvider {
  if (!provider) {
    const pushinpay = new PushinPayProvider()
    provider = pushinpay.isConfigured() ? pushinpay : new UnconfiguredPixProvider()
  }
  return provider
}

/**
 * Nome do header que a Pushin Pay envia em todos os webhooks.
 *
 * O provedor deixa você escolher nome e valor no menu de configurações do
 * painel. Se `PUSHINPAY_WEBHOOK_HEADER` não estiver definida, usamos este
 * nome — então o header configurado lá precisa se chamar exatamente isso.
 */
export const DEFAULT_WEBHOOK_HEADER = 'x-bokashipay-secret'

export function webhookHeaderName(): string {
  return (process.env.PUSHINPAY_WEBHOOK_HEADER ?? DEFAULT_WEBHOOK_HEADER)
    .trim()
    .toLowerCase()
}

/**
 * Confere o header customizado do webhook.
 *
 * A Pushin Pay envia um **valor estático** escolhido no painel — não é uma
 * assinatura HMAC do corpo. Exigir HMAC rejeitaria todo webhook com 401 e
 * nenhum pagamento confirmaria, que é pior do que não ter verificação. Aqui
 * comparamos o valor direto, em tempo constante.
 *
 * Sem segredo configurado devolvemos `true` e quem chama registra o aviso:
 * é preferível um webhook sem autenticação, com aviso no log, a um webhook
 * que rejeita pagamento legítimo.
 */
export function verifyWebhookSecret(
  headers: Headers,
  secret = process.env.PUSHINPAY_WEBHOOK_SECRET ?? '',
): boolean {
  if (!secret) return true

  const received = headers.get(webhookHeaderName())
  if (!received) return false

  // timingSafeEqual exige entradas do mesmo tamanho; normalizar antes evita
  // que o tamanho da comparação vaze informação sobre o segredo.
  const pad = (value: string) => Buffer.from(value.padEnd(256, '\0').slice(0, 256), 'utf8')
  return timingSafeEqual(pad(received), pad(secret))
}

export type { Result }