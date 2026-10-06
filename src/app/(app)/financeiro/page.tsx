import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { FinanceSummary } from '@/components/financeiro/finance-summary'
import { FinancialStatement } from '@/components/financeiro/financial-statement'
import { getDashboardMetrics, getFinancialEntries, getSalesSeries } from '@/lib/queries'
import { resolveRange } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'

export const metadata: Metadata = { title: 'Financeiro' }

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>
}) {
  const params = await searchParams
  const range = resolveRange(
    (params.periodo ?? '30d') as DateRangePreset,
    params.de,
    params.ate,
  )

  const page = Math.max(1, Number((params as Record<string, string>).pagina ?? '1'))
  const pageSize = 25

  const [metrics, series, entries] = await Promise.all([
    getDashboardMetrics(),
    getSalesSeries(range),
    getFinancialEntries({
      range,
      type: (params as Record<string, string>).tipo,
      page,
      pageSize,
    }),
  ])

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Saldo, taxas e o caminho de cada centavo."
        actions={<PeriodSelector />}
      />

      <FinanceSummary metrics={metrics} />
      <FinancialStatement
        entries={entries.data}
        total={entries.total}
        totalPages={entries.totalPages}
        page={page}
        series={series}
      />
    </div>
  )
}