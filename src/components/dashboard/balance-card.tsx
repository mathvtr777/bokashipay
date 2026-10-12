'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

/**
 * Card de saldo pendente — visual cyberpunk.
 * Gradiente com acento âmbar para pendências.
 */
export function BalanceCard({
  value,
  pendingBalance,
  className,
}: {
  value: number
  pendingBalance?: number
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-2xl p-6 glass-panel relative overflow-hidden flex flex-col justify-between min-h-[190px]',
        className,
      )}
    >
      {/* Saldo Disponível */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase block mb-1">SALDO DISPONÍVEL</span>
          <span className="text-[10px] text-emerald-400/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            Pronto para saque
          </span>
        </div>
        <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </span>
      </div>

      <div className="my-3">
        <span className="text-3xl font-extrabold font-mono text-white tracking-tight">{formatCurrency(value)}</span>
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-cyber-purple/10">
        <span>Transações</span>
        <span className="font-mono text-cyber-violet font-semibold">Disponível</span>
      </div>

      {/* Saldo Pendente */}
      {pendingBalance !== undefined && pendingBalance > 0 && (
        <div className="mt-4 pt-4 border-t border-cyber-purple/10">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase block mb-1">SALDO PENDENTE</span>
              <span className="text-[10px] text-amber-400/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></span>
                Aguardando liquidação
              </span>
            </div>
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-white tracking-tight">{formatCurrency(pendingBalance)}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Estimativa: em até 2 dias úteis</p>
        </div>
      )}
    </section>
  )
}
