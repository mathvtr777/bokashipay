import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calculateFee, calculateNet } from '@/services/payments/rules'
import { getPixProvider, MIN_VALUE_CENTS } from '@/services/pix'
import { createNotification } from '@/services/notifications'
import { INTEGRATION_NOT_CONFIGURED } from '@/lib/types'

/**
 * Geração de cobrança PIX.
 *
 * Fluxo, e o que cada etapa significa:
 *  1. Valida o valor e a sessão do usuário (RLS impede gravar para outro).
 *  2. Registra a intenção em `pix_transactions` com status `pending`.
 *  3. Chama o provedor. SEM provedor configurado, para aqui e devolve
 *     "Integração não configurada" — não gera QR Code local e não marca como pago.
 *
 * Um QR Code é uma representação visual de um valor. Sem um PSP respondendo por
 * trás, ele não cobra ninguém — então jamais criamos um aqui.
 */

const BodySchema = z.object({
  amount: z.number().positive('O valor deve ser maior que zero.').max(1_000_000, 'Valor muito alto.'),
  description: z.string().trim().max(140).optional(),
  customerId: z.string().uuid().optional().nullable(),
})

/**
 * URL pública do webhook da Pushin Pay.
 *
 * `PUSHINPAY_PUBLIC_URL` tem precedência: em produção o host da requisição
 * pode ser interno (atrás de balanceador, em cluster), e o provedor chamaria
 * um endereço que ele não alcança. Sem essa variável, caímos no host do
 * cabeçalho — o que funciona em produção com domínio direto, mas **não em
 * desenvolvimento**, e por isso avisamos em vez de falhar em silêncio.
 */
function buildWebhookUrl(request: NextRequest): string {
  const configured = process.env.PUSHINPAY_PUBLIC_URL?.trim()
  if (configured) {
    return `${configured.replace(/\/+$/, '')}/api/webhooks/pushinpay`
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return ''
  const proto =
    request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')

  const url = `${proto}://${host}/api/webhooks/pushinpay`

  // Um provedor não alcança localhost: a cobrança ficaria pendente para
  // sempre sem nenhuma notificação de pagamento.
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    console.warn(
      '[pix] PUSHINPAY_PUBLIC_URL não configurada e o host é local — ' +
        'a Pushin Pay não conseguirá chamar o webhook. A confirmação automática não funcionará.',
    )
  }

  return url
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  // zod coerce: aceita "100", 100 e "100.50".
  const parsed = BodySchema.safeParse({
    ...(raw as Record<string, unknown>),
    amount: Number((raw as Record<string, unknown>).amount),
  })

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Dados inválidos.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { amount, description, customerId } = parsed.data
  const amountCents = Math.round(amount * 100)

  // Mínimo da Pushin Pay (R$ 0,50). Validar aqui evita uma chamada que só
  // voltaria com 422.
  if (amountCents < MIN_VALUE_CENTS) {
    return NextResponse.json(
      { error: 'O valor mínimo para cobrança PIX é R$ 0,50.' },
      { status: 400 },
    )
  }

  const provider = getPixProvider()

  // Sem provedor: registra a intenção, mas deixa explícito que nada foi cobrado.
  if (!provider.isConfigured()) {
    const { data: pix, error } = await supabase
      .from('pix_transactions')
      .insert({ user_id: user.id, amount: amountCents / 100, status: 'pending' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Não foi possível registrar a cobrança.' }, { status: 500 })
    }

    return NextResponse.json(
      {
        pix,
        providerConfigured: false,
        message: INTEGRATION_NOT_CONFIGURED,
      },
      { status: 201 },
    )
  }

  let charge
  try {
    charge = await provider.createCharge({
      amount: amountCents / 100,
      customerId: customerId ?? null,
      description: description || 'Cobrança BokashiPay',
      idempotencyKey: `${user.id}:${crypto.randomUUID()}`,
      // Sem isso a Pushin Pay não avisa quando o PIX é pago, e a cobrança
      // dependeria de alguém apertar "Atualizar" na tela.
      webhookUrl: buildWebhookUrl(request),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar a cobrança.'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const fee = calculateFee(amountCents / 100, 'pix')
  const netAmount = calculateNet(amountCents / 100, 'pix')

  // Transação espelhada: o dashboard lê `transactions`, que é a fonte de verdade
  // de vendas e saldos.
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      customer_id: customerId ?? null,
      amount: amountCents / 100,
      fee,
      net_amount: netAmount,
      method: 'pix',
      status: 'pending',
      external_id: charge.providerRequestId,
      description: description || null,
    })
    .select()
    .single()

  if (txError) {
    return NextResponse.json({ error: 'Não foi possível registrar a venda.' }, { status: 500 })
  }

  const { data: pix, error: pixError } = await supabase
    .from('pix_transactions')
    .insert({
      user_id: user.id,
      transaction_id: transaction.id,
      amount: amountCents / 100,
      status: 'pending',
      provider_request_id: charge.providerRequestId,
      qr_code_base64: charge.qrCodeBase64 || null,
      copy_paste_code: charge.copyPasteCode,
      expires_at: charge.expiresAt,
    })
    .select()
    .single()

  if (pixError) {
    return NextResponse.json({ error: 'Não foi possível salvar a cobrança.' }, { status: 500 })
  }

  await createNotification({
    userId: user.id,
    title: 'Novo PIX criado',
    body: `Cobrança de R$ ${(amountCents / 100).toFixed(2)} aguardando pagamento.`,
    type: 'pix',
    link: '/pix',
  })

  return NextResponse.json({ pix, providerConfigured: true }, { status: 201 })
}