'use client'

import * as React from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { SalesPoint, RangeChange } from '@/lib/types'

/**
 * Card principal de "Total em vendas" — visual cyberpunk futurista.
 * Gradiente neon com glow, gráfico integrado, valor em destaque.
 */
export function RevenueCard({
  value,
  change,
  series,
  dateLabel,
  className,
}: {
  value: number
  change?: RangeChange | null
  series: SalesPoint[]
  dateLabel: string
  className?: string
}) {
  const hasData = series.some((p) => p.volume > 0)
  const variationPct = change?.value ?? null
  const trend = change?.trend ?? 'flat'

  return (
    <section
      className={cn(
        'lg:col-span-2 rounded-2xl p-6 glass-panel-glow relative overflow-hidden flex flex-col justify-between min-h-[190px]',
        className,
      )}
    >
      {/* Atmospheric Glow Background */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyber-purple/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute right-1/3 bottom-0 w-48 h-48 bg-cyber-indigo/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-cyber-violet uppercase block mb-1">SALDO DISPONÍVEL</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            Atualizado agora • pronto para sacar
          </span>
        </div>
        <span className="p-2 rounded-xl bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-violet">
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
          </svg>
        </span>
      </div>

      <div className="relative z-10 my-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">{formatCurrency(value)}</span>
          {variationPct !== null && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '·'}{' '}
              {formatPercent(Math.abs(variationPct), 0).replace('%', '')}%
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">{dateLabel}</p>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex items-center gap-3 pt-2">
        <Link
          href="/pix"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyber-purple to-cyber-indigo hover:from-cyber-violet hover:to-cyber-purple text-white text-xs font-medium tracking-wide shadow-neon-sm flex items-center gap-2 transition-all"
        >
          <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
          </svg>
          <span>Pagamento rápido</span>
        </Link>
        <Link
          href="/transacoes"
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-cyber-purple/20 text-slate-200 text-xs font-medium tracking-wide flex items-center gap-2 transition-all"
        >
          <svg className="w-3.5 h-3.5 text-cyber-purple" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
          </svg>
          <span>Ver transações</span>
        </Link>
      </div>
    </section>
  )
}
