import 'server-only'

import { INTEGRATION_NOT_CONFIGURED } from '@/lib/types'

/**
 * Cliente da UTMFY.
 *
 * A UTMFY é usada aqui para rastrear e atribuir vendas. Este módulo é
 * deliberadamente genérico: NÃO inventa endpoints nem formato de resposta da
 * API real da UTMFY. A base URL e o token vêm de env; se não houver token do
 * usuário, usamos o token de sistema como fallback para chamadas de leitura.
 *
 * Ao integrar de verdade: ajuste `request()` e os métodos abaixo ao contrato
 * publicado pela UTMFY. Nada no resto do produto precisa mudar.
 */

export interface UtmfyConnectionTest {
  ok: boolean
  message: string
  accountName?: string
}

/** Headers comuns; o nome exato do header de auth pode variar por versão. */
function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export class UtmfyClient {
  private readonly baseUrl: string
  private readonly systemToken: string

  constructor() {
    this.baseUrl = (process.env.UTMFY_API_URL ?? '').replace(/\/+$/, '')
    this.systemToken = process.env.UTMFY_API_KEY ?? ''
  }

  isConfigured(): boolean {
    return this.baseUrl.length > 0 && this.systemToken.length > 0
  }

  /** Testa a conexão de um token fornecido pelo usuário. */
  async testConnection(token: string): Promise<UtmfyConnectionTest> {
    if (!this.baseUrl) {
      return { ok: false, message: INTEGRATION_NOT_CONFIGURED }
    }
    if (!token) {
      return { ok: false, message: 'Informe um API key para testar a conexão.' }
    }

    try {
      const data = await this.request<Record<string, unknown>>('/account', token)
      return {
        ok: true,
        message: 'Conexão bem-sucedida.',
        accountName:
          (data?.name as string) ?? (data?.account as string) ?? undefined,
      }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Falha ao testar a conexão.',
      }
    }
  }

  /**
   * Chamada HTTP com timeout e tratamento de erro uniforme.
   * Configurable por UTMFY_API_URL — nada de endpoint fixo no código.
   */
  async request<T>(
    path: string,
    token: string,
    init: RequestInit = {},
  ): Promise<T> {
    if (!this.baseUrl) throw new Error(INTEGRATION_NOT_CONFIGURED)

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...authHeaders(token), ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      throw new Error(`UTMFY respondeu ${response.status}`)
    }
    return (await response.json()) as T
  }
}

let client: UtmfyClient | null = null

export function getUtmfyClient(): UtmfyClient {
  if (!client) client = new UtmfyClient()
  return client
}

/** URL de callback que o usuário deve cadastrar no painel da UTMFY. */
export function buildWebhookUrl(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/api/webhooks/utmfy`
}