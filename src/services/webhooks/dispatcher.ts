import { createAdminClient } from '@/lib/supabase/admin'
import {
  WEBHOOK_DELIVERY_HEADER,
  WEBHOOK_EVENT_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  signWebhookPayload,
} from '@/lib/security/webhook-signer'

/**
 * Dispara um evento pra todas as webhooks ativas do merchant que assinaram
 * esse evento. Retry com backoff em caso de 5xx / erro de rede.
 *
 * Não bloqueia a request que originou o evento: roda fire-and-forget com
 * `void dispatchToUser(...)`. Pra confiabilidade real, esse padrão devia
 * usar uma fila (ex: Upstash QStash). Aqui é o mínimo viável.
 */

const MAX_ATTEMPTS = 3
const BACKOFF_MS = [500, 2_000, 8_000]

export async function dispatchToUser(
  userId: string,
  event: string,
  data: unknown,
): Promise<void> {
  const admin = createAdminClient()
  const { data: endpoints, error } = await admin
    .from('webhook_endpoints')
    .select('id, url, secret')
    .eq('user_id', userId)
    .eq('active', true)
    .contains('events', [event])

  if (error || !endpoints || endpoints.length === 0) return

  const payload = JSON.stringify({ event, data, delivered_at: new Date().toISOString() })

  await Promise.allSettled(
    (endpoints as { id: string; url: string; secret: string }[]).map((ep) =>
      deliverWithRetry(ep, payload, event),
    ),
  )

  // Atualiza last_delivery_at em batch (não bloqueia)
  void admin
    .from('webhook_endpoints')
    .update({ last_delivery_at: new Date().toISOString() })
    .in(
      'id',
      (endpoints as { id: string }[]).map((e) => e.id),
    )
}

async function deliverWithRetry(
  endpoint: { id: string; url: string; secret: string },
  payload: string,
  event: string,
): Promise<void> {
  const admin = createAdminClient()
  const signature = signWebhookPayload(payload, endpoint.secret)
  let lastStatus: number | null = null
  let lastError: string | null = null

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [WEBHOOK_SIGNATURE_HEADER]: signature,
          [WEBHOOK_EVENT_HEADER]: event,
          [WEBHOOK_DELIVERY_HEADER]: `${endpoint.id}:${Date.now()}`,
        },
        body: payload,
        signal: AbortSignal.timeout(15_000),
      })
      lastStatus = res.status
      lastError = res.ok
        ? null
        : `HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`
      if (res.ok) break
      // 4xx não vale a pena tentar de novo — só 5xx e network error
      if (res.status >= 400 && res.status < 500) break
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network error'
    }
    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(BACKOFF_MS[attempt] ?? 8_000)
    }
  }

  // Grava o resultado da última tentativa
  void admin
    .from('webhook_endpoints')
    .update({ last_status: lastStatus, last_error: lastError })
    .eq('id', endpoint.id)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}