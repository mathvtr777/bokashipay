/**
 * Remove o banner do Instagram. O bucket privado no storage fica intacto.
 *
 * Uso:
 *   node /home/bokashi/bokashipay/node_modules/.bin/tsx \
 *        /home/bokashi/bokashipay/scripts/seed-banner-instagram-teardown.ts
 *
 * Para também apagar o bucket e a imagem do storage:
 *   ... --storage
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const BUCKET = 'bokashi-banner-private'

function loadEnv(path: string) {
  const txt = readFileSync(path, 'utf8')
  for (const line of txt.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv('/home/bokashi/bokashipay/.env.local')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function main() {
  const withStorage = process.argv.includes('--storage')

  const { data, error } = await sb
    .from('banners')
    .delete()
    .eq('cta_href', 'https://instagram.com/bokashipay')
    .select('id')
  if (error) throw new Error(`delete banners: ${error.message}`)
  console.log(`[teardown] ${data?.length ?? 0} banner(s) removido(s)`)

  if (withStorage) {
    const { data: removed, error: delErr } = await sb.storage
      .from(BUCKET)
      .remove(['instagram.png'])
    if (delErr) throw new Error(`storage.remove: ${delErr.message}`)
    console.log(`[teardown] storage: ${removed?.length ?? 0} arquivo(s) removido(s)`)

    const { error: bucketErr } = await sb.storage.deleteBucket(BUCKET)
    if (bucketErr) {
      console.warn(`[teardown] bucket não removido (pode estar em uso): ${bucketErr.message}`)
    } else {
      console.log(`[teardown] bucket "${BUCKET}" removido`)
    }
  }
}

main().catch((err) => {
  console.error('[teardown] FALHOU:', err)
  process.exit(1)
})