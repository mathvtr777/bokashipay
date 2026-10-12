import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const PatchFlowSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
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
    .optional(),
  active: z.boolean().optional(),
  trigger_type: z.enum(['keyword', 'command', 'button', 'payment']).optional(),
  trigger_value: z.string().trim().max(100).optional().nullable(),
})

/** PATCH /api/telegram/flows/[id] — Atualiza um fluxo. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const parsed = PatchFlowSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  type FlowUpdate = Partial<{
    name: string
    description: string | null
    bot_id: string | null
    steps: unknown[]
    active: boolean
    trigger_type: string
    trigger_value: string | null
  }>
  const row: FlowUpdate = {}
  if (parsed.data.name !== undefined) row.name = parsed.data.name
  if (parsed.data.description !== undefined) row.description = parsed.data.description ?? null
  if (parsed.data.bot_id !== undefined) row.bot_id = parsed.data.bot_id ?? null
  if (parsed.data.steps !== undefined) row.steps = parsed.data.steps
  if (parsed.data.active !== undefined) row.active = parsed.data.active
  if (parsed.data.trigger_type !== undefined) row.trigger_type = parsed.data.trigger_type
  if (parsed.data.trigger_value !== undefined) row.trigger_value = parsed.data.trigger_value ?? null

  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('telegram_flows')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(row as any)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE /api/telegram/flows/[id] — Remove um fluxo. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { error } = await supabase
    .from('telegram_flows')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
