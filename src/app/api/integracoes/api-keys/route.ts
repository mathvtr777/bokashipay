import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  generateApiKey,
  hashApiKey,
} from '@/lib/security/api-auth'

/**
 * Gestão de API keys pelo merchant.
 *
 * POST cria uma chave nova. A chave plain é devolvida 1x na response — depois
 * disso, só `prefix...suffix` aparece na listagem.
 *
 * DELETE revoga uma chave (marca revoked_at = now()). Não deleta, pra
 * manter histórico.
 */

const PostSchema = z.object({
  name: z.string().trim().min(1).max(80),
  expires_at: z.string().datetime().optional().nullable(),
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

  const { key, prefix, suffix } = generateApiKey()
  const keyHash = await hashApiKey(key)

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      prefix,
      suffix,
      key_hash: keyHash,
      expires_at: parsed.data.expires_at ?? null,
    })
    .select('id, name, prefix, suffix, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Não foi possível criar a chave.' }, { status: 500 })
  }

  return NextResponse.json(
    {
      id: data.id,
      name: data.name,
      // A chave plain só volta nesta response.
      full_key: key,
      prefix: data.prefix,
      suffix: data.suffix,
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
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('revoked_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}