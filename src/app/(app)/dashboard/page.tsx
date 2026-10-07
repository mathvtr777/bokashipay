import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { BalanceHero, PendingBalanceCard } from '@/components/dashboard/balance-hero'
import { StatCards } from '@/components/dashboard/stat-cards'
import { GoalProgress } from '@/components/dashboard/goal-progress'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { TopProducts } from '@/components/dashboard/sales-table'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { ProducerRanking } from '@/components/dashboard/producer-ranking'
import { PixConversion } from '@/components/dashboard/pix-conversion'
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel'
import { PaymentVelocity } from '@/components/dashboard/payment-velocity'
import { firstName } from '@/lib/format'
import { resolveRange } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'
import {
  getDashboardMetrics,
  getProfile,
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
    getTopProducts(5),
    getStatusDonut(range),
    getProducerRanking(range, 5),
    getPixConversion(range),
    getConversionFunnel(),
    getPaymentVelocity(range),
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

      {/* Hero de saldo + card lateral de pendente. */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <BalanceHero availableBalance={metrics?.availableBalance ?? 0} />
        <PendingBalanceCard value={metrics?.pendingBalance ?? 0} />
      </div>

      <StatCards metrics={metrics} />

      {/* Período de análise + seletor */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/40">Período de análise</p>
        <PeriodSelector />
      </div>

      {/* Gráfico de receita + Status dos pedidos */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart data={series} dateLabel={dateLabel} />
        </div>
        <div className="surface flex flex-col">
          <div className="border-b border-white/[0.06] p-5 pb-4">
            <h2 className="text-base font-semibold tracking-tight text-white">Status dos pedidos</h2>
            <p className="mt-1 text-sm text-white/50">Aprovadas vs pendentes</p>
          </div>
          <div className="flex-1 px-5 py-6">
            <StatusDonut approved={statusDonut.approved} pending={statusDonut.pending} />
          </div>
        </div>
      </div>

      {/* Ranking de produtores (2/3) + Conversão de PIX (1/3) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="surface xl:col-span-2">
          <div className="flex items-start justify-between gap-4 p-5 pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">Ranking de produtores</h2>
              <p className="mt-1 text-sm text-white/50">Top 5 do mês · atualizado agora</p>
            </div>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
              Ao vivo
            </span>
          </div>
          <div className="px-5 pb-5">
            <ProducerRanking producers={producerRanking} live />
          </div>
        </div>

        <div className="surface flex flex-col">
          <div className="border-b border-white/[0.06] p-5 pb-4">
            <h2 className="text-base font-semibold tracking-tight text-white">Conversão de PIX</h2>
            <p className="mt-1 text-sm text-white/50">Pedidos gerados vs pagos</p>
          </div>
          <div className="flex-1 px-5 py-6">
            <PixConversion generated={pixConversion.generated} paid={pixConversion.paid} />
          </div>
        </div>
      </div>

      {/* Funil de conversão (2/3) + Velocidade de pagamento (1/3) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="surface xl:col-span-2">
          <div className="border-b border-white/[0.06] p-5 pb-4">
            <h2 className="text-base font-semibold tracking-tight text-white">Funil de conversão</h2>
            <p className="mt-1 text-sm text-white/50">PIX gerado → pago</p>
          </div>
          <div className="px-5 py-5">
            <ConversionFunnel
              generated={conversionFunnel.generated}
              paid={conversionFunnel.paid}
            />
          </div>
        </div>

        <div className="surface flex flex-col">
          <div className="border-b border-white/[0.06] p-5 pb-4">
            <h2 className="text-base font-semibold tracking-tight text-white">Velocidade de pagamento</h2>
            <p className="mt-1 text-sm text-white/50">Tempo médio até a confirmação</p>
          </div>
          <div className="flex-1 px-5 py-6">
            <PaymentVelocity
              series={paymentVelocity.series}
              medianSeconds={paymentVelocity.medianSeconds}
            />
          </div>
        </div>
      </div>

      {/* Top produtos no fim. */}
      <TopProducts products={products} />
    </div>
  )
}