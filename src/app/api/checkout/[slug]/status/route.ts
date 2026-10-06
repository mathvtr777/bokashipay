import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Status de uma transação específica, usado pelo checkout público pra
 * detectar pagamento confirmado sem precisar de Realtime.
 *
 * Retorna `{ paid: boolean }`. 404 se a transação não existir.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const txId = _request.nextUrl.searchParams.get('transactionId')
  if (!txId) {
    return NextResponse.json({ error: 'transactionId não informado.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: product, error: prodErr } = await admin
    .from('products')
    .select('id, user_id')
    .eq('slug', slug)
    .maybeSingle()
  if (prodErr || !product) {
    return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 })
  }

  const { data: tx, error: txErr } = await admin
    .from('transactions')
    .select('id, status')
    .eq('id', txId)
    .eq('product_id', product.id) // garante que a tx é deste produto
    .maybeSingle()
  if (txErr || !tx) {
    return NextResponse.json({ paid: false, status: 'not_found' as const })
  }
  return NextResponse.json({ paid: tx.status === 'approved', status: tx.status })
}