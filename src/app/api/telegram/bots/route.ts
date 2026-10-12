import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { TelegramClient, buildTelegramWebhookUrl } from '@/services/telegram'
import type { TelegramBot } from '@/lib/types'

const CreateBotSchema = z.object({
  token: z.string().trim().min(20, 'Token inválido.'),
  name: z.string().trim().min(1, 'Nome é obrigatório.').max(80).optional(),
})

const MAX_BOTS_PER_USER = 50

/** GET /api/telegram/bots — Lista os bots do usuário. */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data, error } = await supabase
    .from('telegram_bots')
    .select('id, user_id, name, bot_username, bot_id, status, error_message, webhook_url, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bots: data ?? [] })
}

/** POST /api/telegram/bots — Conecta um novo bot. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  // Limite de bots por usuário.
  const { count } = await supabase
    .from('telegram_bots')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
  if ((count ?? 0) >= MAX_BOTS_PER_USER) {
    return NextResponse.json(
      { error: `Limite de ${MAX_BOTS_PER_USER} bots atingido.` },
      { status: 400 },
    )
  }

  const parsed = CreateBotSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  const { token, name } = parsed.data

  // 1. Validar token com a API do Telegram.
  let botInfo: { id: number; is_bot: boolean; first_name: string; username: string }
  try {
    const client = new TelegramClient(token)
    botInfo = await client.getMe()
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Token inválido.' },
      { status: 400 },
    )
  }

  if (!botInfo.is_bot) {
    return NextResponse.json({ error: 'O token não pertence a um bot.' }, { status: 400 })
  }

  // 2. Verificar se o bot já está conectado por outro usuário.
  const { data: existing } = await supabase
    .from('telegram_bots')
    .select('id, user_id')
    .eq('bot_id', botInfo.id)
    .maybeSingle()

  if (existing && existing.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Este bot já está conectado a outra conta.' },
      { status: 409 },
    )
  }

  // 3. Se o bot já existe para este usuário, reativar.
  if (existing && existing.user_id === user.id) {
    const { data, error } = await supabase
      .from('telegram_bots')
      .update({ status: 'active', error_message: null })
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select('id, user_id, name, bot_username, bot_id, status, webhook_url, created_at, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, bot: data }, { status: 200 })
  }

  // 4. Criar novo bot.
  const tokenHash = await hashToken(token)
  const webhookUrl = buildTelegramWebhookUrl(
    process.env.PUSHINPAY_PUBLIC_URL ?? `https://${request.headers.get('host') ?? 'localhost'}`,
    '{{bot_id}}', // substituído depois com o ID real
  )

  const { data, error } = await supabase
    .from('telegram_bots')
    .insert({
      user_id: user.id,
      name: name ?? `${botInfo.first_name} (${botInfo.username})`,
      bot_username: botInfo.username,
      bot_id: botInfo.id,
      token_hash: tokenHash,
      token_encrypted: token, // TODO: criptografar com AES antes de gravar
      status: 'active',
      webhook_url: webhookUrl,
    })
    .select('id, user_id, name, bot_username, bot_id, status, webhook_url, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 5. Atualizar webhook_url com o ID real do bot.
  const realWebhookUrl = buildTelegramWebhookUrl(
    process.env.PUSHINPAY_PUBLIC_URL ?? `https://${request.headers.get('host') ?? 'localhost'}`,
    data.id,
  )

  try {
    const client = new TelegramClient(token)
    await client.setWebhook(realWebhookUrl)
    await supabase.from('telegram_bots').update({ webhook_url: realWebhookUrl }).eq('id', data.id)
  } catch {
    // Webhook falhou mas o bot foi salvo — marca erro e continua.
    await supabase
      .from('telegram_bots')
      .update({ status: 'error', error_message: 'Webhook não pôde ser configurado.' })
      .eq('id', data.id)
  }

  return NextResponse.json({ ok: true, bot: { ...data, webhook_url: realWebhookUrl } }, { status: 201 })
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
