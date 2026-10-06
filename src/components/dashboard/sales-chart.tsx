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
}: {
  data: SalesPoint[]
  height?: number
  className?: string
}) {
  const [metric, setMetric] = React.useState<'volume' | 'count'>('volume')

  const hasData = data.some((point) => point.volume > 0 || point.count > 0)

  // Com 12 meses, mostrar todo dia no eixo X vira ilegível.
  const tickInterval = data.length > 45 ? Math.ceil(data.length / 8) : 0

  return (
    <div className={cn('surface p-5', className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">
            Resumo das transações
          </h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Volume recebido e número de transações no período
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg bg-ink-100 p-0.5 dark:bg-ink-800">
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
                  ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white'
                  : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200',
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
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Ainda não há transações neste período.
          </p>
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-ink-200 dark:text-ink-800"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-ink-500 dark:text-ink-400"
                dy={8}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-ink-500 dark:text-ink-400"
                tickFormatter={(value: number) =>
                  metric === 'volume'
                    ? value >= 1000
                      ? `${Math.round(value / 1000)}k`
                      : String(value)
                    : String(value)
                }
              />

              <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />

              <Area
                type="monotone"
                dataKey={metric}
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#salesFill)"
                dot={false}
                activeDot={{ r: 4, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
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
    <div className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 shadow-lg dark:border-ink-700 dark:bg-ink-800">
      <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">
        {formatCurrency(point.volume)}
      </p>
      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
        {point.count} {point.count === 1 ? 'transação' : 'transações'}
      </p>
    </div>
  )
}