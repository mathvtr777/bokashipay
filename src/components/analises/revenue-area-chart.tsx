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
import { formatCurrency } from '@/lib/format'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendUp } from '@/components/ui/icons'
import type { DateRange, SalesPoint } from '@/lib/types'

/**
 * Gráfico de área "Receita por dia" (referência Análises). Mostra o volume
 * diário no range selecionado. Quando vazio, fica plano sem panic.
 */
export function RevenueAreaChart({ data, range }: { data: SalesPoint[]; range?: DateRange }) {
  const hasData = data.some((p) => p.volume > 0)
  const tickInterval = data.length > 45 ? Math.ceil(data.length / 8) : 0

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-brand-300">
              <TrendUp className="h-3.5 w-3.5" />
            </span>
            <div>
              <CardTitle>Receita por dia</CardTitle>
              <CardDescription>Volume recebido no período</CardDescription>
            </div>
          </div>
          {range && (
            <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/50">
              {presetLabel(range.preset)}
            </span>
          )}
        </div>
      </CardHeader>
      <div className="px-5 pb-5 pt-3" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip
              cursor={{ stroke: '#a78bfa', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as SalesPoint
                return (
                  <div className="rounded-xl border border-white/[0.08] bg-surface px-3 py-2 shadow-lg">
                    <p className="text-xs text-white/50">{p.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {hasData ? formatCurrency(p.volume) : '—'}
                    </p>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#a78bfa"
              strokeWidth={2}
              fill="url(#revAreaFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#a78bfa', stroke: '#14171f', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function presetLabel(preset: DateRange['preset']): string {
  switch (preset) {
    case 'today': return 'Hoje'
    case '7d': return '7 dias'
    case '30d': return '30 dias'
    case '90d': return '90 dias'
    case '12m': return '12 meses'
    default: return 'Personalizado'
  }
}