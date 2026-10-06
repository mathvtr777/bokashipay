import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { BannerCarousel, FALLBACK_BANNERS } from '@/components/dashboard/banner-carousel'
import { StatCards } from '@/components/dashboard/stat-cards'
import { GoalProgress } from '@/components/dashboard/goal-progress'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { PaymentMethods } from '@/components/dashboard/payment-methods'
import { SalesTable, TopProducts } from '@/components/dashboard/sales-table'
import { RecentSalesCard } from '@/components/dashboard/recent-sales-card'
import { Card } from '@/components/ui/card'
import { firstName } from '@/lib/format'
import { resolveRange } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'
import {
  getActiveBanners,
  getDashboardMetrics,
  getPaymentMethodStats,
  getProfile,
  getRecentTransactions,
  getSalesSeries,
  getTopProducts,
} from '@/lib/queries'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage({
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

  // Tudo em paralelo: cinco idas ao banco em vez de cinco em sequência.
  const [profile, metrics, series, recent, methods, products, banners] = await Promise.all([
    getProfile(),
    getDashboardMetrics(range),
    getSalesSeries(range),
    getRecentTransactions(5),
    getPaymentMethodStats(),
    getTopProducts(5),
    getActiveBanners(),
  ])

  const name = firstName(profile?.full_name)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${name}`}
        description="Veja o desempenho do seu negócio hoje."
        actions={<GoalProgress goal={metrics?.goal ?? null} />}
      />

      <BannerCarousel banners={banners.length > 0 ? banners : FALLBACK_BANNERS} />

      <StatCards metrics={metrics} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart data={series} />
        </div>
        <PaymentMethods stats={methods} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-4 p-5 pb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">
                  Últimas vendas
                </h2>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  As transações mais recentes da sua conta
                </p>
              </div>
            </div>
            <RecentSalesCard transactions={recent} />
          </Card>
        </div>

        <TopProducts products={products} />
      </div>
    </div>
  )
}