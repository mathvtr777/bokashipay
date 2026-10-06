import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import type { ApiKey } from '@/lib/types'

/**
 * Autenticação por API Key (Bearer token).
 *
 * A chave completa NUNCA é gravada — só o hash. Aqui validamos a chave
 * recebida contra o hash armazenado usando scrypt (não precisa de lib
 * extra, vem no node:crypto).
 *
 * Formato do hash: `scrypt$N$r$p$<salt_hex>$<hash_hex>`
 *
 * Formato da chave: `bok_live_<prefix4-12>_<random16+>`
 *   exemplo: bok_live_a1b2c3d4_kX9p2vQwR8sN5tU7
 *
 * Storage: gravamos `prefix` (4-12 chars), `suffix` (4 últimos chars) e
 * `key_hash` (scrypt). A query filtra por prefix+suffix (índice composto
 * se precisar) e compara o hash pra cada candidato.
 */

const N = 16384
const r = 8
const p = 1
const KEY_LEN = 32
const SALT_LEN = 16

/** Hash de uma chave usando scrypt. Sal gerado aleatoriamente. */
export async function hashApiKey(key: string): Promise<string> {
  const salt = randomBytes(SALT_LEN)
  const derived = await scryptAsync(key, salt, KEY_LEN, N, r, p)
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${derived.toString('hex')}`
}

/** Compara uma chave plain com um hash. timing-safe. */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  const parts = hash.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const cn = Number(parts[1])
  const cr = Number(parts[2])
  const cp = Number(parts[3])
  const saltHex = parts[4]
  const derivedHex = parts[5]
  if (!cn || !cr || !cp || !saltHex || !derivedHex) return false

  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(derivedHex, 'hex')
  const candidate = await scryptAsync(key, salt, expected.length, cn, cr, cp)
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

export type ApiKeyAuth =
  | { ok: true; apiKey: ApiKey; userId: string }
  | {
      ok: false
      reason: 'missing' | 'malformed' | 'invalid' | 'revoked' | 'expired'
    }

/**
 * Valida o header `Authorization: Bearer <key>` e devolve a ApiKey.
 *
 * Erros:
 *   - missing: header não veio
 *   - malformed: scheme errado ou sem token
 *   - invalid: formato da chave bate mas hash não confere
 *   - revoked: chave existe mas foi revogada
 *   - expired: chave passou da expires_at
 */
export async function validateApiKey(
  authHeader: string | null,
): Promise<ApiKeyAuth> {
  if (!authHeader) return { ok: false, reason: 'missing' }
  const [scheme, key] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !key) {
    return { ok: false, reason: 'malformed' }
  }

  // Formato: bok_(live|test)_<prefix>_<random>
  if (!/^bok_(live|test)_[a-z0-9]{4,12}_[A-Za-z0-9]{16,}$/.test(key)) {
    return { ok: false, reason: 'invalid' }
  }

  const parts = key.split('_')
  const prefix = parts[2] ?? ''
  const suffix = key.slice(-4)

  const supabase = await createClient()
  const { data: candidates, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('prefix', prefix)
    .eq('suffix', suffix)
    .is('revoked_at', null)

  if (error || !candidates) return { ok: false, reason: 'invalid' }

  for (const candidate of candidates as ApiKey[]) {
    if (candidate.expires_at && new Date(candidate.expires_at) < new Date()) {
      continue
    }
    if (await verifyApiKey(key, candidate.key_hash)) {
      // Fire-and-forget: atualizar last_used_at não pode bloquear a API.
      void supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', candidate.id)
      return { ok: true, apiKey: candidate, userId: candidate.user_id }
    }
  }

  return { ok: false, reason: 'invalid' }
}

/** Gera uma nova API Key no formato `bok_live_<prefix>_<random>`. */
export function generateApiKey(): { key: string; prefix: string; suffix: string } {
  const prefix = randomBase62(8).toLowerCase()
  const random = randomBase62(24)
  const fullKey = `bok_live_${prefix}_${random}`
  return { key: fullKey, prefix, suffix: random.slice(-4) }
}

function randomBase62(length: number): string {
  // base62 = [A-Za-z0-9]
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i]! % chars.length]
  }
  return out
}

function scryptAsync(
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
  N: number,
  r: number,
  p: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    _scrypt(password, salt, keylen, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, derived) => {
      if (err) reject(err)
      else resolve(derived)
    })
  })
}