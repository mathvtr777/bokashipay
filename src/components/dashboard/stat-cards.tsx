import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import type { DashboardMetrics } from '@/lib/types'
import * as Icons from '@/components/ui/icons'
import { SkeletonCard } from '@/components/ui/feedback'

/**
 * Cards financeiros do topo.
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Saldo disponível',
      value: formatCurrency(metrics.availableBalance),
      icon: Icons.Wallet,
      tone: 'brand' as const,
      hint: 'Pronto para saque',
    },
    {
      label: 'Saldo pendente',
      value: formatCurrency(metrics.pendingBalance),
      icon: Icons.Clock,
      tone: 'warning' as const,
      hint: 'Aguardando confirmação',
    },
    {
      label: 'Total recebido',
      value: formatCurrency(metrics.totalReceived),
      icon: Icons.TrendUp,
      tone: 'positive' as const,
      hint: 'Vendas aprovadas',
    },
    {
      label: 'Vendas aprovadas',
      value: formatNumber(metrics.approvedSales),
      icon: Icons.Sales,
      tone: 'info' as const,
      hint: `de ${formatNumber(metrics.totalSales)} no total`,
    },
    {
      label: 'Conversão',
      value: formatPercent(metrics.conversionRate),
      icon: Icons.Zap,
      tone: 'brand' as const,
      hint: 'Aprovadas sobre o total',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}

const TONES = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
  positive: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  info: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
}

function StatCard({
  label,
  value,
  icon: IconComponent,
  tone,
  hint,
}: {
  label: string
  value: string
  icon: (props: { className?: string }) => React.ReactElement
  tone: keyof typeof TONES
  hint: string
}) {
  return (
    <div className="surface surface-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
          {label}
        </p>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            TONES[tone],
          )}
        >
          <IconComponent className="h-4 w-4" />
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-ink-500 dark:text-ink-400">{hint}</p>
    </div>
  )
}