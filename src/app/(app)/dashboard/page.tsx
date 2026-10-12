import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/app-shell'
import { RevenueCard } from '@/components/dashboard/revenue-card'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { StatCards } from '@/components/dashboard/stat-cards'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { ChargeStatusChart } from '@/components/dashboard/charge-status-chart'
import { RecentTransactionsTable } from '@/components/dashboard/recent-transactions-table'
import { PendingCharges } from '@/components/dashboard/pending-charges'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { Button } from '@/components/ui/button'
import { firstName } from '@/lib/format'
import { resolveRange } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'
import {
  getBankAccounts,
  getDashboardMetrics,
  getProfile,
  getRecentTransactions,
  getSalesSeries,
  getStatusDonut,
} from '@/lib/queries'
import { getPixProvider } from '@/services/pix'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise< { periodo?: string; de?: string; ate?: string }>
}) {
  const params = await searchParams
  const range = resolveRange(
    (params.periodo ?? '7d') as DateRangePreset,
    params.de,
    params.ate,
  )

  // Queries em paralelo: métricas, série, status, últimas transações, perfil.
  const [
    profile,
    metrics,
    series,
    statusDonut,
    recentTransactions,
  ] = await Promise.all([
    getProfile(),
    getDashboardMetrics(range),
    getSalesSeries(range),
    getStatusDonut(range),
    getRecentTransactions(5),
  ])

  // Chave PIX do merchant (conta primária) + status do provedor
  const bankAccounts = await getBankAccounts()
  const primaryAccount = bankAccounts.find((a) => a.is_primary) ?? bankAccounts[0]
  const pixKey = primaryAccount?.pix_key ?? null
  const providerConfigured = getPixProvider().isConfigured()

  const name = firstName(profile?.full_name)

  // Rótulo do período para o cabeçalho e o card de receita.
  const periodLabel =
    params.periodo === 'today'
      ? 'hoje'
      : params.periodo === '7d'
        ? 'últimos 7 dias'
        : params.periodo === '30d'
          ? 'últimos 30 dias'
          : params.periodo === '90d'
            ? 'últimos 90 dias'
            : 'período selecionado'

  // Pendentes = transactions pendentes recentes (limit 6 para o card).
  const pendingTransactions = recentTransactions
    .filter((t) => t.status === 'pending')
    .slice(0, 6)

  // Datas inicial/final formatadas para o badge do período.
  const dateRangeLabel = `${formatDateLabel(range.from)} – ${formatDateLabel(range.to)}`

  return (
    <div className="space-y-6">
      {/* Welcome Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Olá, {name} <span className="inline-block animate-pulse">⚡</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Veja o desempenho do seu negócio em tempo real.</p>
        </div>
        {/* Period Selector Tabs */}
        <div className="flex items-center bg-surface-elevated/60 p-1 rounded-xl border border-cyber-purple/20 text-xs font-mono">
          <button className="px-3 py-1 rounded-lg text-slate-400 hover:text-white transition">Hoje</button>
          <button className="px-3 py-1 rounded-lg text-slate-400 hover:text-white transition">7 dias</button>
          <button className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-cyber-purple to-cyber-indigo text-white font-semibold shadow-neon-sm">15 dias</button>
          <button className="px-3 py-1 rounded-lg text-slate-400 hover:text-white transition">30 dias</button>
        </div>
      </div>

      {/* Linha 1: Card de receita (2 colunas) + Saldo pendente (1 coluna) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RevenueCard
          value={metrics?.totalReceived ?? 0}
          change={metrics?.change.totalReceived}
          series={series}
          dateLabel={periodLabel}
          className="lg:col-span-2"
        />
        <BalanceCard
          value={metrics?.availableBalance ?? 0}
          pendingBalance={metrics?.pendingBalance ?? 0}
        />
      </div>

      {/* Linha 2: 4 cards de métricas cyberpunk */}
      <StatCards metrics={metrics} series={series} />

      {/* Linha 3: Gráfico de receita (2 colunas) + Status das cobranças (1 coluna) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 glass-panel p-5 rounded-2xl">
          <RevenueChart data={series} dateLabel={periodLabel} />
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <ChargeStatusChart
            approved={statusDonut.approved}
            pending={statusDonut.pending}
          />
        </div>
      </div>

      {/* Linha 4: Últimas transações (2 colunas) + Cobranças em aberto (1 coluna) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 pb-4">
        <div className="glass-panel xl:col-span-2 rounded-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-cyber-purple/10 p-5 pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                Últimas transações
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                As 5 transações mais recentes
              </p>
            </div>
            <Link href="/transacoes">
              <Button variant="ghost" size="sm" className="rounded-lg">
                Ver todas
                <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </Button>
            </Link>
          </div>
          <RecentTransactionsTable
            transactions={recentTransactions.slice(0, 5) as never}
          />
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                Cobranças em aberto
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Acompanhe suas cobranças pendentes
              </p>
            </div>
            <Link href="/vendas?status=pending">
              <Button variant="ghost" size="sm" className="rounded-lg">
                Ver todas
                <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </Button>
            </Link>
          </div>
          <PendingCharges transactions={pendingTransactions as never} />
        </div>
      </div>
    </div>
  )
}

function formatDateLabel(iso: string): string {
  // iso = 'yyyy-mm-dd'
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}
