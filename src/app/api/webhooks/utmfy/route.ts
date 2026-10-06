import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin'
import { verifyWebhookSignature } from '@/lib/signature'
import { createNotification } from '@/services/notifications'
import { roundCurrency } from '@/services/payments/rules'
import type { Json } from '@/lib/database.types'

/**
 * Webhook da UTMFY.
 *
 * Recebe eventos de venda e os registra em `integration_events`. Usa o cliente
 * admin porque a requisição chega sem JWT de usuário — quem autentica aqui é a
 * assinatura HMAC, se `UTMFY_WEBHOOK_SECRET` estiver definida.
 *
 * O mapeamento de um evento UTMFY para uma venda no BokashiPay é feito aqui e
 * de forma explícita: nada é criado por evento sem valor e status válidos.
 */

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Backend não configurado.' }, { status: 500 })
  }

  // Precisa do corpo cru: a assinatura é calculada sobre os bytes originais.
  const rawBody = await request.text()

  const secret = process.env.UTMFY_WEBHOOK_SECRET
  if (secret) {
    const signature = request.headers.get('x-utmfy-signature') ?? request.headers.get('x-webhook-signature')

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      // Não registramos nem respondemos com sucesso: quem não tem a assinatura
      // correta não é a UTMFY.
      return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // O webhook precisa saber a qual usuário pertence. Aceitamos `user_id`
  // explícito no payload ou o identificador enviado como header.
  const userId =
    (typeof payload.user_id === 'string' ? payload.user_id : null) ??
    request.headers.get('x-bokashipay-user-id')

  if (!userId) {
    return NextResponse.json(
      { error: 'Não foi possível identificar o usuário do evento.' },
      { status: 400 },
    )
  }

  const event = typeof payload.event === 'string' ? payload.event : 'unknown'
  const eventType = typeof payload.type === 'string' ? payload.type : null
  const status = typeof payload.status === 'string' ? payload.status : 'received'

  const { data: integration } = await admin
    .from('integrations')
    .select('id, user_id')
    .eq('user_id', userId)
    .eq('provider', 'utmfy')
    .maybeSingle()

  const { data: stored, error } = await admin
    .from('integration_events')
    .insert({
      user_id: userId,
      integration_id: integration?.id ?? null,
      event: eventType ? `${event}:${eventType}` : event,
      payload: payload as unknown as Json,
      status: 'received',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Falha ao registrar o evento.' }, { status: 500 })
  }

  // Só trata como venda quando há valor e um estado reconhecível. Um evento de
  // tracking ou clique não cria transação.
  const amount = Number(payload.amount ?? payload.value ?? 0)
  const isSale = Boolean(amount) && typeof payload.status === 'string'

  if (isSale) {
    await processSaleEvent(admin, userId, payload, amount)
  }

  await admin.from('integration_events').update({ status: 'processed' }).eq('id', stored.id)

  return NextResponse.json({ received: true, id: stored.id })
}

/** Traduz um evento de venda da UTMFY para uma transação no BokashiPay. */
async function processSaleEvent(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  payload: Record<string, unknown>,
  amount: number,
) {
  const externalId =
    (typeof payload.order_id === 'string' && payload.order_id) ||
    (typeof payload.transaction_id === 'string' && payload.transaction_id) ||
    (typeof payload.id === 'string' && payload.id) ||
    null

  // Idempotência por evento: o mesmo pedido não vira duas vendas.
  if (externalId) {
    const { data: existing } = await admin
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('external_id', externalId)
      .maybeSingle()

    if (existing) return
  }

  const rawStatus = String(payload.status).toLowerCase()
  const mappedStatus =
    rawStatus === 'paid' || rawStatus === 'approved' || rawStatus === 'completed'
      ? 'approved'
      : rawStatus === 'refunded' || rawStatus === 'charged_back'
        ? 'refunded'
        : rawStatus === 'canceled' || rawStatus === 'cancelled'
          ? 'canceled'
          : 'pending'

  const method = String(payload.payment_method ?? payload.method ?? 'pix')
  const normalizedMethod = method === 'card' || method === 'boleto' ? method : 'pix'

  // Taxa pela mesma tabela de regras do resto do sistema.
  const feeRate = normalizedMethod === 'pix' ? 0.0099 : normalizedMethod === 'card' ? 0.0349 : 0
  const fee = roundCurrency(amount * feeRate)
  const netAmount = roundCurrency(amount - fee)

  const { data: transaction, error } = await admin
    .from('transactions')
    .insert({
      user_id: userId,
      amount,
      fee,
      net_amount: netAmount,
      method: normalizedMethod,
      status: mappedStatus,
      external_id: externalId,
      description:
        typeof payload.product_name === 'string'
          ? payload.product_name
          : typeof payload.description === 'string'
            ? payload.description
            : 'Venda via UTMFY',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[webhook utmfy] falha ao criar transação:', error.message)
    return
  }

  // Lançamentos no extrato só existem para o que de fato entrou.
  if (mappedStatus === 'approved') {
    await admin.from('financial_entries').insert({
      user_id: userId,
      transaction_id: transaction.id,
      type: 'income',
      description: 'Venda aprovada via UTMFY',
      amount: netAmount,
      balance_after: netAmount,
    })
  }

  if (mappedStatus === 'approved') {
    await createNotification({
      userId,
      title: 'Nova venda',
      body: `R$ ${amount.toFixed(2)} recebidos via UTMFY.`,
      type: 'sale',
      link: '/vendas',
    })
  }
}