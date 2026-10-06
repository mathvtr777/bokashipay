import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { createNotification } from '@/services/notifications'
import { roundCurrency } from '@/services/payments/rules'
import type { Database } from '@/lib/database.types'

/**
 * Decisão do administrador sobre um saque.
 *
 * Usa o service role de propósito: a policy RLS de `withdrawal_requests` só
 * deixa o próprio usuário ver a própria solicitação, e o administrador precisa
 * enxergar as de todos. A autorização vem da lista `ADMIN_USER_EMAILS` e é
 * conferida aqui, no servidor — nunca no cliente.
 *
 * As transições são explícitas: um pedido não pula de `pending` para
 * `completed`. Ele passa por `approved`, porque são dois eventos diferentes —
 * a decisão de pagar e o fato de o pagamento ter acontecido.
 */

const Schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), id: z.string().uuid() }),
  z.object({ action: z.literal('reject'), id: z.string().uuid(), reason: z.string().trim().max(280).optional() }),
  z.object({
    action: z.literal('complete'),
    id: z.string().uuid(),
    payoutReference: z.string().trim().max(120).optional(),
  }),
])

/** Transições permitidas, derivadas do status atual. */
const ALLOWED: Record<string, string[]> = {
  approve: ['pending'],
  reject: ['pending'],
  complete: ['approved'],
}

/**
 * Fila de solicitações para o administrador.
 *
 * Usa o service role porque o RLS de `withdrawal_requests` só mostra a cada
 * usuário a própria solicitação — juntar as de todos é justamente o trabalho
 * deste painel. A autorização vem de `ADMIN_USER_EMAILS`, conferida abaixo.
 *
 * A chave PIX volta inteira aqui: sem ela não há como executar o pagamento.
 * É a rota mais sensível do sistema, e por isso existe a lista de admins em
 * vez de qualquer papel gravado no banco.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Backend não configurado.' }, { status: 500 })
  }

  const adminDb = createAdminClient()

  const { data, error } = await adminDb
    .from('withdrawal_requests')
    .select('*, profiles:profiles!withdrawal_requests_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ withdrawals: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Backend não configurado.' }, { status: 500 })
  }

  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user: admin },
  } = await supabase.auth.getUser()

  if (!admin) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const adminDb = createAdminClient()
  const { action, id } = parsed.data

  const { data: request_ } = await adminDb
    .from('withdrawal_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!request_) {
    return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 })
  }

  // Transição inválida é um erro explícito: evita que um clique duplo marque
  // como concluído um pedido que ninguém aprovou.
  if (!ALLOWED[action].includes(request_.status)) {
    return NextResponse.json(
      { error: `Não é possível ${action} uma solicitação com status "${request_.status}".` },
      { status: 409 },
    )
  }

  const now = new Date().toISOString()

  const patch: Database['public']['Tables']['withdrawal_requests']['Update'] = {
    reviewed_by: admin.id,
    reviewed_at: now,
  }

  if (action === 'approve') {
    patch.status = 'approved'
  }

  if (action === 'reject') {
    patch.status = 'rejected'
    patch.rejection_reason = parsed.data.reason || 'Não especificado pelo administrador.'
  }

  if (action === 'complete') {
    patch.status = 'completed'
    patch.completed_at = now
    patch.payout_reference = parsed.data.payoutReference || null
  }

  const { data: updated, error } = await adminDb
    .from('withdrawal_requests')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auditoria: a fila é descartável, o histórico não.
  await adminDb.from('admin_actions').insert({
    admin_id: admin.id,
    action,
    entity: 'withdrawal_request',
    entity_id: id,
    details: {
      amount_brl: request_.amount_brl,
      pix_key: request_.pix_key,
      previous_status: request_.status,
      new_status: updated.status,
    },
  })

  if (action === 'complete') {
    // O extrato só registra a saída quando o dinheiro efetivamente saiu.
    // `balance_after` é calculado de verdade: total aprovado menos tudo o que
    // já foi pago, incluindo este saque.
    const [sales, paidWithdrawals] = await Promise.all([
      adminDb
        .from('transactions')
        .select('net_amount')
        .eq('user_id', request_.user_id)
        .eq('status', 'approved')
        .returns<{ net_amount: number }[]>(),
      adminDb
        .from('withdrawal_requests')
        .select('amount_brl')
        .eq('user_id', request_.user_id)
        .eq('status', 'completed')
        .returns<{ amount_brl: number }[]>(),
    ])

    const receivedNow = (sales.data ?? []).reduce((sum, t) => sum + Number(t.net_amount), 0)
    const paidNow = (paidWithdrawals.data ?? []).reduce((sum, w) => sum + Number(w.amount_brl), 0)

    await adminDb.from('financial_entries').insert({
      user_id: request_.user_id,
      withdrawal_request_id: id,
      type: 'withdrawal',
      description: 'Saque PIX realizado',
      amount: roundCurrency(Number(request_.amount_brl)),
      balance_after: roundCurrency(receivedNow - paidNow),
    })

    await createNotification({
      userId: request_.user_id,
      title: 'Saque concluído',
      body: `O saque de R$ ${Number(request_.amount_brl).toFixed(2)} foi realizado.`,
      type: 'withdrawal',
      link: '/saques',
    })
  } else if (action === 'approve') {
    await createNotification({
      userId: request_.user_id,
      title: 'Saque aprovado',
      body: `Sua solicitação de R$ ${Number(request_.amount_brl).toFixed(2)} foi aprovada.`,
      type: 'withdrawal',
      link: '/saques',
    })
  } else if (action === 'reject') {
    await createNotification({
      userId: request_.user_id,
      title: 'Saque recusado',
      body: patch.rejection_reason ?? 'Não especificado.',
      type: 'withdrawal',
      link: '/saques',
    })
  }

  return NextResponse.json({ withdrawal: updated })
}