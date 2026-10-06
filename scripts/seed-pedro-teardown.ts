/**
 * Teardown do seed-pedro — apaga o usuário (cascata remove tudo do Pedro).
 *
 * Uso:
 *   node /home/bokashi/bokashipay/node_modules/.bin/tsx \
 *        /home/bokashi/bokashipay/scripts/seed-pedro-teardown.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const EMAIL = 'pedro@bokashipay.com'

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

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const list = await sb.auth.admin.listUsers()
  if (list.error) throw new Error(`listUsers: ${list.error.message}`)
  const target = list.data.users.find((u) => u.email === EMAIL)
  if (!target) {
    console.log(`[teardown] nenhum usuário com email ${EMAIL} — nada a fazer`)
    return
  }
  const del = await sb.auth.admin.deleteUser(target.id)
  if (del.error) throw new Error(`deleteUser: ${del.error.message}`)
  console.log(`[teardown] usuário ${EMAIL} (id=${target.id}) removido`)
  console.log('[teardown] cascata apagou: profiles, customers, bank_accounts,')
  console.log('[teardown] transactions, pix_transactions, financial_entries,')
  console.log('[teardown] notifications, settings — tudo do Pedro.')
}

main().catch((err) => {
  console.error('[teardown] FALHOU:', err)
  process.exit(1)
})
