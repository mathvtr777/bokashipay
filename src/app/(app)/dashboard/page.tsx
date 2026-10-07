import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { BalanceHero, PendingBalanceCard } from '@/components/dashboard/balance-hero'
import { StatCards } from '@/components/dashboard/stat-cards'
import { GoalProgress } from '@/components/dashboard/goal-progress'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { PaymentMethods } from '@/components/dashboard/payment-methods'
import { SalesTable, TopProducts } from '@/components/dashboard/sales-table'
import { RecentSalesCard } from '@/components/dashboard/recent-sales-card'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { ProducerRanking } from '@/components/dashboard/producer-ranking'
import { PixConversion } from '@/components/dashboard/pix-conversion'
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel'
import { PaymentVelocity } from '@/components/dashboard/payment-velocity'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { firstName } from '@/lib/format'
import { resolveRange } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'
import {
  getDashboardMetrics,
  getPaymentMethodStats,
  getProfile,
  getRecentTransactions,
  getSalesSeries,
  getStatusDonut,
  getTopProducts,
  getProducerRanking,
  getPixConversion,
  getConversionFunnel,
  getPaymentVelocity,
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

  // Tudo em paralelo: queries existentes + 5 novos stubs.
  const [
    profile,
    metrics,
    series,
    recent,
    methods,
    products,
    statusDonut,
    producerRanking,
    pixConversion,
    conversionFunnel,
    paymentVelocity,
  ] = await Promise.all([
    getProfile(),
    getDashboardMetrics(range),
    getSalesSeries(range),
    getRecentTransactions(5),
    getPaymentMethodStats(),
    getTopProducts(5),
    getStatusDonut(range),
    getProducerRanking(5),
    getPixConversion(),
    getConversionFunnel(),
    getPaymentVelocity(),
  ])

  const name = firstName(profile?.full_name)

  // Rótulo do eixo do gráfico, dinâmico pelo período.
  const dateLabel =
    params.periodo === 'today'
      ? 'hoje'
      : params.periodo === '7d'
        ? 'últimos 7 dias'
        : params.periodo === '30d'
          ? 'últimos 30 dias'
          : params.periodo === '90d'
            ? 'últimos 90 dias'
            : 'período selecionado'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${name}`}
        description="Veja o desempenho do seu negócio hoje."
        actions={<GoalProgress goal={metrics?.goal ?? null} />}
      />

      {/* Hero de saldo (substitui o antigo carrossel) + card lateral de pendente. */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <BalanceHero availableBalance={metrics?.availableBalance ?? 0} />
        <PendingBalanceCard value={metrics?.pendingBalance ?? 0} />
      </div>

      <StatCards metrics={metrics} />

      {/* Gráfico de receita + seletor de período na mesma linha. */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <PeriodSelector />
        </div>
        <SalesChart data={series} dateLabel={dateLabel} />
      </div>

      {/* Grid principal: 2 colunas no xl. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Coluna esquerda (2/3): Conversão de PIX + Funil de Conversão */}
        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Conversão de PIX</CardTitle>
                  <CardDescription>Pedidos gerados vs pagos</CardDescription>
                </div>
              </CardHeader>
              <PixConversion
                generated={pixConversion.generated}
                paid={pixConversion.paid}
              />
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Funil de conversão</CardTitle>
                  <CardDescription>PIX gerado → pago</CardDescription>
                </div>
              </CardHeader>
              <ConversionFunnel
                generated={conversionFunnel.generated}
                paid={conversionFunnel.paid}
              />
            </Card>
          </div>

          {/* Últimas vendas */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-4 p-5 pb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-white">
                  Últimas vendas
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  As transações mais recentes da sua conta
                </p>
              </div>
            </div>
            <RecentSalesCard transactions={recent} />
          </Card>
        </div>

        {/* Coluna direita (1/3): Status dos pedidos + Ranking + Métodos + Velocidade. */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Status dos pedidos</CardTitle>
                <CardDescription>Aprovadas vs pendentes</CardDescription>
              </div>
            </CardHeader>
            <StatusDonut approved={statusDonut.approved} pending={statusDonut.pending} />
          </Card>

          <Card>
            <CardHeader>
              <div className="flex w-full items-start justify-between gap-2">
                <div>
                  <CardTitle>Ranking de produtores</CardTitle>
                  <CardDescription>Top 5 do mês · atualizado agora</CardDescription>
                </div>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                  Ao vivo
                </span>
              </div>
            </CardHeader>
            <ProducerRanking producers={producerRanking} live />
          </Card>

          <PaymentMethods stats={methods} />

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Velocidade de pagamento</CardTitle>
                <CardDescription>Tempo médio até a confirmação</CardDescription>
              </div>
            </CardHeader>
            <PaymentVelocity
              series={paymentVelocity.series}
              medianSeconds={paymentVelocity.medianSeconds}
            />
          </Card>
        </div>
      </div>

      {/* Ranking de produtos (mantido embaixo) */}
      <TopProducts products={products} />
    </div>
  )
}