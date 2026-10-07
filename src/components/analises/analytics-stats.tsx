import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import * as Icons from '@/components/ui/icons'

/**
 * 6 stat cards no padrão da Laranjinha (Receita, Vendas Pagas, Pix
 * Aguardando, Conversão, Ticket Médio, Total de Tentativas). Todos os
 * ícones em `bg-brand-500/15 text-brand-300` (paleta roxa, sem cor
 * semântica).
 */
export function AnalyticsStats({
  revenue,
  paidSales,
  pixAwaiting,
  conversion,
  avgTicket,
  totalAttempts,
}: {
  revenue: number
  paidSales: number
  pixAwaiting: number
  conversion: number
  avgTicket: number
  totalAttempts: number
}) {
  const cards = [
    { label: 'Receita', value: formatCurrency(revenue), icon: Icons.DollarSign },
    { label: 'Vendas Pagas', value: formatNumber(paidSales), icon: Icons.Cart },
    { label: 'Pix Aguardando', value: formatNumber(pixAwaiting), icon: Icons.Clock },
    { label: 'Conversão', value: formatPercent(conversion, 1), icon: Icons.Zap },
    { label: 'Ticket Médio', value: formatCurrency(avgTicket), icon: Icons.Card },
    { label: 'Total de Tentativas', value: formatNumber(totalAttempts), icon: Icons.Zap },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((c, i) => {
        const Icon = c.icon
        const isFirst = i === 0
        return (
          <div
            key={c.label}
            className={cn(
              'surface p-4',
              isFirst && 'ring-1 ring-brand-500/30 bg-brand-500/[0.04]',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {c.label}
              </p>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
                <Icon className="h-[14px] w-[14px]" />
              </span>
            </div>
            <p className="mt-3 text-xl font-semibold tabular-nums text-white">{c.value}</p>
          </div>
        )
      })}
    </div>
  )
}