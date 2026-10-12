import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { TelegramClient } from '@/services/telegram'

const PatchBotSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

/** GET /api/telegram/bots/[id] — Detalhe de um bot. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data, error } = await supabase
    .from('telegram_bots')
    .select('id, user_id, name, bot_username, bot_id, status, error_message, webhook_url, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Bot não encontrado.' }, { status: 404 })

  return NextResponse.json({ bot: data })
}

/** PATCH /api/telegram/bots/[id] — Atualiza nome ou status. */
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

  const parsed = PatchBotSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  const row: { name?: string; status?: 'active' | 'inactive' } = {}
  if (parsed.data.name !== undefined) row.name = parsed.data.name
  if (parsed.data.status !== undefined) row.status = parsed.data.status

  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })
  }

  const { error } = await supabase.from('telegram_bots').update(row).eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

/** DELETE /api/telegram/bots/[id] — Remove um bot e seus fluxos. */
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

  // Busca o token encriptado para deletar webhook antes de remover do DB.
  const { data: bot } = await supabase
    .from('telegram_bots')
    .select('token_encrypted, bot_username')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!bot) return NextResponse.json({ error: 'Bot não encontrado.' }, { status: 404 })

  // Remove webhook do Telegram.
  if (bot.token_encrypted) {
    try {
      const client = new TelegramClient(bot.token_encrypted)
      await client.deleteWebhook()
    } catch {
      // Não falha se o webhook não puder ser removido.
    }
  }

  const { error } = await supabase.from('telegram_bots').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
