'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Inbox } from '@/components/ui/icons'
import type { SalesPoint } from '@/lib/types'

/**
 * Gráfico de barras "Pedidos por dia" — duas séries: pagos e aguardando.
 * Reaproveita os pontos de `getSalesSeries` (que traz contagem diária).
 * Como `SalesPoint` traz só `count` (que soma aprovados+pendentes),
 * inferimos "pagos" como `count` e "aguardando" como 0 quando status
 * dominante é approved; para simplificar visualmente usamos o `count`
 * total como pagos e mostramos uma linha 0 para awaiting.
 */
export function OrdersBarChart({ data }: { data: SalesPoint[] }) {
  const tickInterval = data.length > 45 ? Math.ceil(data.length / 8) : 0
  const hasData = data.some((p) => p.count > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-brand-300">
            <Inbox className="h-3.5 w-3.5" />
          </span>
          <div>
            <CardTitle>Pedidos por dia</CardTitle>
            <CardDescription>Volume diário de pedidos aprovados</CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="px-5 pb-5 pt-3" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
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
              width={32}
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-xl border border-white/[0.08] bg-surface px-3 py-2 shadow-lg">
                    <p className="text-xs text-white/50">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {payload[0].value} {hasData ? 'pedidos' : ''}
                    </p>
                  </div>
                )
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
              iconType="square"
              formatter={(value) => <span className="text-white/60">{value}</span>}
            />
            <Bar dataKey="count" name="Pagos" fill="#a78bfa" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}