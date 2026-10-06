import type { NextRequest } from 'next/server'

/**
 * Rate limiter em memória com janela deslizante.
 *
 * Persiste enquanto a instância do servidor viver — em Vercel, cada cold start
 * zera. Pra hardening de produção real, troque por Upstash/Redis. Mesmo em
 * in-memory, freia tentativas em rajada (o caso comum de pentest).
 *
 * Limite por chave (chamada típica: IP do cliente). Identifica IP via
 * `x-forwarded-for` (Vercel/Cloudflare), com fallback pra `x-real-ip`.
 */

interface Bucket {
  /** Timestamps (ms) das requests dentro da janela atual. */
  timestamps: number[]
}

interface LimiterOptions {
  /** Máximo de requests permitidas dentro da janela. */
  limit: number
  /** Tamanho da janela, em segundos. */
  windowSeconds: number
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>()

  constructor(private readonly opts: LimiterOptions) {}

  /**
   * Verifica se a chave pode fazer uma request. Retorna `{ allowed: true }` se
   * pode, ou `{ allowed: false, retryAfterSeconds }` se está bloqueada.
   *
   * "Verifica" já consome 1 slot da janela: cada chamada conta como 1 request.
   */
  hit(key: string): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
    const now = Date.now()
    const windowMs = this.opts.windowSeconds * 1000
    const cutoff = now - windowMs

    const bucket = this.buckets.get(key) ?? { timestamps: [] }

    // Descarta timestamps fora da janela.
    bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff)

    if (bucket.timestamps.length >= this.opts.limit) {
      // O 1º timestamp é o que vai expirar primeiro; ele define o retry.
      const oldest = bucket.timestamps[0]!
      const retryAfterMs = oldest + windowMs - now
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
      this.buckets.set(key, bucket)
      return { allowed: false, retryAfterSeconds }
    }

    bucket.timestamps.push(now)
    this.buckets.set(key, bucket)
    return { allowed: true }
  }

  /**
   * Limpa periodicamente buckets ociosos pra evitar leak de memória.
   * Chamado pelo caller a cada N minutos (não tem timer interno pra não
   * manter referência viva em ambientes serverless).
   */
  sweep(): void {
    const now = Date.now()
    const windowMs = this.opts.windowSeconds * 1000
    const cutoff = now - windowMs
    for (const [key, bucket] of this.buckets) {
      bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff)
      if (bucket.timestamps.length === 0) this.buckets.delete(key)
    }
  }
}

/**
 * Extrai o IP do cliente. Confia no primeiro IP do `x-forwarded-for` (Vercel
 * define; pode ser spoofed se o deploy não tira o IP antes de chegar no app).
 */
export function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const xri = request.headers.get('x-real-ip')
  if (xri) return xri
  return 'unknown'
}

// Limites instanciados uma vez por módulo (compartilhados entre requests).
export const loginLimiter = new RateLimiter({ limit: 5, windowSeconds: 60 })
export const registerLimiter = new RateLimiter({ limit: 3, windowSeconds: 60 })
/** API pública: 60 req/min por API key (não por IP). */
export const apiLimiter = new RateLimiter({ limit: 60, windowSeconds: 60 })

// Sweep a cada 5 minutos. Em Vercel, cada cold start zera — em produção
// durável o sweep impede que o Map cresça indefinidamente.
if (typeof setInterval !== 'undefined') {
  const intervalHandle = setInterval(
    () => {
      loginLimiter.sweep()
      registerLimiter.sweep()
      apiLimiter.sweep()
    },
    5 * 60 * 1000,
  )
  // Não trava o processo em testes/CI.
  if (typeof intervalHandle?.unref === 'function') intervalHandle.unref()
}