import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { InfracoesStatsCard } from '@/components/infracoes/infracoes-stats'
import { InfracoesList } from '@/components/infracoes/infracoes-list'
import { resolveRange } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'
import { getInfracoes, getInfracoesStats } from '@/lib/queries'

export const metadata: Metadata = { title: 'Infrações' }

export default async function InfracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string; q?: string; status?: string }>
}) {
  const params = await searchParams
  const range = resolveRange(
    (params.periodo ?? '30d') as DateRangePreset,
    params.de,
    params.ate,
  )

  const [stats, list] = await Promise.all([
    getInfracoesStats(range),
    getInfracoes({
      range,
      status: params.status,
      query: params.q,
      page: 1,
      pageSize: 50,
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infrações"
        description="A BokashiPay contesta automaticamente cada infração para proteger o seu saldo. Infrações defendidas não geram taxa."
      />

      <InfracoesStatsCard
        total={stats.total}
        analyzing={stats.analyzing}
        inDispute={stats.inDispute}
        defended={stats.defended}
      />

      <InfracoesList
        rows={list}
        currentQuery={params.q ?? ''}
        currentStatus={params.status ?? 'all'}
      />
    </div>
  )
}