/**
 * Insere o banner do Instagram em public.banners.
 *
 * O slide é só a imagem clicável — sem texto. Os campos title/subtitle/cta_label
 * ficam preenchidos (acessibilidade / alt do <a>) mas não são renderizados.
 *
 * Uso:
 *   node /home/bokashi/bokashipay/node_modules/.bin/tsx \
 *        /home/bokashi/bokashipay/scripts/seed-banner-instagram.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

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

const INSTAGRAM_URL = 'https://instagram.com/bokashipay'

async function main() {
  // Idempotência: remove banner anterior com o mesmo link do Instagram
  const { data: existing, error: selErr } = await sb
    .from('banners')
    .select('id')
    .eq('cta_href', INSTAGRAM_URL)
  if (selErr) throw new Error(`select: ${selErr.message}`)
  if (existing && existing.length > 0) {
    const { error: delErr } = await sb
      .from('banners')
      .delete()
      .eq('cta_href', INSTAGRAM_URL)
    if (delErr) throw new Error(`delete: ${delErr.message}`)
    console.log(`[seed] ${existing.length} banner(s) antigo(s) removido(s)`)
  }

  const { data, error } = await sb
    .from('banners')
    .insert({
      title: 'BokashiPay no Instagram',
      subtitle: null,
      cta_label: null, // sem botão — o clique é na imagem
      cta_href: INSTAGRAM_URL,
      image_url: '/imagens/BokashiPay Neon Instagram Banner.png',
      active: true,
      sort_order: 0,
    })
    .select('id')
    .single()
  if (error) throw new Error(`insert: ${error.message}`)
  console.log(`[seed] banner inserido (id=${data.id})`)
}

main().catch((err) => {
  console.error('[seed] FALHOU:', err)
  process.exit(1)
})