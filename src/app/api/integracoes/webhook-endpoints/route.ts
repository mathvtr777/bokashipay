import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'node:crypto'

/**
 * Gestão de webhooks de saída do merchant.
 *
 * O merchant cadastra uma URL e escolhe os eventos. A Bokashi dispara
 * POST pra essa URL quando o evento ocorre, com HMAC no header.
 *
 * O `secret` é gerado no momento de criação e devolvido UMA VEZ (similar
 * à API key). Em produção, guardamos o hash do secret (sha256), mas pra
 * HMAC de saída precisamos do secret plain — então guardamos o plain
 * mesmo (criptografado em produção; por enquanto plain).
 */

const PostSchema = z.object({
  url: z.string().trim().url('URL inválida.').max(500),
  events: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }
  const parsed = PostSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  const secret = randomBytes(32).toString('hex')

  const { data, error } = await supabase
    .from('webhook_endpoints')
    .insert({
      user_id: user.id,
      url: parsed.data.url,
      secret,
      events: parsed.data.events,
      active: true,
    })
    .select('id, url, events, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Não foi possível criar o webhook.' }, { status: 500 })
  }

  return NextResponse.json(
    {
      id: data.id,
      url: data.url,
      events: data.events,
      secret, // só desta vez
      created_at: data.created_at,
    },
    { status: 201 },
  )
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

  const { error } = await supabase
    .from('webhook_endpoints')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}