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