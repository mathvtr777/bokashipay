import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TelegramClient } from '@/services/telegram'

/** POST /api/telegram/bots/[id]/test — Testa a conexão com o bot. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: bot, error } = await supabase
    .from('telegram_bots')
    .select('id, user_id, token_encrypted, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!bot) return NextResponse.json({ error: 'Bot não encontrado.' }, { status: 404 })
  if (!bot.token_encrypted) {
    return NextResponse.json({ error: 'Token não disponível para teste.' }, { status: 400 })
  }

  try {
    const client = new TelegramClient(bot.token_encrypted)
    const info = await client.getMe()
    return NextResponse.json({
      ok: true,
      bot: {
        id: info.id,
        username: info.username,
        first_name: info.first_name,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro ao testar conexão.' },
      { status: 200 },
    )
  }
}
