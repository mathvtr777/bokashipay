import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/services/notifications'

/**
 * Sincroniza o status de uma cobrança PIX consultando o provedor.
 *
 * Este é o único caminho que pode marcar um PIX como `paid`: o status vem da
 * resposta do PSP, nunca do cliente. Nada aqui "confirma" um pagamento por
 * Optimismo — se o provedor não responder, a cobrança continua pendente.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 })
  }

  const Schema = z.object({ pixId: z.string().uuid() })
  const parsed = Schema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Cobrança inválida.' }, { status: 400 })
  }

  const { data: pix } = await supabase
    .from('pix_transactions')
    .select('*')
    .eq('id', parsed.data.pixId)
    .maybeSingle()

  if (!pix) return NextResponse.json({ error: 'Cobrança não encontrada.' }, { status: 404 })

  // Sem identificador do provedor, não há o que consultar: é uma cobrança
  // local sem provedor configurado, e continua pendente.
  if (!pix.provider_request_id) {
    return NextResponse.json({ status: pix.status, checked: false })
  }

  const { getPixProvider } = await import('@/services/pix')
  const provider = getPixProvider()

  if (!provider.isConfigured()) {
    return NextResponse.json({ status: pix.status, checked: false })
  }

  let remoteStatus: string
  let paidAt: string | undefined

  try {
    // O provedor devolve o id em maiúsculas na consulta; gravamos em
    // minúsculas. Enviamos minúsculas para casar com a doc de consulta.
    const result = await provider.getChargeStatus(pix.provider_request_id.toLowerCase())
    remoteStatus = result.status
    paidAt = result.paidAt
    console.log(`[pix/status] ${pix.provider_request_id} -> ${remoteStatus}`)
  } catch (error) {
    // Falha do provedor não muda o estado local — evita marcar como pago por engano.
    console.warn(
      `[pix/status] falha ao consultar ${pix.provider_request_id}:`,
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json({ status: pix.status, checked: false })
  }

  // O provedor já normaliza o vocabulário para o nosso domínio; qualquer
  // estado que ele não reconheça chegou como 'pending'.
  const mapped = remoteStatus

  if (mapped !== pix.status) {
    await supabase
      .from('pix_transactions')
      .update({
        status: mapped,
        paid_at: mapped === 'paid' ? (paidAt ?? new Date().toISOString()) : null,
      })
      .eq('id', pix.id)

    // Espelha na transação de venda, que é a base do dashboard.
    if (pix.transaction_id) {
      const saleStatus = mapped === 'paid' ? 'approved' : mapped === 'expired' ? 'canceled' : 'pending'
      await supabase
        .from('transactions')
        .update({ status: saleStatus })
        .eq('id', pix.transaction_id)
    }

    if (mapped === 'paid') {
      await createNotification({
        userId: user.id,
        title: 'Pagamento aprovado',
        body: `Cobrança PIX de R$ ${Number(pix.amount).toFixed(2)} confirmada.`,
        type: 'payment',
        link: '/vendas',
      })
    }
  }

  return NextResponse.json({ status: mapped, checked: true })
}