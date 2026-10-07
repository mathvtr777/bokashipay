import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import type { DashboardMetrics, RangeChange } from '@/lib/types'
import * as Icons from '@/components/ui/icons'
import { SkeletonCard } from '@/components/ui/feedback'

/**
 * Cards financeiros do topo — 4 cards no padrão visual Laranjinha,
 * adaptado para a paleta roxo/branco.
 *
 * Todos os valores vêm de `getDashboardMetrics()` — nada de número fixo no
 * componente. `change` é opcional: quando o período anterior não tem base de
 * comparação, o card omite a variação em vez de mostrar um "+∞%".
 */
export function StatCards({
  metrics,
  loading,
}: {
  metrics: DashboardMetrics | null
  loading?: boolean
}) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Vendas no período',
      value: formatCurrency(metrics.totalReceived),
      icon: Icons.TrendUp,
      hint: `${formatNumber(metrics.approvedSales)} aprovadas`,
      change: metrics.change.totalReceived,
    },
    {
      label: 'Vendas pendentes',
      value: formatCurrency(metrics.pendingBalance),
      icon: Icons.Clock,
      hint: 'Aguardando confirmação',
    },
    {
      label: 'Taxa de conversão',
      value: formatPercent(metrics.conversionRate, 1),
      icon: Icons.Zap,
      hint: 'Aprovadas sobre o total',
    },
    {
      label: 'Ticket médio',
      value:
        metrics.approvedSales > 0
          ? formatCurrency(metrics.totalReceived / metrics.approvedSales)
          : formatCurrency(0),
      icon: Icons.Inbox,
      hint: 'Por venda aprovada',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: IconComponent,
  hint,
  change,
}: {
  label: string
  value: string
  icon: (props: { className?: string }) => React.ReactElement
  hint: string
  change?: RangeChange
}) {
  return (
    <div className="surface surface-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {label}
        </p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
          <IconComponent className="h-[18px] w-[18px]" />
        </span>
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-white/50">
        <span className="truncate">{hint}</span>
        {change && <ChangeBadge change={change} />}
      </div>
    </div>
  )
}

function ChangeBadge({ change }: { change: RangeChange }) {
  // Sem base de comparação (período anterior vazio) → não mostra badge.
  if (change.value === null) return null

  const arrow =
    change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '·'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/70',
      )}
      title="Comparado ao período anterior"
    >
      <span aria-hidden>{arrow}</span>
      {Math.abs(change.value).toFixed(1).replace('.', ',')}%
    </span>
  )
}