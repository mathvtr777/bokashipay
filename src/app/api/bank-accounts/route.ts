import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isValidDocument } from '@/lib/validators'

/**
 * CRUD de contas bancárias.
 *
 * Em toda operação o `user_id` vem do token (JWT), nunca do corpo da requisição
 * — é isso que impede alguém de escrever na conta de outro usuário mesmo que a
 * policy RLS fosse alterada por engano.
 */

const Schema = z.object({
  bankCode: z.string().trim().min(1).max(8),
  bankName: z.string().trim().min(2).max(80),
  agency: z.string().trim().min(1).max(10),
  account: z.string().trim().min(1).max(20),
  accountDigit: z.string().trim().max(2).optional(),
  accountType: z.enum(['checking', 'savings']),
  holderName: z.string().trim().min(3).max(140),
  holderDocument: z.string().trim().refine(isValidDocument, 'CPF/CNPJ inválido.'),
  pixKey: z.string().trim().max(140).optional(),
})

/** Formulário (camelCase) → colunas do banco (snake_case). */
function toRow(input: z.infer<typeof Schema>) {
  return {
    bank_code: input.bankCode,
    bank_name: input.bankName,
    agency: input.agency,
    account: input.account,
    account_digit: input.accountDigit || null,
    account_type: input.accountType,
    holder_name: input.holderName,
    holder_document: input.holderDocument,
    pix_key: input.pixKey || null,
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  const { error } = await supabase.from('bank_accounts').insert({
    ...toRow(parsed.data),
    user_id: user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { id, setPrimary, ...rest } = (await request.json().catch(() => null)) as {
    id?: string
    setPrimary?: boolean
  }

  if (!id) return NextResponse.json({ error: 'Conta não informada.' }, { status: 400 })

  if (setPrimary === true) {
    // O índice único permite uma conta principal por usuário: liberamos a
    // antiga antes de marcar a nova.
    await supabase.from('bank_accounts').update({ is_primary: false }).eq('user_id', user.id).eq('is_primary', true)

    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_primary: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const parsed = Schema.safeParse(rest)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from('bank_accounts')
    .update(toRow(parsed.data))
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Conta não informada.' }, { status: 400 })

  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}