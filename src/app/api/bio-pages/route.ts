import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/bio-pages — upsert da Bio Page do merchant.
 *
 * Requer migration 0008 rodada — se a tabela não existe, devolve 503
 * com mensagem clara para o operador.
 *
 * O `user_id` vem do token, nunca do body. A constraint `bio_pages_slug_unique`
 * é global; se outro usuário já pegou o slug, o insert/update falha com
 * 23505 e respondemos 409.
 */

const BioPageSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres.')
    .max(52, 'Máximo 52 caracteres.')
    .regex(/^[a-z0-9_-]{3,52}$/, 'Use apenas letras minúsculas, números, _ e -.'),
  displayName: z.string().trim().max(80).default(''),
  bio: z.string().max(280).default(''),
  avatarUrl: z
    .string()
    .max(200_000) // data URL do avatar (até ~150KB comprimidos)
    .nullable()
    .optional()
    .or(z.literal('')),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const parsed = BioPageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('bio_pages')
    .upsert(
      {
        user_id: user.id,
        slug: parsed.data.slug,
        display_name: parsed.data.displayName || null,
        bio: parsed.data.bio || null,
        avatar_url: parsed.data.avatarUrl || null,
        active: true,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single()

  if (error) {
    // Tabela inexistente (42P01 = undefined_table, PGRST205 = PostgREST
    // "Could not find the table") — pede para rodar a migration.
    if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            'A tabela bio_pages ainda não existe. Rode a migration 0008_bio_pages.sql no Supabase.',
        },
        { status: 503 },
      )
    }
    // Slug já usado por outro usuário.
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Este slug já está em uso por outra conta. Escolha outro.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, page: data }, { status: 200 })
}
