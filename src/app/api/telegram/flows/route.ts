import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const CreateFlowSchema = z.object({
  name: z.string().trim().min(3, 'Mínimo 3 caracteres.').max(80),
  description: z.string().trim().max(280).optional().nullable(),
  bot_id: z.string().uuid().optional().nullable(),
  steps: z
    .array(
      z.object({
        type: z.enum(['send_message', 'send_buttons', 'generate_pix']),
        text: z.string().optional(),
        buttons: z
          .array(z.object({ text: z.string(), data: z.string() }))
          .optional(),
        description: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  trigger_type: z.enum(['keyword', 'command', 'button', 'payment']).default('keyword'),
  trigger_value: z.string().trim().max(100).optional().nullable(),
  template_id: z.string().optional().nullable(),
})

/** GET /api/telegram/flows — Lista os fluxos do usuário. */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const botId = request.nextUrl.searchParams.get('bot_id')

  let query = supabase
    .from('telegram_flows')
    .select('id, user_id, bot_id, name, description, steps, active, trigger_type, trigger_value, runs_count, last_run_at, created_at, updated_at, telegram_bots(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (botId) query = query.eq('bot_id', botId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ flows: data ?? [] })
}

/** POST /api/telegram/flows — Cria um novo fluxo. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const parsed = CreateFlowSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('telegram_flows')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      bot_id: parsed.data.bot_id ?? null,
      steps: parsed.data.steps,
      trigger_type: parsed.data.trigger_type,
      trigger_value: parsed.data.trigger_value ?? null,
      template_id: parsed.data.template_id ?? null,
      active: false,
    })
    .select('id, user_id, bot_id, name, description, steps, active, trigger_type, trigger_value, runs_count, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, flow: data }, { status: 201 })
}
