'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Gráfico de status das cobranças — visual cyberpunk futurista.
 * Donut com neon glow e gradientes vibrantes.
 */
export function ChargeStatusChart({
  approved,
  pending,
  rejected = 0,
  loading,
  className,
}: {
  approved: number
  pending: number
  rejected?: number
  loading?: boolean
  className?: string
}) {
  const [tab, setTab] = React.useState<'all' | 'approved' | 'pending' | 'rejected'>('all')

  const total = approved + pending + rejected
  const isEmpty = !loading && total === 0

  if (isEmpty) {
    return (
      <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyber-purple/10 border border-cyber-purple/20">
          <svg className="h-6 w-6 text-cyber-violet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white">Sem cobranças ainda</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-400">
          Quando houver cobranças, o status aparece aqui.
        </p>
      </div>
    )
  }

  // Cálculos para o donut
  const ratios = {
    approved: total === 0 ? 0 : approved / total,
    pending: total === 0 ? 0 : pending / total,
    rejected: total === 0 ? 0 : rejected / total,
  }

  const showApproved = tab === 'all' || tab === 'approved'
  const showPending = tab === 'all' || tab === 'pending'
  const showRejected = tab === 'all' || tab === 'rejected'

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">Status dos pedidos</h3>
          <p className="text-[11px] text-slate-400">Aprovados vs pendentes</p>
        </div>

        {/* Mini Status Filter Tabs */}
        <div className="flex justify-center my-2">
          <div className="inline-flex p-1 bg-surface-elevated/60 rounded-lg border border-cyber-purple/20 text-[10px] font-mono">
            <button className="px-2.5 py-0.5 rounded bg-cyber-purple/30 text-cyber-violet font-semibold">Todos {total}</button>
            <button className="px-2.5 py-0.5 text-slate-400 hover:text-white">Aprov {approved}</button>
            <button className="px-2.5 py-0.5 text-slate-400 hover:text-white">Pend {pending}</button>
          </div>
        </div>
      </div>

      {/* Donut Visual */}
      <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track Circle */}
          <circle cx="50" cy="50" fill="transparent" r="38" stroke="rgba(147, 51, 234, 0.15)" strokeWidth="10"></circle>

          {/* Approved Segment */}
          {approved > 0 && (
            <circle
              cx="50" cy="50"
              fill="transparent" r="38"
              stroke="#c084fc"
              strokeDasharray="238.76"
              strokeDashoffset={238.76 - (approved / total) * 238.76}
              strokeLinecap="round"
              strokeWidth="11"
              className="drop-shadow-[0_0_8px_#a855f7]"
            />
          )}

          {/* Pending Segment */}
          {pending > 0 && (
            <circle
              cx="50" cy="50"
              fill="transparent" r="38"
              stroke="#6366f1"
              strokeDasharray="238.76"
              strokeDashoffset={238.76 - ((approved + pending) / total) * 238.76}
              strokeLinecap="round"
              strokeWidth="10"
            />
          )}
        </svg>

        {/* Central Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black font-mono text-white">{total}</span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">TOTAL</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyber-purple/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-neon shadow-[0_0_6px_#c084fc]"></span>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">Aprovados</span>
            <span className="font-mono font-semibold text-white text-[11px]">{approved} ({((approved / total) * 100).toFixed(1)}%)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-indigo"></span>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">Pendentes</span>
            <span className="font-mono font-semibold text-white text-[11px]">{pending} ({((pending / total) * 100).toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
