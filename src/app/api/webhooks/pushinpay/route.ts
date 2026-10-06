import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin'
import { mapStatus, verifyWebhookSecret, webhookHeaderName } from '@/services/pix'
import { createNotification } from '@/services/notifications'
import { roundCurrency } from '@/services/payments/rules'
import { dispatchToUser } from '@/services/webhooks/dispatcher'

/**
 * Webhook da Pushin Pay.
 *
 * Payload documentado pelo provedor:
 *   { id, value, status, end_to_end_id, payer_name?, payer_national_registration? }
 *
 * O `id` é o identificador devolvido na criação da cobrança, e é ele que amarra
 * o evento à cobrança certa — não há `user_id` no payload, e não deve haver.
 *
 * Este é o caminho pelo qual um PIX vira "pago" de forma automática. Sem ele,
 * o usuário precisaria apertar "Atualizar" e ainda assim depender de alguém
 * consultar. Com ele, o saldo muda sozinho.
 */
export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Backend não configurado.' }, { status: 500 })
  }

  const rawBody = await request.text()

  // A Pushin Pay envia um header customizado de valor estático, configurável no
  // painel dela. Sem ele configurado aqui, aceitamos o evento e avisamos no log
  // — recusar seria pior, porque pagamento legítimo deixaria de confirmar.
  const secret = process.env.PUSHINPAY_WEBHOOK_SECRET ?? ''

  if (!secret) {
    console.warn(
      '[webhook pushinpay] PUSHINPAY_WEBHOOK_SECRET não configurada: aceitando ' +
        'qualquer chamada nesta URL. Quem descobrir a URL poderia marcar ' +
        'uma cobrança como paga.',
    )
  } else if (!verifyWebhookSecret(request.headers, secret)) {
    console.warn(
      `[webhook pushinpay] header "${webhookHeaderName()}" ausente ou divergente — ` +
        'confira se o valor configurado no painel da Pushin Pay é o mesmo.',
    )
    return NextResponse.json({ error: 'Header de verificação inválido.' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const providerRequestId = payload.id
  const rawStatus = payload.status

  if (typeof providerRequestId !== 'string' || typeof rawStatus !== 'string') {
    return NextResponse.json({ error: 'Payload sem id ou status.' }, { status: 400 })
  }

  const status = mapStatus(rawStatus)
  const admin = createAdminClient()

  // A cobrança é localizada pelo id do provedor. RLS não se aplica aqui: o
  // webhook não tem sessão, e é justamente por isso que a busca é restrita
  // ao id do provedor e o user_id vem do registro encontrado.
  const { data: pix } = await admin
    .from('pix_transactions')
    .select('id, user_id, transaction_id, status, amount')
    // O provedor envia o id em maiúsculas nesta chamada, mas gravamos
    // em minúsculas — sem normalizar, o pagamento nunca casaria.
    .eq('provider_request_id', providerRequestId.toLowerCase())
    .maybeSingle()

  if (!pix) {
    // Evento de uma cobrança que não é nossa (ou já removida). Responder 200
    // evita que o provedor fique reenviando em loop.
    return NextResponse.json({ received: true, matched: false })
  }

  // Idempotência: reenvio do mesmo evento não pode duplicar lançamento nem
  // notificação.
  if (pix.status === status) {
    return NextResponse.json({ received: true, matched: true, changed: false })
  }

  const now = new Date().toISOString()

  await admin
    .from('pix_transactions')
    .update({
      status,
      paid_at: status === 'paid' ? now : null,
    })
    .eq('id', pix.id)

  // A transação de venda é a base do dashboard e dos saldos, então o espelho
  // precisa acontecer junto — nunca um atualiza sem o outro.
  if (pix.transaction_id) {
    const saleStatus =
      status === 'paid' ? 'approved' : status === 'expired' || status === 'canceled' ? 'canceled' : 'pending'

    await admin
      .from('transactions')
      .update({
        status: saleStatus,
        // Dados do pagador só existem depois do pagamento.
        payer_name: (payload.payer_name as string) ?? null,
        payer_document: (payload.payer_national_registration as string) ?? null,
      })
      .eq('id', pix.transaction_id)

    if (status === 'paid') {
      const { data: sale } = await admin
        .from('transactions')
        .select('net_amount')
        .eq('id', pix.transaction_id)
        .maybeSingle()

      const net = Number(sale?.net_amount ?? pix.amount)

      // Só entra no extrato o que foi efetivamente recebido.
      await admin.from('financial_entries').insert({
        user_id: pix.user_id,
        transaction_id: pix.transaction_id,
        type: 'income',
        description: 'Pagamento PIX recebido',
        amount: roundCurrency(net),
        balance_after: roundCurrency(net),
      })
    }
  }

  if (status === 'paid') {
    await createNotification({
      userId: pix.user_id,
      title: 'Pagamento aprovado',
      body: `Recebemos R$ ${Number(pix.amount).toFixed(2)} via PIX.`,
      type: 'payment',
      link: '/vendas',
    })
    // Dispara webhook de saída pro merchant (se ele configurou).
    // Fire-and-forget: não bloqueia a response do PSP.
    void dispatchToUser(pix.user_id, 'charge.paid', {
      transaction_id: pix.transaction_id,
      amount: Number(pix.amount),
      paid_at: new Date().toISOString(),
    })
  } else if (status === 'canceled' || status === 'expired') {
    await createNotification({
      userId: pix.user_id,
      title: status === 'expired' ? 'Cobrança PIX expirou' : 'Cobrança PIX cancelada',
      body: `A cobrança de R$ ${Number(pix.amount).toFixed(2)} não foi paga.`,
      type: 'pix',
      link: '/pix',
    })
  }

  return NextResponse.json({ received: true, matched: true, changed: true, status })
}