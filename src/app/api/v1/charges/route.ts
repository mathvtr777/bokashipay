import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/security/api-auth'
import { apiLimiter } from '@/lib/security/rate-limit'
import { calculateFee, calculateNet } from '@/services/payments/rules'
import { getPixProvider, MIN_VALUE_CENTS } from '@/services/pix'

/**
 * Cria uma cobrança PIX avulsa via API.
 *
 * Semelhante a `/api/pix` (que é pelo JWT), mas autenticado por API key —
 * cada merchant gera chaves no painel e usa pra integrar nos SaaS dele.
 *
 * Fluxo:
 *   1. Valida API key (Bearer)
 *   2. Aplica rate limit (60 req/min por chave)
 *   3. Valida payload
 *   4. Cria customer (se vier) e transaction
 *   5. Chama Pushin Pay
 *   6. Grava pix_transactions e retorna o QR pro solicitante
 *
 * Erros:
 *   401 — chave ausente/inválida
 *   429 — rate limit
 *   422 — payload inválido
 *   502 — Pushin Pay falhou
 */

const BodySchema = z.object({
  amount: z.number().positive().max(1_000_000),
  description: z.string().trim().min(1).max(140).optional(),
  expires_in_minutes: z.number().int().min(5).max(1440).optional(),
  customer: z
    .object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(160),
      phone: z.string().trim().max(30).optional().nullable(),
      document: z.string().trim().max(20).optional().nullable(),
    })
    .optional(),
})

function buildWebhookUrl(request: NextRequest): string {
  const configured = process.env.PUSHINPAY_PUBLIC_URL?.trim()
  if (configured) {
    return `${configured.replace(/\/+$/, '')}/api/webhooks/pushinpay`
  }
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return ''
  const proto =
    request.headers.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}/api/webhooks/pushinpay`
}

export async function POST(request: NextRequest) {
  // 1. Auth
  const auth = await validateApiKey(request.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json(
      { error: { type: 'authentication', message: 'API key inválida.' } },
      { status: 401 },
    )
  }

  // 2. Rate limit
  const limit = apiLimiter.hit(auth.apiKey.id)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: { type: 'rate_limited', message: 'Muitas requisições.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    )
  }

  // 3. Payload
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json(
      { error: { type: 'invalid_request', message: 'JSON inválido.' } },
      { status: 422 },
    )
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { type: 'invalid_request', message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' } },
      { status: 422 },
    )
  }
  const { amount, description, expires_in_minutes, customer } = parsed.data
  const amountCents = Math.round(amount * 100)
  if (amountCents < MIN_VALUE_CENTS) {
    return NextResponse.json(
      { error: { type: 'invalid_request', message: 'Valor mínimo: R$ 0,50.' } },
      { status: 422 },
    )
  }

  const supabase = await createClient()
  // Garante que a sessão é do merchant da key (RLS faria isso, mas usamos
  // um cliente autenticado pelo JWT do próprio request, e o RLS filtra).
  // Como validateApiKey já validou que a key pertence a um user, o user.id
  // é o dono.

  // 4. Customer (se vier)
  let customerId: string | null = null
  if (customer) {
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('email', customer.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing) {
      customerId = existing.id
    } else {
      const { data: created, error: custErr } = await supabase
        .from('customers')
        .insert({
          user_id: auth.userId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || null,
          document: customer.document || null,
          status: 'active',
        })
        .select('id')
        .single()
      if (custErr || !created) {
        return NextResponse.json(
          { error: { type: 'server_error', message: 'Não foi possível criar o cliente.' } },
          { status: 500 },
        )
      }
      customerId = created.id
    }
  }

  const amountReais = amountCents / 100
  const fee = calculateFee(amountReais, 'pix')
  const netAmount = calculateNet(amountReais, 'pix')

  // 5. Transaction
  const { data: transaction, error: txErr } = await supabase
    .from('transactions')
    .insert({
      user_id: auth.userId,
      customer_id: customerId,
      amount: amountReais,
      fee,
      net_amount: netAmount,
      method: 'pix',
      status: 'pending',
      description: description || null,
      payer_name: customer?.name ?? null,
      payer_document: customer?.document ?? null,
    })
    .select('id, created_at')
    .single()
  if (txErr || !transaction) {
    return NextResponse.json(
      { error: { type: 'server_error', message: 'Não foi possível registrar a venda.' } },
      { status: 500 },
    )
  }

  // 6. Pushin Pay
  const provider = getPixProvider()
  if (!provider.isConfigured()) {
    return NextResponse.json(
      {
        error: { type: 'integration_not_configured', message: 'BokashiPay sem PSP configurado.' },
      },
      { status: 503 },
    )
  }

  let charge
  try {
    charge = await provider.createCharge({
      amount: amountReais,
      customerId,
      description: description || 'Cobrança via BokashiPay API',
      idempotencyKey: `${auth.userId}:${transaction.id}`,
      webhookUrl: buildWebhookUrl(request),
    })
  } catch (error) {
    await supabase
      .from('transactions')
      .update({ status: 'canceled' })
      .eq('id', transaction.id)
    const message = error instanceof Error ? error.message : 'Falha ao gerar cobrança.'
    return NextResponse.json(
      { error: { type: 'provider_error', message } },
      { status: 502 },
    )
  }

  // Override expiration se vier expires_in_minutes
  const expiresAt = expires_in_minutes
    ? new Date(Date.now() + expires_in_minutes * 60_000).toISOString()
    : charge.expiresAt

  await supabase.from('pix_transactions').insert({
    user_id: auth.userId,
    transaction_id: transaction.id,
    amount: amountReais,
    status: 'pending',
    provider_request_id: charge.providerRequestId,
    qr_code_base64: charge.qrCodeBase64 || null,
    copy_paste_code: charge.copyPasteCode,
    expires_at: expiresAt,
  })

  return NextResponse.json(
    {
      id: transaction.id,
      status: 'pending',
      amount: amountReais,
      qr_code: charge.qrCodeBase64,
      copy_paste: charge.copyPasteCode,
      expires_at: expiresAt,
      created_at: transaction.created_at,
    },
    { status: 201 },
  )
}