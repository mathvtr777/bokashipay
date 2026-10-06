import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/security/api-auth'

/**
 * Consulta uma cobrança pelo ID.
 *
 * Retorna o estado atual (`pending` | `paid` | `canceled` | `expired`).
 * RLS garante que o merchant só vê cobranças da própria conta.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await validateApiKey(request.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json(
      { error: { type: 'authentication', message: 'API key inválida.' } },
      { status: 401 },
    )
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json(
      { error: { type: 'invalid_request', message: 'ID obrigatório.' } },
      { status: 422 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('id, status, amount, fee, net_amount, created_at, payer_name, payer_document, description')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { error: { type: 'not_found', message: 'Cobrança não encontrada.' } },
      { status: 404 },
    )
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    amount: Number(data.amount),
    fee: Number(data.fee),
    net_amount: Number(data.net_amount),
    created_at: data.created_at,
    customer: data.payer_name
      ? {
          name: data.payer_name,
          document: data.payer_document,
        }
      : null,
    description: data.description,
  })
}