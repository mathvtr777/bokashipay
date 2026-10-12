'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import type { DashboardMetrics, RangeChange, SalesPoint } from '@/lib/types'
import { SkeletonCard } from '@/components/ui/feedback'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

/**
 * Cards de métricas financeiras cyberpunk (4 colunas).
 * Ícones neon, glassmorphism e gradientes vibrantes.
 */
export function StatCards({
  metrics,
  series,
  loading,
}: {
  metrics: DashboardMetrics | null
  series: SalesPoint[]
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
      key: 'approved',
      label: 'Vendas Aprovadas',
      value: formatCurrency(metrics.totalReceived),
      subValue: `${metrics.approvedSales} aprovada${metrics.approvedSales !== 1 ? 's' : ''}`,
      icon: 'check',
      change: metrics.change.totalReceived,
      series,
      accent: '#20D6A0',
      accentBg: 'bg-emerald-500/10',
      accentText: 'text-emerald-400',
    },
    {
      key: 'pending',
      label: 'Vendas Pendentes',
      value: formatCurrency(metrics.pendingBalance ?? 0),
      subValue: 'Aguardando confirmação',
      icon: 'clock',
      change: null,
      series,
      accent: '#F5B942',
      accentBg: 'bg-amber-500/10',
      accentText: 'text-amber-400',
    },
    {
      key: 'conversion',
      label: 'Taxa de Conversão',
      value: formatPercent(metrics.conversionRate, 1),
      subValue: 'Aprovadas sobre o total',
      icon: 'zap',
      change: null,
      series,
      accent: '#9333EA',
      accentBg: 'bg-cyber-purple/10',
      accentText: 'text-cyber-violet',
    },
    {
      key: 'ticket',
      label: 'Ticket Médio',
      value: metrics.approvedSales > 0
        ? formatCurrency(metrics.totalReceived / metrics.approvedSales)
        : formatCurrency(0),
      subValue: 'Por venda aprovada',
      icon: 'dollar',
      change: null,
      series,
      accent: '#6366F1',
      accentBg: 'bg-cyber-indigo/10',
      accentText: 'text-cyber-indigo',
    },
  ] as const

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={card.value}
          subValue={card.subValue}
          icon={card.icon}
          change={card.change}
          accent={card.accent}
          accentBg={card.accentBg}
          accentText={card.accentText}
        />
      ))}
    </div>
  )
}

function StatCard({
  label,
  value,
  subValue,
  icon,
  change,
  accent,
  accentBg,
  accentText,
}: {
  label: string
  value: string
  subValue: string
  icon: string
  change?: RangeChange | null
  accent: string
  accentBg: string
  accentText: string
}) {
  return (
    <div className="glass-panel p-4 rounded-xl border border-cyber-purple/15 hover:border-cyber-purple/40 transition group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">{label}</span>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center group-hover:shadow-neon-sm transition', accentBg)}>
          {getIcon(icon, accentText)}
        </div>
      </div>
      <div className="text-xl font-bold font-mono text-white">{value}</div>
      <div className="flex items-center gap-1.5 text-[10px] mt-1.5 font-medium">
        {icon === 'check' && (
          <svg className="w-3 h-3 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        )}
        {icon === 'clock' && (
          <svg className="w-3 h-3 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        )}
        {icon === 'percent' && (
          <svg className="w-3 h-3 text-cyber-violet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
          </svg>
        )}
        {icon === 'zap' && (
          <svg className="w-3 h-3 text-cyber-violet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        )}
        {icon === 'dollar' && (
          <svg className="w-3 h-3 text-cyber-indigo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        )}
        <span className={cn(accentText)}>{subValue}</span>
      </div>
    </div>
  )
}

function getIcon(icon: string, accentText: string) {
  const className = cn('w-4 h-4', accentText)
  switch (icon) {
    case 'check':
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
    case 'clock':
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    case 'zap':
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    case 'dollar':
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    default:
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
  }
}

function ChangeBadge({ change }: { change: RangeChange }) {
  if (change.value === null) return null

  const arrow = change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '·'
  const isUp = change.trend === 'up'
  const isDown = change.trend === 'down'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
        isUp && 'bg-emerald-500/15 text-emerald-400',
        isDown && 'bg-red-500/15 text-red-400',
        !isUp && !isDown && 'bg-white/[0.08] text-white/70',
      )}
      title="Comparado ao período anterior"
    >
      <span aria-hidden>{arrow}</span>
      {Math.abs(change.value).toFixed(1).replace('.', ',')}%
    </span>
  )
}
