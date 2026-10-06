import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

/**
 * CRUD de produtos do merchant.
 *
 * Fase 1: gestão (criar/editar/excluir/toggle status). Checkout público
 * (`/checkout/[slug]`) entra em fase posterior — esta rota não gera
 * cobrança nem webhook.
 *
 * O `user_id` vem do token, nunca do body — defesa em profundidade
 * caso uma policy RLS seja alterada por engano.
 */

const ProductSchema = z.object({
  name: z.string().trim().min(3, 'Mínimo 3 caracteres.').max(100),
  slug: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres.')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens.'),
  description: z.string().trim().max(2000).optional().nullable(),
  price_cents: z.number().int().min(0).max(99_999_999),
  image_url: z
    .string()
    .trim()
    .url('URL inválida.')
    .max(2000)
    .optional()
    .or(z.literal(''))
    .nullable(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  model: z.enum(['one_time', 'subscription']).default('one_time'),
  checkout_settings: z
    .object({
      primaryColor: z.string().optional(),
      bannerUrl: z.string().optional(),
      successMessage: z.string().optional(),
      requirePhone: z.boolean().optional(),
      requireDocument: z.boolean().optional(),
    })
    .optional()
    .default({}),
})

const PatchSchema = ProductSchema.partial().extend({
  id: z.string().uuid(),
})

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function toRow(input: z.infer<typeof ProductSchema>) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    price_cents: input.price_cents,
    image_url: input.image_url || null,
    status: input.status,
    model: input.model,
    checkout_settings: input.checkout_settings ?? {},
  }
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null as null }
  return { supabase, user }
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const parsed = ProductSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  // Se o cliente mandou slug vazio, geramos a partir do nome.
  const finalSlug = parsed.data.slug || slugify(parsed.data.name)
  if (!/^[a-z0-9-]{3,60}$/.test(finalSlug)) {
    return NextResponse.json(
      { error: 'Slug inválido após geração automática.' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ ...toRow({ ...parsed.data, slug: finalSlug }), user_id: user.id })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Já existe um produto com este slug.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }
  const { id, ...rest } = parsed.data
  // Tipamos como Partial do Insert pra casar com o Update estrito do database.types.ts.
  const row: Partial<Database['public']['Tables']['products']['Insert']> = {}
  if (rest.name !== undefined) row.name = rest.name
  if (rest.slug !== undefined) row.slug = rest.slug
  if (rest.description !== undefined) row.description = rest.description || null
  if (rest.price_cents !== undefined) row.price_cents = rest.price_cents
  if (rest.image_url !== undefined) row.image_url = rest.image_url || null
  if (rest.status !== undefined) row.status = rest.status
  if (rest.model !== undefined) row.model = rest.model
  if (rest.checkout_settings !== undefined) {
    row.checkout_settings = rest.checkout_settings ?? {}
  }

  const { error } = await supabase
    .from('products')
    .update(row)
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Já existe outro produto com este slug.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Produto não informado.' }, { status: 400 })

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}