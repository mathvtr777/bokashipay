import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verificação de assinatura de webhooks.
 *
 * Vive em `lib` e não em `services/pix` porque serve a provedores diferentes:
 * a Pushin Pay usa header customizado de valor estático (ver
 * `services/pix`), enquanto a UTMFY assina o corpo com HMAC. Misturar os dois
 * num lugar só convida a aplicar a verificação errada num deles.
 */

/**
 * Confere assinatura HMAC-SHA256 de um corpo cru, em tempo constante.
 *
 * Devolve `false` — em vez de lançar — quando falta assinatura ou segredo, para
 * que o chamador decida a política em vez de tomar uma exceção como resposta.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')

  // timingSafeEqual exige o mesmo tamanho de entrada.
  const normalize = (value: string) =>
    Buffer.from(value.padEnd(expected.length, '\0').slice(0, expected.length), 'utf8')

  return timingSafeEqual(normalize(expected), normalize(signature))
}