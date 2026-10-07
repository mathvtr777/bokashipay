import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { AnalyticsStats } from '@/components/analises/analytics-stats'
import { RevenueAreaChart } from '@/components/analises/revenue-area-chart'
import { OrdersBarChart } from '@/components/analises/orders-bar-chart'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { ConversionFunnel3Steps } from '@/components/analises/conversion-funnel-3'
import { ConversionDonut } from '@/components/analises/conversion-donut'
import { SourceBreakdownCard } from '@/components/analises/source-breakdown'
import { ConversionHeatmap } from '@/components/analises/conversion-heatmap'
import { TopProducts } from '@/components/dashboard/sales-table'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartBar } from '@/components/ui/icons'
import { resolveRange } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'
import {
  getConversionFunnelSteps,
  getConversionHeatmap,
  getDashboardMetrics,
  getPaymentMethodStats,
  getPixTransactions,
  getProducerRanking,
  getSalesSeries,
  getSourceBreakdown,
  getStatusDonut,
  getTopProducts,
} from '@/lib/queries'

export const metadata: Metadata = { title: 'Análises' }

export default async function AnalisesPage({
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

  // Carrega tudo em paralelo.
  const [
    metrics,
    series,
    statusDonut,
    funnel,
    heatmap,
    topProducts,
    sourceBreakdown,
    pixTransactions,
    producers,
    paymentMethods,
  ] = await Promise.all([
    getDashboardMetrics(range),
    getSalesSeries(range),
    getStatusDonut(range),
    getConversionFunnelSteps(range),
    getConversionHeatmap(range),
    getTopProducts(5),
    getSourceBreakdown(range),
    getPixTransactions(50),
    getProducerRanking(range, 5),
    getPaymentMethodStats(),
  ])

  // Contadores específicos para os stat cards.
  const pixGenerated = funnel.generated
  const pixAwaiting = funnel.awaiting
  const totalAttempts = funnel.generated // cada PIX é uma tentativa
  const hasData = metrics.totalReceived > 0 || pixGenerated > 0

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ChartBar className="h-[18px] w-[18px]" />}
        title="Análises"
        description="Painel compacto de vendas, conversão, fontes de tráfego e desempenho dos seus produtos."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/40">Período de análise</p>
        <PeriodSelector />
      </div>

      <AnalyticsStats
        revenue={metrics.totalReceived}
        paidSales={metrics.approvedSales}
        pixAwaiting={pixAwaiting}
        conversion={metrics.conversionRate}
        avgTicket={
          metrics.approvedSales > 0 ? metrics.totalReceived / metrics.approvedSales : 0
        }
        totalAttempts={totalAttempts}
      />

      {/* Vendas & Receita */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-brand-300">
            <ChartBar className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold text-white">Vendas &amp; Receita</h2>
          <p className="text-xs text-white/40">Como sua receita evoluiu no período</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RevenueAreaChart data={series} range={range} />
          </div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Status dos pedidos</CardTitle>
                <CardDescription>Aprovadas vs pendentes</CardDescription>
              </div>
            </CardHeader>
            <StatusDonut approved={statusDonut.approved} pending={statusDonut.pending} />
          </Card>
        </div>

        <div className="mt-4">
          <OrdersBarChart data={series} />
        </div>
      </section>

      {/* Funil de Conversão */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-brand-300">
            <ChartBar className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold text-white">Funil de Conversão</h2>
          <p className="text-xs text-white/40">Do pagamento PIX até o pagamento confirmado</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ConversionFunnel3Steps funnel={funnel} />
          </div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Conversão geral</CardTitle>
                <CardDescription>PIX gerados vs pagos</CardDescription>
              </div>
            </CardHeader>
            <ConversionDonut
              percent={metrics.conversionRate}
              generated={pixGenerated}
              paid={funnel.paid}
            />
          </Card>
        </div>
      </section>

      {/* Fontes & Tráfego */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-brand-300">
            <ChartBar className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold text-white">Fontes &amp; Tráfego</h2>
          <p className="text-xs text-white/40">De onde vêm suas vendas</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SourceBreakdownCard breakdown={sourceBreakdown} paymentMethods={paymentMethods} />
          </div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Quando seus clientes compram</CardTitle>
                <CardDescription>Distribuição por dia e faixa horária</CardDescription>
              </div>
            </CardHeader>
            <ConversionHeatmap heatmap={heatmap} />
          </Card>
        </div>
      </section>

      {/* Top produtos */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-brand-300">
            <ChartBar className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold text-white">Top produtos</h2>
          <p className="text-xs text-white/40">Performance dos seus produtos no período</p>
        </div>
        {topProducts.length === 0 ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Top produtos</CardTitle>
                <CardDescription>Nenhum produto com vendas no período.</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ) : (
          <TopProducts products={topProducts} />
        )}
      </section>
    </div>
  )
}