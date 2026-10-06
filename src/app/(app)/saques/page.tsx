import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { WithdrawalRequests } from '@/components/saques/withdrawal-requests'
import { getDashboardMetrics, getWithdrawals, getWithdrawalSummary } from '@/lib/queries'

export const metadata: Metadata = { title: 'Saques' }

export default async function WithdrawalsPage() {
  const [requests, summary, metrics] = await Promise.all([
    getWithdrawals(50),
    getWithdrawalSummary(),
    getDashboardMetrics(),
  ])

  return (
    <div>
      <PageHeader
        title="Saques"
        description="Solicite saques em reais para sua chave PIX."
      />

      <WithdrawalRequests
        initialRequests={requests}
        summary={summary}
        availableBalance={metrics.availableBalance}
      />
    </div>
  )
}