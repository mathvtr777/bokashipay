import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { classifyPixKey } from '@/lib/pix-key'
import { createNotification } from '@/services/notifications'
import { roundCurrency } from '@/services/payments/rules'

/**
 * Solicitação de saque.
 *
 * Regra central: **este endpoint não move dinheiro.** Ele registra o pedido e
 * deixa tudo como `pending`. Quem decide se o saque acontece é o administrador,
 * em `/admin/saques`. Uma solicitação aprovada aqui não é um pagamento.
 */

const Schema = z.object({
  amountBRL: z.number().positive('Informe um valor maior que zero.').max(100_000),
  pixKey: z.string().trim().min(5, 'Informe uma chave PIX válida.').max(140),
  holderName: z.string().trim().min(3, 'Informe o nome do titular.').max(140),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const raw = await request.json().catch(() => null)
  const parsed = Schema.safeParse({
    ...(raw as Record<string, unknown>),
    amountBRL: Number((raw as Record<string, unknown> | null)?.amountBRL),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  const { amountBRL, pixKey, holderName } = parsed.data

  const { type: pixKeyType, valid } = classifyPixKey(pixKey)
  if (!valid) {
    return NextResponse.json(
      { error: 'Chave PIX inválida. Use CPF, CNPJ, e-mail, telefone ou chave aleatória.' },
      { status: 400 },
    )
  }

  // Saldo disponível = aprovado menos já pago. Um pedido anterior em análise
  // não bloqueia o novo, porque ainda não saiu dinheiro.
  const [transactions, withdrawals] = await Promise.all([
    supabase.from('transactions').select('net_amount').eq('status', 'approved'),
    supabase.from('withdrawal_requests').select('amount_brl, status'),
  ])

  const received = (transactions.data ?? []).reduce((sum, t) => sum + Number(t.net_amount), 0)
  const alreadyPaid = (withdrawals.data ?? [])
    .filter((w) => w.status === 'completed')
    .reduce((sum, w) => sum + Number(w.amount_brl), 0)

  const available = roundCurrency(received - alreadyPaid)

  if (amountBRL > available) {
    return NextResponse.json(
      { error: 'Saldo insuficiente para solicitar este saque.' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: user.id,
      amount_brl: amountBRL,
      pix_key: pixKey,
      pix_key_type: pixKeyType,
      holder_name: holderName,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Não foi possível registrar a solicitação.' }, { status: 500 })
  }

  await createNotification({
    userId: user.id,
    title: 'Saque solicitado',
    body: `Solicitação de R$ ${amountBRL.toFixed(2)} aguardando aprovação.`,
    type: 'withdrawal',
    link: '/saques',
  })

  return NextResponse.json({ withdrawal: data }, { status: 201 })
}