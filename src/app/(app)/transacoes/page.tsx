import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { TransactionsStats } from '@/components/transacoes/transactions-stats'
import { TransactionsFilters } from '@/components/transacoes/transactions-filters'
import { TransactionsTable } from '@/components/transacoes/transactions-table'
import { resolveRange } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'
import { getTransactions, getTransactionsStats } from '@/lib/queries'

export const metadata: Metadata = { title: 'Transações' }

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const range = resolveRange(
    (params.periodo ?? 'today') as DateRangePreset,
    params.de,
    params.ate,
  )
  const page = Math.max(1, Number(params.pagina ?? '1'))
  const pageSize = 20

  const [stats, list] = await Promise.all([
    getTransactionsStats(range),
    getTransactions({
      range,
      status: params.status,
      source: params.origem,
      query: params.q,
      page,
      pageSize,
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações"
        description="Tudo que entrou — pagas e pendentes — com origem, cliente e detalhes."
      />

      <TransactionsStats
        totalReceived={stats.totalReceived}
        paidSales={stats.paidSales}
        paidAmount={stats.paidAmount}
        ticket={stats.avgTicket}
        pendingAmount={stats.pendingAmount}
        pendingCount={stats.pendingCount}
        indicationsAmount={stats.indications.amount}
        indicationsCount={stats.indications.count}
      />

      <TransactionsFilters
        currentPeriodo={(params.periodo ?? 'today') as DateRangePreset}
        currentStatus={params.status ?? 'all'}
        currentSource={params.origem ?? 'all'}
        currentQuery={params.q ?? ''}
      />

      <TransactionsTable
        rows={list.data as any}
        total={list.total}
        page={list.page}
        totalPages={list.totalPages}
      />
    </div>
  )
}