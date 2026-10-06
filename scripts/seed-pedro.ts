/**
 * Seed da conta "Pedro" — para prints de landing page.
 *
 * Cria:
 *   - 1 usuário em auth.users (email_confirm: true)
 *   - 1 perfil em public.profiles
 *   - 3 clientes em public.customers
 *   - 2 contas bancárias em public.bank_accounts
 *   - 8 transações PIX aprovadas + 1 pendente, totalizando R$ 8.500,00 de saldo
 *   - 5 entradas em public.financial_entries
 *   - 3 notificações
 *   - 1 linha em public.settings
 *
 * Idempotente: apaga o usuário (e tudo em cascata) antes de inserir.
 * Para desfazer: rode `scripts/seed-pedro-teardown.ts`.
 *
 * Uso:
 *   node /home/bokashi/bokashipay/node_modules/.bin/tsx \
 *        /home/bokashi/bokashipay/scripts/seed-pedro.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// ------------------------------------------------------------------
// Configuração
// ------------------------------------------------------------------

const EMAIL = 'pedro@bokashipay.com'
const PASSWORD = 'teste1234'
const FULL_NAME = 'Pedro Nascimento'
const TARGET_BALANCE = 8500.0

// ------------------------------------------------------------------
// .env.local loader (sem dependência de dotenv)
// ------------------------------------------------------------------

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SECRET_KEY!
if (!url || !key) {
  console.error('env missing')
  process.exit(2)
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Gera um CPF com dígitos verificadores válidos (não pertence a ninguém real). */
function fakeCpf(): string {
  const n = (): number => Math.floor(Math.random() * 10)
  const base = Array.from({ length: 9 }, n)
  const d1 = (() => {
    const s = base.reduce((acc, d, i) => acc + d * (10 - i), 0)
    const m = (s * 10) % 11
    return m === 10 ? 0 : m
  })()
  const d2 = (() => {
    const s = [...base, d1].reduce((acc, d, i) => acc + d * (11 - i), 0)
    const m = (s * 10) % 11
    return m === 10 ? 0 : m
  })()
  return `${base.join('')}${d1}${d2}`
}

function fakePhone(): string {
  const ddd = '11'
  const n = (): number => Math.floor(Math.random() * 10)
  return `(${ddd}) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`
}

function maskCpf(cpf: string): string {
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
}

/** Formata valor pra R$ X.XXX,XX (pt-BR). */
function brl(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Taxa PIX Bokashi (0,99%) — mesmo cálculo de src/services/payments/rules.ts. */
function fee(amount: number): number {
  return Math.round(amount * 0.0099 * 100) / 100
}

function net(amount: number): number {
  return Math.round((amount - fee(amount)) * 100) / 100
}

function daysAgo(n: number, hour = 14, minute = 30): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  d.setUTCHours(hour, minute, 0, 0)
  return d.toISOString()
}

function pickCustomerId(idx: number, customers: { id: string }[]): string {
  return customers[idx % customers.length].id
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

async function main() {
  console.log(`[seed] usando projeto: ${url}`)

  // 1) Limpa qualquer Pedro anterior (cascata apaga tudo do usuário)
  console.log(`[seed] removendo usuário existente com email ${EMAIL}...`)
  const listResp = await sb.auth.admin.listUsers()
  if (listResp.error) throw new Error(`listUsers: ${listResp.error.message}`)
  const existing = listResp.data.users.find((u) => u.email === EMAIL)
  if (existing) {
    const del = await sb.auth.admin.deleteUser(existing.id)
    if (del.error) throw new Error(`deleteUser: ${del.error.message}`)
    console.log(`[seed] usuário anterior removido (id=${existing.id})`)
  } else {
    console.log('[seed] nenhum usuário anterior — seguindo')
  }

  // 2) Cria o usuário Pedro
  console.log('[seed] criando usuário Pedro...')
  const createResp = await sb.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: FULL_NAME,
      phone: fakePhone(),
    },
  })
  if (createResp.error) throw new Error(`createUser: ${createResp.error.message}`)
  const userId = createResp.data.user!.id
  console.log(`[seed] usuário criado: ${userId}`)

  // 3) Perfil (o trigger `handle_new_user` também cria, mas garantindo campos)
  console.log('[seed] atualizando perfil...')
  const phone = fakePhone()
  const cpf = fakeCpf()
  const { error: profileErr } = await sb
    .from('profiles')
    .update({
      full_name: FULL_NAME,
      phone,
      document: maskCpf(cpf),
    })
    .eq('id', userId)
  if (profileErr) throw new Error(`profiles: ${profileErr.message}`)

  // 4) Clientes
  console.log('[seed] criando clientes...')
  const customerSeeds = [
    { name: 'Ana Beatriz Souza', email: 'ana.souza@example.com', phone: '(11) 98271-3340' },
    { name: 'Lucas Mendes', email: 'lucas.mendes@example.com', phone: '(21) 99614-2210' },
    { name: 'Camila Ferreira', email: 'camila.ferreira@example.com', phone: '(31) 98810-7755' },
  ]
  const customerIds: string[] = []
  for (const c of customerSeeds) {
    const { data, error } = await sb
      .from('customers')
      .insert({
        user_id: userId,
        name: c.name,
        email: c.email,
        phone: c.phone,
        document: maskCpf(fakeCpf()),
        status: 'active',
      })
      .select('id')
      .single()
    if (error) throw new Error(`customers.insert: ${error.message}`)
    customerIds.push(data.id)
  }
  console.log(`[seed] ${customerIds.length} clientes criados`)

  // 5) Contas bancárias
  console.log('[seed] criando contas bancárias...')
  const bankSeeds = [
    {
      bank_code: '341',
      bank_name: 'Itaú Unibanco',
      agency: '0123',
      account: '45678',
      account_digit: '9',
      holder_name: FULL_NAME,
      holder_document: maskCpf(cpf),
      pix_key: EMAIL,
      is_primary: true,
    },
    {
      bank_code: '260',
      bank_name: 'Nubank',
      agency: '0001',
      account: '88741230',
      account_digit: '1',
      holder_name: FULL_NAME,
      holder_document: maskCpf(cpf),
      pix_key: maskCpf(cpf),
      is_primary: false,
    },
  ]
  for (const b of bankSeeds) {
    const { error } = await sb.from('bank_accounts').insert({
      user_id: userId,
      ...b,
      account_type: 'checking',
      status: 'active',
    })
    if (error) throw new Error(`bank_accounts.insert: ${error.message}`)
  }
  console.log(`[seed] ${bankSeeds.length} contas criadas`)

  // 6) Transações PIX — soma de net_amount = R$ 8.500,00
  console.log('[seed] criando transações...')
  const descriptions = [
    'Curso Online - Mentoria Premium',
    'E-book Marketing Digital',
    'Consultoria Estratégica',
    'Assinatura Mensal - Pro',
    'Template Notion - Pack 3',
    'Curso Online - Marketing',
    'Aula Particular - 2h',
    'Mentoria Individual - Sessão',
  ]
  // 8 amounts cujas net_amount somam exatamente R$ 8.500,00 após os
  // arredondamentos da função `fee()` do Bokashi (0,99%).
  //   amount:  [489.85, 989.80, 1279.67, 689.83, 1489.75, 1879.61, 296.94, 1469.55]
  //   fee:     [4.85,   9.80,   12.67,   6.83,   14.75,   18.61,   2.94,   14.55]
  //   net:     [485.00, 980.00, 1267.00, 683.00, 1475.00, 1861.00, 294.00, 1455.00]
  //   Σ net = 8500.00  ✓
  const amounts = [489.85, 989.8, 1279.67, 689.83, 1489.75, 1879.61, 296.94, 1469.55]
  let runningNet = 0
  const txSeeds = amounts.map((amount, i) => {
    const f = fee(amount)
    const n = net(amount)
    runningNet = Math.round((runningNet + n) * 100) / 100
    return {
      user_id: userId,
      customer_id: pickCustomerId(i, customerIds.map((id) => ({ id }))),
      amount,
      fee: f,
      net_amount: n,
      method: 'pix',
      status: 'approved',
      external_id: `seed_pedro_${i}_${Date.now()}`,
      description: descriptions[i],
      payer_name: customerSeeds[i % customerSeeds.length].name,
      payer_document: '000.000.000-00',
      created_at: daysAgo(13 - i, 10 + (i % 6), 15 + (i * 7) % 50),
    }
  })
  const totalCheck = Math.round(
    txSeeds.reduce((s, t) => s + t.net_amount, 0) * 100,
  ) / 100
  if (totalCheck !== TARGET_BALANCE) {
    throw new Error(
      `soma de net_amount das aprovadas = ${brl(totalCheck)}; esperado ${brl(TARGET_BALANCE)}`,
    )
  }
  console.log(`[seed] soma net_amount das aprovadas: ${brl(totalCheck)} ✓`)

  for (const tx of txSeeds) {
    const { error } = await sb.from('transactions').insert(tx)
    if (error) throw new Error(`transactions.insert: ${error.message}`)
  }
  console.log(`[seed] ${txSeeds.length} transações aprovadas criadas`)

  // 7) Transação pendente (cobrança aberta)
  console.log('[seed] criando transação pendente...')
  const pendingAmount = 380.0
  const { data: pendingTx, error: pendErr } = await sb
    .from('transactions')
    .insert({
      user_id: userId,
      customer_id: customerIds[1],
      amount: pendingAmount,
      fee: fee(pendingAmount),
      net_amount: net(pendingAmount),
      method: 'pix',
      status: 'pending',
      external_id: `seed_pedro_pending_${Date.now()}`,
      description: 'Consultoria - Pacote 3 sessões',
      payer_name: customerSeeds[1].name,
      payer_document: '000.000.000-00',
      created_at: daysAgo(0, 9, 12),
    })
    .select('id')
    .single()
  if (pendErr) throw new Error(`transactions.pending: ${pendErr.message}`)

  const { error: pixPendErr } = await sb.from('pix_transactions').insert({
    user_id: userId,
    transaction_id: pendingTx.id,
    amount: pendingAmount,
    status: 'pending',
    provider_request_id: `seed_pp_${Date.now()}`,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  })
  if (pixPendErr) throw new Error(`pix_transactions.insert: ${pixPendErr.message}`)

  // 8) Financial entries — espelhando income + fee de cada venda aprovada
  console.log('[seed] criando extrato financeiro...')
  let bal = 0
  const entrySeeds: Array<{
    user_id: string
    type: 'income' | 'fee' | 'refund'
    description: string
    amount: number
    balance_after: number
    created_at: string
  }> = []
  for (const tx of txSeeds) {
    bal = Math.round((bal + tx.net_amount) * 100) / 100
    entrySeeds.push({
      user_id: userId,
      type: 'income',
      description: `Recebimento PIX — ${tx.description}`,
      amount: tx.net_amount,
      balance_after: bal,
      created_at: tx.created_at,
    })
    bal = Math.round((bal - tx.fee) * 100) / 100
    entrySeeds.push({
      user_id: userId,
      type: 'fee',
      description: `Taxa Pushin Pay (0,99%)`,
      amount: -tx.fee,
      balance_after: bal,
      created_at: tx.created_at,
    })
  }
  // Insere em ordem cronológica (mais antigas primeiro → balance_after coerente)
  entrySeeds.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
  // Recalcula balance_after após a ordenação
  bal = 0
  for (const e of entrySeeds) {
    bal = Math.round((bal + e.amount) * 100) / 100
    e.balance_after = bal
  }
  for (const e of entrySeeds) {
    const { error } = await sb.from('financial_entries').insert(e)
    if (error) throw new Error(`financial_entries.insert: ${error.message}`)
  }
  console.log(`[seed] ${entrySeeds.length} entradas no extrato (saldo final: ${brl(bal)})`)

  // 9) Notificações
  console.log('[seed] criando notificações...')
  const notifications = [
    {
      user_id: userId,
      title: 'Venda aprovada',
      body: `Você recebeu ${brl(txSeeds[txSeeds.length - 1].net_amount)} via PIX`,
      type: 'sale',
      read: false,
      created_at: txSeeds[txSeeds.length - 1].created_at,
    },
    {
      user_id: userId,
      title: 'Cobrança PIX pendente',
      body: `Aguardando pagamento de ${brl(pendingAmount)}`,
      type: 'pix',
      read: false,
      created_at: daysAgo(0, 9, 13),
    },
    {
      user_id: userId,
      title: 'Pagamento confirmado',
      body: `${brl(txSeeds[0].net_amount)} creditado na sua conta`,
      type: 'payment',
      read: true,
      created_at: txSeeds[0].created_at,
    },
  ]
  for (const n of notifications) {
    const { error } = await sb.from('notifications').insert(n)
    if (error) throw new Error(`notifications.insert: ${error.message}`)
  }
  console.log(`[seed] ${notifications.length} notificações criadas`)

  // 10) Settings
  console.log('[seed] configurando preferências...')
  const { error: settingsErr } = await sb.from('settings').insert({
    user_id: userId,
    notify_payment: true,
    notify_pix: true,
    notify_withdrawal: true,
    notify_sale: true,
    notify_email: true,
    theme: 'light',
  })
  if (settingsErr) throw new Error(`settings.insert: ${settingsErr.message}`)

  // 11) Verificação
  console.log('[seed] verificando saldo calculado pelo app...')
  const { data: txCheck, error: txCheckErr } = await sb
    .from('transactions')
    .select('status, net_amount')
    .eq('user_id', userId)
  if (txCheckErr) throw new Error(`txCheck: ${txCheckErr.message}`)
  const { data: wdCheck, error: wdCheckErr } = await sb
    .from('withdrawal_requests')
    .select('amount_brl, status')
    .eq('user_id', userId)
  if (wdCheckErr) throw new Error(`wdCheck: ${wdCheckErr.message}`)

  const received = (txCheck ?? [])
    .filter((t) => t.status === 'approved')
    .reduce((s, t) => s + Number(t.net_amount), 0)
  const withdrawn = (wdCheck ?? [])
    .filter((w) => w.status === 'completed')
    .reduce((s, w) => s + Number(w.amount_brl), 0)
  const available = Math.round((received - withdrawn) * 100) / 100
  const pending = (txCheck ?? [])
    .filter((t) => t.status === 'pending')
    .reduce((s, t) => s + Number(t.net_amount), 0)

  console.log('\n[seed] ========================================')
  console.log(`[seed]   Usuário      : ${EMAIL}`)
  console.log(`[seed]   Senha        : ${PASSWORD}`)
  console.log(`[seed]   Nome         : ${FULL_NAME}`)
  console.log(`[seed]   user_id      : ${userId}`)
  console.log(`[seed]   Recebido     : ${brl(received)}`)
  console.log(`[seed]   Saques done  : ${brl(withdrawn)}`)
  console.log(`[seed]   Saldo (live) : ${brl(available)}`)
  console.log(`[seed]   Pendente     : ${brl(pending)}`)
  console.log(`[seed]   Vendas       : ${txCheck?.length ?? 0}`)
  console.log('[seed] ========================================')
}

main().catch((err) => {
  console.error('[seed] FALHOU:', err)
  process.exit(1)
})
