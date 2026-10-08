import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'
import type {
  CustomerWithStats, Customer, Transaction, PixTransaction, BankAccount, WithdrawalRequest,
  FinancialEntry, IntegrationSafe, IntegrationEvent, Notification, Profile, DateRange,
  Product,
} from '@/lib/types'
import {
  computeAvailableBalance, computePendingBalance, computeConversionRate,
  computeMethodStats, computeGoalProgress, rangeChange, roundCurrency,
} from '@/services/payments/rules'
import { previousRange } from '@/lib/date-range'
import type { DashboardMetrics, SalesPoint } from '@/lib/types'

/**
 * Camada de leitura do banco.
 *
 * Todas as funções usam o cliente com o JWT do usuário, então o RLS é a
 * primeira linha de defesa: mesmo com um bug aqui, um usuário não lê dados de
 * outro. Nenhum `user_id` é lido do client — vem do token.
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Lança 401 se não houver sessão. Usado no topo das páginas do dashboard. */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

// -----------------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------------

export async function getDashboardMetrics(
  range?: DateRange,
): Promise<DashboardMetrics> {
  const supabase = await createClient()

  // Saldos são lidos sobre TODAS as transactions (snapshot, não range).
  // Variação é lida sobre [range atual, range anterior] — em paralelo.
  const allTxP = supabase
    .from('transactions')
    .select('status, amount, net_amount, fee')

  const prev = range ? previousRange(range) : null
  const currentRangeQ = range
    ? supabase
        .from('transactions')
        .select('status, amount, net_amount, fee')
        .gte('created_at', range.from)
        .lte('created_at', `${range.to}T23:59:59.999Z`)
    : null
  const previousRangeQ = prev
    ? supabase
        .from('transactions')
        .select('status, amount, net_amount, fee')
        .gte('created_at', prev.from)
        .lte('created_at', `${prev.to}T23:59:59.999Z`)
    : null

  const empty: Pick<Transaction, 'status' | 'amount' | 'net_amount' | 'fee'>[] = []
  const [allTxRes, currentRes, previousRes, withdrawalsRes] = await Promise.all([
    allTxP,
    currentRangeQ ? currentRangeQ : Promise.resolve({ data: empty, error: null }),
    previousRangeQ ? previousRangeQ : Promise.resolve({ data: empty, error: null }),
    supabase
      .from('withdrawal_requests')
      .select('amount_brl, status')
      .returns<{ amount_brl: number; status: string }[]>(),
  ])

  const transactions = allTxRes.data ?? []
  const currentTx = currentRes.data ?? empty
  const previousTx = previousRes.data ?? empty
  const withdrawals = withdrawalsRes.data ?? []

  // Só o que foi efetivamente pago sai do saldo. Um saque aprovado e ainda não
  // concluído continua sendo dinheiro do usuário.
  const withdrawn = withdrawals
    .filter((w) => w.status === 'completed')
    .reduce((sum, w) => sum + Number(w.amount_brl), 0)

  const totalReceived = roundCurrency(
    transactions
      .filter((t) => t.status === 'approved')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  // Variação: soma/quantidade dentro do range atual vs. range anterior.
  const currentReceived = currentTx
    .filter((t) => t.status === 'approved')
    .reduce((s, t) => s + Number(t.amount), 0)
  const previousReceived = previousTx
    .filter((t) => t.status === 'approved')
    .reduce((s, t) => s + Number(t.amount), 0)
  const currentApproved = currentTx.filter((t) => t.status === 'approved').length
  const previousApproved = previousTx.filter((t) => t.status === 'approved').length

  return {
    availableBalance: roundCurrency(
      computeAvailableBalance(transactions) - withdrawn,
    ),
    pendingBalance: computePendingBalance(transactions),
    totalReceived,
    approvedSales: transactions.filter((t) => t.status === 'approved').length,
    totalSales: transactions.length,
    conversionRate: computeConversionRate(transactions),
    totalFees: roundCurrency(
      transactions.filter((t) => t.status === 'approved').reduce((sum, t) => sum + Number(t.fee), 0),
    ),
    totalWithdrawn: roundCurrency(withdrawn),
    goal: computeGoalProgress(totalReceived),
    change: {
      totalReceived: rangeChange(currentReceived, previousReceived),
      approvedSales: rangeChange(currentApproved, previousApproved),
    },
  }
}

export async function getSalesSeries(range: DateRange): Promise<SalesPoint[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('created_at, amount, status')
    .gte('created_at', range.from)
    .lte('created_at', `${range.to}T23:59:59.999Z`)
    .returns<Pick<Transaction, 'created_at' | 'amount' | 'status'>[]>()

  return bucketSalesByDay(data ?? [], range)
}

/**
 * Agrupa por dia e preenche as datas sem venda com zero — sem isso o gráfico
 * "pula" dias e distorce a leitura da tendência.
 */
export function bucketSalesByDay(
  transactions: { created_at: string; amount: number | string; status: string }[],
  range: DateRange,
): SalesPoint[] {
  const buckets = new Map<string, SalesPoint>()

  const start = new Date(`${range.from}T00:00:00`)
  const end = new Date(`${range.to}T00:00:00`)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, {
      date: key,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      volume: 0,
      count: 0,
    })
  }

  for (const t of transactions) {
    if (t.status !== 'approved' && t.status !== 'pending') continue
    const key = t.created_at.slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.volume = roundCurrency(bucket.volume + Number(t.amount))
    bucket.count += 1
  }

  return [...buckets.values()]
}

export async function getRecentTransactions(limit = 5): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as Transaction[]
}

export async function getPaymentMethodStats() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('method, amount, status')
    .returns<Pick<Transaction, 'method' | 'amount' | 'status'>[]>()
  return computeMethodStats(data ?? [])
}

export async function getTopProducts(limit = 5) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('description, amount, status')
    .returns<Pick<Transaction, 'description' | 'amount' | 'status'>[]>()

  const buckets = new Map<string, { name: string; count: number; amount: number }>()

  for (const t of data ?? []) {
    const name = (t.description ?? '').trim() || 'Venda sem descrição'
    const current = buckets.get(name) ?? { name, count: 0, amount: 0 }
    buckets.set(name, {
      name,
      count: current.count + 1,
      amount: roundCurrency(current.amount + Number(t.amount)),
    })
  }

  return [...buckets.values()].sort((a, b) => b.amount - a.amount).slice(0, limit)
}

export async function getActiveBanners() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  return data ?? []
}

// -----------------------------------------------------------------------------
// Vendas
// -----------------------------------------------------------------------------

export interface SalesFilters {
  range: DateRange
  status?: string
  method?: string
  minAmount?: number
  maxAmount?: number
  customerQuery?: string
  page: number
  pageSize: number
}

export async function getSales(filters: SalesFilters) {
  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select('*, customer:customers(id, name, email)', { count: 'exact' })
    .gte('created_at', filters.range.from)
    .lte('created_at', `${filters.range.to}T23:59:59.999Z`)
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.method && filters.method !== 'all') query = query.eq('method', filters.method)
  if (filters.minAmount !== undefined) query = query.gte('amount', filters.minAmount)
  if (filters.maxAmount !== undefined) query = query.lte('amount', filters.maxAmount)
  if (filters.customerQuery) {
    query = query.ilike('payer_name', `%${filters.customerQuery}%`)
  }

  const from = (filters.page - 1) * filters.pageSize
  const { data, count, error } = await query.range(from, from + filters.pageSize - 1)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as SalesRow[],
    total: count ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / filters.pageSize)),
  }
}

// -----------------------------------------------------------------------------
// Transações — página /transacoes
//
// Estende o conceito de `getSales` com:
//   - filtro por origem (bot telegram / checkout / api / outros, derivado de
//     `description` enquanto não houver campo `source` próprio).
//   - busca por cliente/produto/email (em payer_name, customer.email, product.name,
//     description).
//   - stats para os 4 cards do topo (total recebido, pagas, pendentes, indicações).
// Não substitui `getSales` — convivem. A página /vendas continua usando
// `getSales`.
// -----------------------------------------------------------------------------

export interface TransactionsFilters {
  range: DateRange
  status?: string
  source?: string
  query?: string
  page: number
  pageSize: number
}

export interface TransactionsStats {
  totalReceived: number
  paidSales: number
  paidAmount: number
  pendingAmount: number
  pendingCount: number
  /** Vendas com descrição "indicação" (ou tag futura `referred_by`). */
  indications: { count: number; amount: number }
  avgTicket: number
}

export async function getTransactions(filters: TransactionsFilters) {
  const supabase = await createClient()

  let q = supabase
    .from('transactions')
    .select(
      'id, status, amount, fee, net_amount, method, description, payer_name, payer_document, created_at, customer:customers(id, name, email), product:products!transactions_product_id_fkey(id, name)',
      { count: 'exact' },
    )
    .gte('created_at', filters.range.from)
    .lte('created_at', `${rangeToIso(filters.range.to)}`)
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
  if (filters.source && filters.source !== 'all') q = sourceFilter(q, filters.source)
  if (filters.query) q = queryFilter(q, filters.query)

  const from = (filters.page - 1) * filters.pageSize
  const { data, count, error } = await q.range(from, from + filters.pageSize - 1)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as unknown as SalesRow[],
    total: count ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / filters.pageSize)),
  }
}

/**
 * Estatísticas dos 4 cards da página /transacoes (Total Recebido, Vendas
 * Pagas, Pendentes, Indicações). Lê todas as transactions do range sem
 * paginação — usado só no server, o custo é compatível com `getDashboardMetrics`.
 */
export async function getTransactionsStats(range: DateRange): Promise<TransactionsStats> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('status, amount, net_amount, fee, description')
    .gte('created_at', range.from)
    .lte('created_at', `${rangeToIso(range.to)}`)
    .returns<
      { status: string; amount: number | string; net_amount: number | string; fee: number | string; description: string | null }[]
    >()

  const rows = data ?? []
  const approved = rows.filter((r) => r.status === 'approved')
  const pending = rows.filter((r) => r.status === 'pending')
  const indication = rows.filter((r) => (r.description ?? '').toLowerCase().includes('indicação') || (r.description ?? '').toLowerCase().includes('indicacao'))

  const totalReceived = roundCurrency(approved.reduce((s, r) => s + Number(r.amount), 0))
  const paidAmount = totalReceived
  const pendingAmount = roundCurrency(pending.reduce((s, r) => s + Number(r.amount), 0))
  const indications = {
    count: indication.length,
    amount: roundCurrency(indication.reduce((s, r) => s + Number(r.amount), 0)),
  }
  const avgTicket = approved.length === 0 ? 0 : roundCurrency(totalReceived / approved.length)

  return {
    totalReceived,
    paidSales: approved.length,
    paidAmount,
    pendingAmount,
    pendingCount: pending.length,
    indications,
    avgTicket,
  }
}

/** helper: converte 'yyyy-mm-dd' em 'yyyy-mm-ddT23:59:59.999Z' */
function rangeToIso(date: string): string {
  return date.includes('T') ? date : `${date}T23:59:59.999Z`
}

/**
 * Filtra por origem — derivado de description. Recebe o query builder
 * encadeado (tipo inferido pelo `from`); todos os `or`/`ilike` funcionam
 * sobre o mesmo tipo encadeado.
 */
function sourceFilter(q: any, source: string) {
  switch (source) {
    case 'telegram_bot':
      return q.ilike('description', '%telegram%')
    case 'checkout_direct':
      return q.or('method.eq.card,method.eq.boleto,description.ilike.%checkout%')
    case 'api':
      return q.ilike('description', '%api%')
    case 'other':
      // "other" — quando o filtro de "outros" é selecionado, a query fica
      // sem restrição de description; o filtro fino fica para uma migration
      // futura com campo `source` dedicado.
      return q
    default:
      return q
  }
}

/** Busca por cliente/produto/email — campo mais comum é `payer_name`. */
function queryFilter(q: any, term: string) {
  return q.or(
    `payer_name.ilike.%${term}%,payer_document.ilike.%${term}%,description.ilike.%${term}%,customer.name.ilike.%${term}%`,
  )
}

// -----------------------------------------------------------------------------
// Bio pages — feed de "Meus Links" (rota /temas)
//
// A tabela `bio_pages` é criada pela migration 0008. Até rodar a migration,
// `getBioPage` retorna null e o salvamento falha com mensagem clara no
// toast — UI segue funcional (preview ao vivo, formulário).
// -----------------------------------------------------------------------------

export async function getBioPage(): Promise<BioPage | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('bio_pages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      // Se a tabela ainda não existe (PGRST205 / 42P01), retorna null
      // silenciosamente — a UI continua funcional e o usuário pode
      // rodar a migration depois.
      return null
    }
    return (data as BioPage | null) ?? null
  } catch {
    return null
  }
}

export interface BioPageInput {
  slug: string
  displayName: string
  bio: string
  avatarUrl: string | null
}

export async function saveBioPage(input: BioPageInput): Promise<BioPage> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado.')

  // Upsert: se já existe uma página, atualiza; senão, cria.
  // A constraint `bio_pages_slug_unique` é global — se outro usuário já
  // pegou o slug, o insert/update falha com 23505; a UI trata.
  const { data, error } = await supabase
    .from('bio_pages')
    .upsert(
      {
        user_id: user.id,
        slug: input.slug,
        display_name: input.displayName,
        bio: input.bio,
        avatar_url: input.avatarUrl,
        active: true,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as BioPage
}

export async function countBioPages(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  const { count } = await supabase
    .from('bio_pages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  return count ?? 0
}

// -----------------------------------------------------------------------------
// Infrações (chargebacks / disputes / contestações) — página /infracoes
//
// A tabela `infracoes` é criada pela migration 0009. Até rodar a migration,
// as queries retornam listas vazias / zeros e a UI mostra empty-state.
// -----------------------------------------------------------------------------

export interface InfracoesFilters {
  range?: DateRange
  status?: string
  query?: string
  page: number
  pageSize: number
}

export interface InfracoesStats {
  total: number
  analyzing: number
  inDispute: number // soma de amount de status=open ou lost (ainda em risco)
  defended: number
}

/** Lista de infrações do merchant. Filtra por status, range e busca textual. */
export async function getInfracoes(filters: InfracoesFilters): Promise<InfracoesRow[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let q = supabase
      .from('infracoes')
      .select(
        'id, status, type, amount, reason, opened_at, resolved_at, transaction_id, created_at',
        { count: 'exact' },
      )
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })

    if (filters.range) {
      q = q.gte('opened_at', filters.range.from).lte('opened_at', `${filters.range.to}T23:59:59.999Z`)
    }
    if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
    if (filters.query) q = q.or(`reason.ilike.%${filters.query}%,defense_notes.ilike.%${filters.query}%`)

    const from = (filters.page - 1) * filters.pageSize
    const { data, count, error } = await q.range(from, from + filters.pageSize - 1)
    if (error) return []

    return ((data ?? []) as unknown as InfracoesRow[])
  } catch {
    return []
  }
}

/** Estatísticas dos 4 cards do topo da página /infracoes. */
export async function getInfracoesStats(range?: DateRange): Promise<InfracoesStats> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { total: 0, analyzing: 0, inDispute: 0, defended: 0 }

    let q = supabase
      .from('infracoes')
      .select('status, amount')
      .eq('user_id', user.id)

    if (range) {
      q = q.gte('opened_at', range.from).lte('opened_at', `${range.to}T23:59:59.999Z`)
    }

    const { data } = await q
    const rows = (data ?? []) as { status: string; amount: number | string }[]

    let total = 0
    let analyzing = 0
    let inDispute = 0
    let defended = 0
    for (const r of rows) {
      total += 1
      const amount = Number(r.amount)
      if (r.status === 'open') inDispute += amount
      if (r.status === 'analyzing') {
        analyzing += 1
        inDispute += amount
      }
      if (r.status === 'lost') inDispute += amount
      if (r.status === 'defended' || r.status === 'won') defended += 1
    }

    return {
      total,
      analyzing,
      inDispute: roundCurrency(inDispute),
      defended,
    }
  } catch {
    return { total: 0, analyzing: 0, inDispute: 0, defended: 0 }
  }
}

/** Row de infração que volta pro client (lista + busca). */
export interface InfracoesRow {
  id: string
  status: string
  type: string
  amount: number
  reason: string | null
  opened_at: string
  resolved_at: string | null
  transaction_id: string | null
  created_at: string
}

export interface SalesRow extends Transaction {
  customer: Pick<Customer, 'id' | 'name' | 'email'> | null
}

export async function getSaleById(id: string): Promise<SalesRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('*, customer:customers(id, name, email)')
    .eq('id', id)
    .maybeSingle()
  return (data as unknown as SalesRow | null) ?? null
}

// -----------------------------------------------------------------------------
// PIX
// -----------------------------------------------------------------------------

export async function getPixTransactions(limit = 50): Promise<PixTransaction[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pix_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as PixTransaction[]
}

// -----------------------------------------------------------------------------
// Financeiro
// -----------------------------------------------------------------------------

export interface FinanceFilters {
  range: DateRange
  type?: string
  page: number
  pageSize: number
}

export async function getFinancialEntries(filters: FinanceFilters) {
  const supabase = await createClient()

  let query = supabase
    .from('financial_entries')
    .select('*', { count: 'exact' })
    .gte('created_at', filters.range.from)
    .lte('created_at', `${filters.range.to}T23:59:59.999Z`)
    .order('created_at', { ascending: false })

  if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type)

  const from = (filters.page - 1) * filters.pageSize
  const { data, count, error } = await query.range(from, from + filters.pageSize - 1)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as FinancialEntry[],
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / filters.pageSize)),
  }
}

// -----------------------------------------------------------------------------
// Contas bancárias
// -----------------------------------------------------------------------------

export async function getBankAccounts(): Promise<BankAccount[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bank_accounts')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false })
  return (data ?? []) as BankAccount[]
}

// -----------------------------------------------------------------------------
// Saques (solicitações de saque em reais)
// -----------------------------------------------------------------------------

export async function getWithdrawals(limit = 50): Promise<WithdrawalRequest[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as WithdrawalRequest[]
}

export async function getWithdrawalSummary() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('withdrawal_requests')
    .select('amount_brl, status')
    .returns<{ amount_brl: number; status: string }[]>()

  const rows = data ?? []
  const sum = (predicate: (row: { status: string }) => boolean) =>
    roundCurrency(
      rows.filter(predicate).reduce((acc, row) => acc + Number(row.amount_brl), 0),
    )

  return {
    // Em análise: aprovado mas ainda não pago — o dinheiro ainda não saiu.
    pending: sum((r) => r.status === 'pending'),
    approved: sum((r) => r.status === 'approved'),
    completed: sum((r) => r.status === 'completed'),
    rejected: sum((r) => r.status === 'rejected'),
  }
}

// -----------------------------------------------------------------------------
// Clientes
// -----------------------------------------------------------------------------

export async function getCustomersWithStats(query = ''): Promise<CustomerWithStats[]> {
  const supabase = await createClient()

  let queryBuilder = supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (query) queryBuilder = queryBuilder.ilike('name', `%${query}%`)

  const { data, error } = await queryBuilder
  if (error) throw new Error(error.message)

  const customers = (data ?? []) as Customer[]
  if (customers.length === 0) return []

  const ids = customers.map((c) => c.id)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('customer_id, amount, status, created_at')
    .in('customer_id', ids)
    .eq('status', 'approved')
    .returns<Pick<Transaction, 'customer_id' | 'amount' | 'status' | 'created_at'>[]>()

  const stats = new Map<string, { total: number; count: number; last: string | null }>()
  const approved = (transactions ?? []) as Pick<
    Transaction,
    'customer_id' | 'amount' | 'status' | 'created_at'
  >[]
  for (const t of approved) {
    if (!t.customer_id) continue
    const current = stats.get(t.customer_id) ?? { total: 0, count: 0, last: null }
    current.total = roundCurrency(current.total + Number(t.amount))
    current.count += 1
    if (!current.last || t.created_at > current.last) current.last = t.created_at
    stats.set(t.customer_id, current)
  }

  return customers.map((customer) => {
    const stat = stats.get(customer.id)
    return {
      ...customer,
      total_purchased: stat?.total ?? 0,
      purchase_count: stat?.count ?? 0,
      last_purchase_at: stat?.last ?? null,
    }
  })
}

export async function getCustomerById(id: string) {
  const supabase = await createClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!customer) return null

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  const approved = (transactions ?? []).filter((t) => t.status === 'approved')

  return {
    customer: customer as Customer,
    transactions: (transactions ?? []) as Transaction[],
    totalPurchased: roundCurrency(approved.reduce((sum, t) => sum + Number(t.amount), 0)),
    purchaseCount: approved.length,
    lastPurchaseAt: approved[0]?.created_at ?? null,
  }
}

// -----------------------------------------------------------------------------
// Integrações
// -----------------------------------------------------------------------------

/** Lê a view segura: o api_token nunca atravessa essa fronteira. */
export async function getIntegration(provider: string): Promise<IntegrationSafe | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('integrations_safe')
    .select('*')
    .eq('provider', provider)
    .maybeSingle()
  return (data as unknown as IntegrationSafe | null) ?? null
}

export async function getIntegrationEvents(limit = 20): Promise<IntegrationEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('integration_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as IntegrationEvent[]
}

// -----------------------------------------------------------------------------
// Notificações
// -----------------------------------------------------------------------------

export async function getNotifications(limit = 15): Promise<Notification[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as Notification[]
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)
  return count ?? 0
}

// -----------------------------------------------------------------------------
// Configurações
// -----------------------------------------------------------------------------

export async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').maybeSingle()
  return data
}

// -----------------------------------------------------------------------------
// Produtos
// -----------------------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Product[]
}

// -----------------------------------------------------------------------------
// API pública
// -----------------------------------------------------------------------------

export async function getApiKeys(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, prefix, suffix, last_used_at, expires_at, revoked_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getWebhookEndpoints(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('webhook_endpoints')
    .select('id, url, events, active, last_delivery_at, last_status, last_error, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

// -----------------------------------------------------------------------------
// Checkout público
// -----------------------------------------------------------------------------

/**
 * Carrega um produto pelo slug. Server-side, sem depender de usuário logado
 * (o checkout é público). Usa service role pra bypassar RLS.
 */
export async function getProductBySlug(slug: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Product | null
}

export interface CheckoutSocialProof {
  totalSold: number
  /** Nomes abreviados dos compradores mais recentes, mais novo primeiro. */
  recent: { name: string; minutesAgo: number }[]
  /** Pessoas que compraram nos últimos 5 minutos. */
  buyingNow: number
}

/**
 * Social proof: total de vendas aprovadas + nomes recentes + quantos
 * estão comprando agora (últimos 5 minutos).
 */
export async function getCheckoutSocialProof(
  productId: string,
): Promise<CheckoutSocialProof> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const now = Date.now()
  const fiveMinAgo = new Date(now - 5 * 60 * 1000).toISOString()

  // Total vendido (approved)
  const { count: totalSold } = await admin
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('status', 'approved')

  // Comprando agora (últimos 5min, qualquer status: indica interesse)
  const { count: buyingNow } = await admin
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .gte('created_at', fiveMinAgo)

  // Últimos compradores aprovados (nomes)
  const { data: recentTx } = await admin
    .from('transactions')
    .select('payer_name, created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .not('payer_name', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const recent = (recentTx ?? []).map((t) => {
    const fullName = (t.payer_name ?? '').trim()
    const first = fullName.split(/\s+/)[0] ?? ''
    const last = fullName.split(/\s+/).slice(-1)[0] ?? ''
    const abbrev = last ? `${first} ${last[0]}.` : first
    const minutesAgo = Math.max(
      0,
      Math.round((now - new Date(t.created_at).getTime()) / 60000),
    )
    return { name: abbrev, minutesAgo }
  })

  return {
    totalSold: totalSold ?? 0,
    recent,
    buyingNow: buyingNow ?? 0,
  }
}

export type { Json, Database }
export type { CustomerWithStats } from '@/lib/types'

// -----------------------------------------------------------------------------
// Dashboard — queries (ligadas às tabelas `transactions` e `pix_transactions`)
//
// Estas funções alimentam os blocos da home e da página de Análises.
// Lêem o range do merchant; a primeira execução (sem dados) retorna zeros e
// os componentes já tratam o caso vazio via `EmptyState`.
// -----------------------------------------------------------------------------

import type {
  BioPage,
  ConversionFunnel,
  ConversionFunnelSteps,
  ConversionHeatmap,
  ConversionHeatmapCell,
  PaymentVelocity,
  Producer,
  SourceBreakdown,
  SourceBreakdownItem,
  StatusDonut,
} from '@/lib/types'

/** Busca as transações de PIX em um range (sem aplicar RLS além do auth). */
async function fetchPixInRange(range: DateRange) {
  const supabase = await createClient()
  return supabase
    .from('pix_transactions')
    .select('status, amount, created_at, paid_at')
    .gte('created_at', range.from)
    .lte('created_at', `${range.to}T23:59:59.999Z`)
    .returns<
      { status: string; amount: number | string; created_at: string; paid_at: string | null }[]
    >()
}

/**
 * Status dos pedidos no período — aprovados vs pendentes.
 * `approved` = transactions com status='approved'.
 * `pending` = transactions com status='pending' (não canceladas/refunded).
 */
export async function getStatusDonut(range: DateRange): Promise<StatusDonut> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('status')
    .gte('created_at', range.from)
    .lte('created_at', `${range.to}T23:59:59.999Z`)
    .returns<{ status: string }[]>()
  const rows = data ?? []
  return {
    approved: rows.filter((r) => r.status === 'approved').length,
    pending: rows.filter((r) => r.status === 'pending').length,
  }
}

/**
 * Ranking dos top produtores no período. Derivado de `transactions.payer_name`
 * — cada nome distinto é tratado como um produtor anônimo, e agregamos
 * contagem + valor aprovado. Quando o nome é vazio/igual, fica agrupado
 * sob "Não informado".
 */
export async function getProducerRanking(
  range: DateRange,
  limit = 5,
): Promise<Producer[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('payer_name, amount, status, created_at')
    .gte('created_at', range.from)
    .lte('created_at', `${range.to}T23:59:59.999Z`)
    .eq('status', 'approved')
    .returns<{ payer_name: string | null; amount: number | string; status: string; created_at: string }[]>()

  const buckets = new Map<string, { id: string; name: string; count: number; amount: number }>()
  for (const t of data ?? []) {
    const name = (t.payer_name ?? '').trim() || 'Não informado'
    const cur = buckets.get(name) ?? { id: name, name, count: 0, amount: 0 }
    cur.count += 1
    cur.amount = roundCurrency(cur.amount + Number(t.amount))
    buckets.set(name, cur)
  }
  return [...buckets.values()].sort((a, b) => b.amount - a.amount).slice(0, limit)
}

/**
 * Conversão de PIX: total gerado vs pago (e percent derivado). Mantida para
 * o dashboard — `getConversionFunnelSteps` é a versão de 3 etapas usada
 * pela página de Análises.
 */
export async function getPixConversion(range: DateRange): Promise<ConversionFunnel> {
  const { data } = await fetchPixInRange(range)
  const rows = data ?? []
  const generated = rows.length
  const paid = rows.filter((r) => r.status === 'paid').length
  return {
    generated,
    paid,
    percent: generated === 0 ? 0 : paid / generated,
  }
}

/**
 * Funil de 3 etapas usado na página de Análises: PIX gerado → aguardando →
 * pago. Inclui taxa de aprovação e mediana do tempo até pagar.
 */
export async function getConversionFunnelSteps(
  range: DateRange,
): Promise<ConversionFunnelSteps> {
  const { data } = await fetchPixInRange(range)
  const rows = data ?? []
  const generated = rows.length
  const paidRows = rows.filter((r) => r.status === 'paid' && r.paid_at)
  const awaiting = rows.filter((r) => r.status === 'pending' || r.status === 'created').length
  const paid = paidRows.length

  // Mediana de segundos entre created_at e paid_at para os pagos.
  const seconds = paidRows
    .map((r) => {
      const a = new Date(r.created_at).getTime()
      const b = new Date(r.paid_at as string).getTime()
      return Math.max(0, Math.round((b - a) / 1000))
    })
    .sort((x, y) => x - y)

  const median = seconds.length === 0 ? null : seconds[Math.floor(seconds.length / 2)]

  return {
    generated,
    awaiting,
    paid,
    approvalRate: generated === 0 ? 0 : paid / generated,
    medianSecondsToPay: median,
  }
}

/** Mantida para retrocompatibilidade com a home (versão 2 etapas). */
export async function getConversionFunnel(): Promise<ConversionFunnel> {
  return { generated: 0, paid: 0, percent: 0 }
}

/**
 * Velocidade de pagamento: série por hora + mediana em segundos.
 * Agrega por hora do created_at para os pagos no período.
 */
export async function getPaymentVelocity(range: DateRange): Promise<PaymentVelocity> {
  const { data } = await fetchPixInRange(range)
  const rows = (data ?? []).filter((r) => r.status === 'paid' && r.paid_at)
  const buckets = new Array(24).fill(0).map(() => [] as number[])
  for (const r of rows) {
    const created = new Date(r.created_at)
    const paid = new Date(r.paid_at as string)
    const hour = created.getHours()
    const seconds = Math.max(0, Math.round((paid.getTime() - created.getTime()) / 1000))
    buckets[hour].push(seconds)
  }
  const series = buckets.map((arr, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}h`,
    seconds: arr.length === 0 ? 0 : Math.round(arr.reduce((s, x) => s + x, 0) / arr.length),
  }))
  const all = series.flatMap((s) => (s.seconds > 0 ? [s.seconds] : []))
  const median =
    all.length === 0
      ? null
      : [...all].sort((a, b) => a - b)[Math.floor(all.length / 2)]
  return { series, medianSeconds: median }
}

/**
 * Heatmap "quando seus clientes compram": agrupa as vendas aprovadas por
 * dia da semana × faixa horária. Faixas: 0-6, 6-12, 12-18, 18-24.
 */
export async function getConversionHeatmap(
  range: DateRange,
): Promise<ConversionHeatmap> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('created_at, status')
    .gte('created_at', range.from)
    .lte('created_at', `${range.to}T23:59:59.999Z`)
    .eq('status', 'approved')
    .returns<{ created_at: string; status: string }[]>()

  const counts = new Map<string, number>()
  for (const r of data ?? []) {
    const d = new Date(r.created_at)
    // getDay(): 0=Dom, 6=Sáb
    const weekday = d.getDay()
    const h = d.getHours()
    const bucket = (h < 6 ? 0 : h < 12 ? 1 : h < 18 ? 2 : 3) as 0 | 1 | 2 | 3
    const key = `${weekday}-${bucket}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const cells: ConversionHeatmapCell[] = []
  let max = 0
  for (let wd = 0; wd < 7; wd++) {
    for (let b = 0 as 0 | 1 | 2 | 3; b < 4; b++) {
      const count = counts.get(`${wd}-${b}`) ?? 0
      cells.push({ weekday: wd, bucket: b, count })
      if (count > max) max = count
    }
  }
  return { cells, max }
}

/**
 * Breakdown por "fonte de tráfego" — derivado de `transactions.method` +
 * `transactions.description` enquanto não houver campo `source` dedicado.
 *   - `telegram_bot`: descrição contém "telegram" (case-insensitive)
 *   - `checkout_direct`: method=card|boleto OU descrição contém "checkout"
 *   - `api`: descrição contém "api"
 *   - `other`: resto
 */
export async function getSourceBreakdown(
  range: DateRange,
): Promise<SourceBreakdown> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('amount, status, method, description, created_at')
    .gte('created_at', range.from)
    .lte('created_at', `${range.to}T23:59:59.999Z`)
    .eq('status', 'approved')
    .returns<
      { amount: number | string; status: string; method: string; description: string | null; created_at: string }[]
    >()

  const buckets: Record<SourceBreakdownItem['key'], SourceBreakdownItem> = {
    telegram_bot: { key: 'telegram_bot', label: 'Bot Telegram', count: 0, amount: 0 },
    checkout_direct: { key: 'checkout_direct', label: 'Checkout direto', count: 0, amount: 0 },
    api: { key: 'api', label: 'API', count: 0, amount: 0 },
    other: { key: 'other', label: 'Outros', count: 0, amount: 0 },
  }

  for (const t of data ?? []) {
    const desc = (t.description ?? '').toLowerCase()
    let key: SourceBreakdownItem['key'] = 'other'
    if (desc.includes('telegram')) key = 'telegram_bot'
    else if (desc.includes('checkout') || t.method === 'card' || t.method === 'boleto')
      key = 'checkout_direct'
    else if (desc.includes('api')) key = 'api'

    buckets[key].count += 1
    buckets[key].amount = roundCurrency(buckets[key].amount + Number(t.amount))
  }

  return { items: Object.values(buckets) }
}