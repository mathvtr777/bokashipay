import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Assinatura HMAC-SHA256 do corpo do webhook. O merchant verifica com o
 * mesmo secret pra garantir que o POST veio da Bokashi.
 *
 * Header: `X-Bokashi-Signature: sha256=<hex>`
 */

export function signWebhookPayload(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  return `sha256=${hmac.digest('hex')}`
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature.startsWith('sha256=')) return false
  const received = signature.slice(7)
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  if (received.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected))
}

/** Header tipotômico usado pra enviar a assinatura. */
export const WEBHOOK_SIGNATURE_HEADER = 'x-bokashipay-signature'
export const WEBHOOK_EVENT_HEADER = 'x-bokashipay-event'
export const WEBHOOK_DELIVERY_HEADER = 'x-bokashipay-delivery'