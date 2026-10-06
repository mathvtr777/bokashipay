import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { SalesFiltersTable } from '@/components/vendas/sales-filters-table'
import { getSales } from '@/lib/queries'
import { resolveRange } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'

export const metadata: Metadata = { title: 'Vendas' }

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams

  const range = resolveRange((params.periodo ?? '30d') as DateRangePreset, params.de, params.ate)
  const page = Math.max(1, Number(params.pagina ?? '1'))
  const pageSize = 20

  // Os mesmos filtros do querystring são aplicados na consulta — o cliente e o
  // servidor nunca discordam sobre o que está na tela.
  const { data, total, totalPages } = await getSales({
    range,
    status: params.status,
    method: params.metodo,
    customerQuery: params.cliente,
    minAmount: params.min ? Number(params.min) : undefined,
    maxAmount: params.max ? Number(params.max) : undefined,
    page,
    pageSize,
  })

  return (
    <div>
      <PageHeader
        title="Vendas"
        description="Acompanhe cada cobrança do seu negócio."
        actions={<PeriodSelector />}
      />

      <SalesFiltersTable rows={data} total={total} totalPages={totalPages} />
    </div>
  )
}