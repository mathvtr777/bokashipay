'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { SalesPoint } from '@/lib/types'

/**
 * Gráfico de volume de vendas.
 *
 * recharts é client-only (mede o container), então o Server Component passa os
 * dados já prontos e este componente só desenha.
 */
export function SalesChart({
  data,
  height = 300,
  className,
  dateLabel = 'hoje',
}: {
  data: SalesPoint[]
  height?: number
  className?: string
  dateLabel?: string
}) {
  const [metric, setMetric] = React.useState<'volume' | 'count'>('volume')

  const hasData = data.some((point) => point.volume > 0 || point.count > 0)

  // Com 12 meses, mostrar todo dia no eixo X vira ilegível.
  const tickInterval = data.length > 45 ? Math.ceil(data.length / 8) : 0

  return (
    <div className={cn('surface p-5', className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            Receita por hora
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Últimas horas · {dateLabel}
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
          {(
            [
              { key: 'volume', label: 'Volume' },
              { key: 'count', label: 'Transações' },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              onClick={() => setMetric(option.key)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
                metric === option.key
                  ? 'bg-white/[0.10] text-white'
                  : 'text-white/50 hover:text-white',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{ height }}
        >
          <p className="text-sm text-white/50">
            Ainda não há transações neste período.
          </p>
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.06)"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                dy={8}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                tickFormatter={(value: number) =>
                  metric === 'volume'
                    ? value >= 1000
                      ? `${Math.round(value / 1000)}k`
                      : String(value)
                    : String(value)
                }
              />

              <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: '#a78bfa', strokeWidth: 1, strokeDasharray: '4 4' }} />

              <Area
                type="monotone"
                dataKey={metric}
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#salesFill)"
                dot={false}
                activeDot={{ r: 4, fill: '#a78bfa', stroke: '#14171f', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rodapé de horas (estilo Laranjinha). */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-white/30">
        <span>00h</span>
        <span>03h</span>
        <span>06h</span>
        <span>09h</span>
        <span>12h</span>
        <span>15h</span>
        <span>18h</span>
        <span>21h</span>
      </div>
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean
  payload?: { value: number; payload: SalesPoint }[]
  label?: string
  metric: 'volume' | 'count'
}) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload

  return (
    <div className="rounded-xl border border-white/[0.08] bg-surface px-3.5 py-2.5 shadow-lg">
      <p className="text-xs font-medium text-white/50">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">
        {formatCurrency(point.volume)}
      </p>
      <p className="mt-0.5 text-xs text-white/40">
        {point.count} {point.count === 1 ? 'transação' : 'transações'}
      </p>
    </div>
  )
}