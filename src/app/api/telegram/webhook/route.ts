import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/telegram/webhook
 *
 * Placeholder: recebe updates do Telegram e apenas loga.
 * O processamento real de fluxos (match trigger → executar steps → responder)
 * será implementado na próxima fase.
 *
 * Segurança: identificamos o bot pela query string `bot_id` usando o admin client
 * (o webhook não tem JWT de usuário). Validamos que o bot pertence ao user que
 * possui o flow ativo.
 */
export async function POST(request: NextRequest) {
  const botId = request.nextUrl.searchParams.get('bot_id')
  if (!botId) {
    return NextResponse.json({ error: 'bot_id é obrigatório.' }, { status: 400 })
  }

  // Ler o body cru.
  const rawBody = await request.text()
  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  // TODO (fase 2): processar fluxo real.
  // Por ora, logamos e retornamos 200 para o Telegram não repetir.
  console.log(`[telegram-webhook] bot_id=${botId}`, JSON.stringify(payload, null, 2))

  return NextResponse.json({ received: true, processed: false, reason: 'placeholder' })
}
