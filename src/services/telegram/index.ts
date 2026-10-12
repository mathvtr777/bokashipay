import 'server-only'

export interface TelegramBotInfo {
  id: number
  is_bot: boolean
  first_name: string
  username: string
}

/** Client for the Telegram Bot API. */
export class TelegramClient {
  private readonly baseUrl: string
  private token: string

  constructor(token: string) {
    this.baseUrl = (process.env.TELEGRAM_API_URL ?? 'https://api.telegram.org').replace(/\/+$/, '')
    this.token = token
  }

  /** Validate token by calling getMe. Throws if token is invalid. */
  async getMe(): Promise<TelegramBotInfo> {
    const url = `${this.baseUrl}/bot${this.token}/getMe`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    const data = (await res.json()) as { ok: boolean; result?: TelegramBotInfo; description?: string }
    if (!data.ok) {
      throw new Error(data.description ?? 'Token inválido')
    }
    return data.result as TelegramBotInfo
  }

  /** Set the webhook URL for this bot. */
  async setWebhook(webhookUrl: string): Promise<void> {
    const url = `${this.baseUrl}/bot${this.token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!data.ok) {
      throw new Error(data.description ?? 'Falha ao configurar webhook')
    }
  }

  /** Remove the webhook (stop receiving updates). */
  async deleteWebhook(): Promise<void> {
    const url = `${this.baseUrl}/bot${this.token}/deleteWebhook`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!data.ok) {
      throw new Error(data.description ?? 'Falha ao remover webhook')
    }
  }

  /** Send a message to a chat. */
  async sendMessage(chatId: number, text: string): Promise<void> {
    const url = `${this.baseUrl}/bot${this.token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!data.ok) {
      throw new Error(data.description ?? 'Falha ao enviar mensagem')
    }
  }

  /** Send a message with inline keyboard buttons. */
  async sendMessageWithButtons(
    chatId: number,
    text: string,
    buttons: { text: string; callback_data: string }[],
  ): Promise<void> {
    const url = `${this.baseUrl}/bot${this.token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [buttons] },
      }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!data.ok) {
      throw new Error(data.description ?? 'Falha ao enviar mensagem com botões')
    }
  }
}

/** Build the webhook URL that Telegram will call. */
export function buildTelegramWebhookUrl(origin: string, botId: string): string {
  return `${origin.replace(/\/+$/, '')}/api/telegram/webhook?bot_id=${botId}`
}
