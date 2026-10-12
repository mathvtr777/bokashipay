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
 * Gráfico de receita cyberpunk futurista.
 * Neon wave com glow e gradientes vibrantes.
 */
export function RevenueChart({
  data,
  height = 280,
  className,
  dateLabel = 'período selecionado',
}: {
  data: SalesPoint[]
  height?: number
  className?: string
  dateLabel?: string
}) {
  const [metric, setMetric] = React.useState<'volume' | 'count' | 'average'>('volume')

  const hasData = data.some((p) => p.volume > 0 || p.count > 0)

  const chartData = React.useMemo(() => {
    if (metric !== 'average') return data
    return data.map((p) => ({
      ...p,
      volume: p.count > 0 ? p.volume / p.count : 0,
    }))
  }, [data, metric])

  const tickInterval = data.length > 45 ? Math.ceil(data.length / 8) : 0

  return (
    <div className={cn('', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">Receita por hora</h3>
          <p className="text-[11px] text-slate-400">Últimas horas • período selecionado</p>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-elevated/60 p-1 rounded-lg border border-cyber-purple/20 text-[10px] font-mono">
          <button
            className="px-2.5 py-1 rounded bg-cyber-purple/30 text-cyber-violet border border-cyber-purple/40"
            onClick={() => setMetric('volume')}
          >
            Volume
          </button>
          <button
            className="px-2.5 py-1 rounded text-slate-400 hover:text-white"
            onClick={() => setMetric('count')}
          >
            Transações
          </button>
        </div>
      </div>

      {!hasData ? (
        <div
          className="flex flex-col items-center justify-center text-center rounded-xl bg-surface-card/50 border border-cyber-purple/10 p-12"
          style={{ height }}
        >
          <svg className="w-12 h-12 text-cyber-purple/40 mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18"/>
            <path d="m19 9-5 5-4-4-3 3"/>
          </svg>
          <p className="text-sm text-slate-400">
            Ainda não há transações neste período.
          </p>
          <p className="text-xs text-slate-500 mt-1">Crie sua primeira cobrança para ver o gráfico</p>
        </div>
      ) : (
        <div className="relative w-full h-56 pt-2">
          <div className="relative w-full h-full">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-slate-600">
              <div className="border-b border-cyber-purple/10 w-full flex justify-between"><span>R$ 150</span></div>
              <div className="border-b border-cyber-purple/10 w-full flex justify-between"><span>R$ 100</span></div>
              <div className="border-b border-cyber-purple/10 w-full flex justify-between"><span>R$ 50</span></div>
              <div className="border-b border-cyber-purple/10 w-full flex justify-between"><span>R$ 0</span></div>
            </div>

            <div style={{ height }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyberNeonGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.45} />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#06050a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(147, 51, 234, 0.1)"
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                    dy={8}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={64}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                    tickFormatter={(value: number) =>
                      metric === 'volume' || metric === 'average'
                        ? value >= 1000
                          ? `${Math.round(value / 1000)}k`
                          : String(Math.round(value))
                        : String(value)
                    }
                  />

                  <Tooltip
                    content={<ChartTooltip metric={metric} />}
                    cursor={{ stroke: '#a855f7', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />

                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#c084fc"
                    strokeWidth={2.5}
                    fill="url(#cyberNeonGradient)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: '#ffffff',
                      stroke: '#9333ea',
                      strokeWidth: 3,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Time Scale */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-3 border-t border-cyber-purple/10">
        <span>00h</span>
        <span>04h</span>
        <span>08h</span>
        <span>12h</span>
        <span>16h</span>
        <span>20h</span>
        <span>23h</span>
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
  metric: 'volume' | 'count' | 'average'
}) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload
  const value = payload[0].value

  return (
    <div className="rounded-xl border border-cyber-purple/40 bg-deep/90 px-3.5 py-2.5 shadow-neon-sm backdrop-blur-md">
      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">
        {metric === 'count'
          ? `${value} ${value === 1 ? 'transação' : 'transações'}`
          : formatCurrency(value)}
      </p>
      {metric !== 'count' && (
        <p className="mt-0.5 text-xs text-slate-400">
          {point.count} {point.count === 1 ? 'transação' : 'transações'}
        </p>
      )}
    </div>
  )
}
