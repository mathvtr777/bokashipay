import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateFee, calculateNet } from '@/services/payments/rules'
import { getPixProvider, MIN_VALUE_CENTS } from '@/services/pix'
import { INTEGRATION_NOT_CONFIGURED } from '@/lib/types'
import type { ProductCheckoutSettings } from '@/lib/types'

/**
 * Geração de cobrança PIX a partir do checkout público.
 *
 * Diferente de /api/pix (que exige login e usa o JWT do merchant), esta
 * rota é acessível a partir de `/checkout/[slug]` sem sessão. O usuário
 * é identificado pelo produto (dono) + dados do cliente (nome, email).
 *
 * Fluxo:
 *   1. Carrega o produto pelo slug. Sem slug, ou status != active → 404.
 *   2. Encontra ou cria o `customer` no banco do merchant.
 *   3. Cria a transaction com product_id.
 *   4. Gera PIX via Pushin Pay (ou devolve 501 se sem configuração).
 */

const DEFAULT_SETTINGS: Required<ProductCheckoutSettings> = {
  primaryColor: '#8b5cf6',
  bannerUrl: '',
  successMessage: 'Pagamento confirmado! Em breve você recebe o produto por e-mail.',
  requirePhone: false,
  requireDocument: false,
}

const BodySchema = z.object({
  customerName: z.string().trim().min(2, 'Informe seu nome.').max(120),
  customerEmail: z.string().trim().email('Email inválido.').max(160),
  customerPhone: z.string().trim().max(30).optional().nullable(),
  customerDocument: z.string().trim().max(20).optional().nullable(),
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

function getSettings(raw: unknown): Required<ProductCheckoutSettings> {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS
  const s = raw as Partial<ProductCheckoutSettings>
  return {
    primaryColor: s.primaryColor || DEFAULT_SETTINGS.primaryColor,
    bannerUrl: s.bannerUrl || DEFAULT_SETTINGS.bannerUrl,
    successMessage: s.successMessage || DEFAULT_SETTINGS.successMessage,
    requirePhone: Boolean(s.requirePhone),
    requireDocument: Boolean(s.requireDocument),
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  if (!slug) {
    return NextResponse.json({ error: 'Produto não configurado.' }, { status: 400 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }
  const { customerName, customerEmail, customerPhone, customerDocument } = parsed.data

  // Lê o produto via service role — o checkout é público.
  const admin = createAdminClient()
  const { data: product, error: productErr } = await admin
    .from('products')
    .select('id, user_id, name, price_cents, status, model, checkout_settings')
    .eq('slug', slug)
    .maybeSingle()

  if (productErr || !product) {
    return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 })
  }
  if (product.status !== 'active') {
    return NextResponse.json({ error: 'Produto indisponível.' }, { status: 404 })
  }

  const settings = getSettings(product.checkout_settings)

  // Cliente do merchant: procura por email (já que email é único-por-merchant no modelo atual? Não. Email pode repetir.
  // Vou pegar o primeiro match — sem unicidade, é o que dá).
  const { data: existingCustomer } = await admin
    .from('customers')
    .select('id')
    .eq('user_id', product.user_id)
    .eq('email', customerEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let customerId: string
  if (existingCustomer) {
    customerId = existingCustomer.id
  } else {
    const { data: created, error: custErr } = await admin
      .from('customers')
      .insert({
        user_id: product.user_id,
        name: customerName,
        email: customerEmail,
        phone: customerPhone || null,
        document: customerDocument || null,
        status: 'active',
      })
      .select('id')
      .single()
    if (custErr || !created) {
      return NextResponse.json(
        { error: 'Não foi possível registrar o cliente.' },
        { status: 500 },
      )
    }
    customerId = created.id
  }

  const amountCents = product.price_cents
  if (amountCents < MIN_VALUE_CENTS) {
    return NextResponse.json(
      { error: 'O valor mínimo para cobrança PIX é R$ 0,50.' },
      { status: 400 },
    )
  }

  const amountReais = amountCents / 100
  const fee = calculateFee(amountReais, 'pix')
  const netAmount = calculateNet(amountReais, 'pix')

  // Cria a transaction (com product_id) primeiro — fonte de verdade.
  const { data: transaction, error: txError } = await admin
    .from('transactions')
    .insert({
      user_id: product.user_id,
      customer_id: customerId,
      product_id: product.id,
      amount: amountReais,
      fee,
      net_amount: netAmount,
      method: 'pix',
      status: 'pending',
      description: product.name,
      payer_name: customerName,
      payer_document: customerDocument || null,
    })
    .select('id')
    .single()
  if (txError || !transaction) {
    return NextResponse.json(
      { error: 'Não foi possível registrar a venda.' },
      { status: 500 },
    )
  }

  const provider = getPixProvider()
  if (!provider.isConfigured()) {
    return NextResponse.json(
      {
        transactionId: transaction.id,
        amount: amountReais,
        qrCodeBase64: null,
        copyPasteCode: null,
        expiresAt: null,
        providerConfigured: false,
        message: INTEGRATION_NOT_CONFIGURED,
      },
      { status: 201 },
    )
  }

  let charge
  try {
    charge = await provider.createCharge({
      amount: amountReais,
      customerId,
      description: product.name,
      idempotencyKey: `${product.user_id}:${transaction.id}`,
      webhookUrl: buildWebhookUrl(request),
    })
  } catch (error) {
    // Marca como canceled pra não inflar dashboard com pending fake.
    await admin
      .from('transactions')
      .update({ status: 'canceled' })
      .eq('id', transaction.id)
    const message = error instanceof Error ? error.message : 'Falha ao criar a cobrança.'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  await admin.from('pix_transactions').insert({
    user_id: product.user_id,
    transaction_id: transaction.id,
    amount: amountReais,
    status: 'pending',
    provider_request_id: charge.providerRequestId,
    qr_code_base64: charge.qrCodeBase64 || null,
    copy_paste_code: charge.copyPasteCode,
    expires_at: charge.expiresAt,
  })

  return NextResponse.json(
    {
      transactionId: transaction.id,
      amount: amountReais,
      qrCodeBase64: charge.qrCodeBase64,
      copyPasteCode: charge.copyPasteCode,
      expiresAt: charge.expiresAt,
      providerConfigured: true,
      successMessage: settings.successMessage,
    },
    { status: 201 },
  )
}