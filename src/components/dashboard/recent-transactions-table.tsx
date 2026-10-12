'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCurrency, formatRelative, shortId } from '@/lib/format'
import type { Transaction } from '@/lib/types'

/**
 * Tabela cyberpunk de "Últimas transações".
 */
export function RecentTransactionsTable({
  transactions,
  onSelect,
  className,
}: {
  transactions: (Transaction & { customer?: { name: string } | null })[]
  onSelect?: (transaction: Transaction) => void
  className?: string
}) {
  if (transactions.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyber-purple/10 border border-cyber-purple/20">
          <svg className="h-6 w-6 text-cyber-violet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <path d="M12 18V6" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Nenhuma transação ainda</p>
        <p className="mt-1.5 max-w-xs text-sm text-slate-400">
          Quando houver cobranças pagas, elas aparecem aqui automaticamente.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[10px] font-mono text-slate-500 border-b border-cyber-purple/10 uppercase tracking-wider">
            <th className="pb-2.5 font-medium px-4">ID</th>
            <th className="pb-2.5 font-medium px-4">Cliente</th>
            <th className="pb-2.5 font-medium px-4 text-right">Valor</th>
            <th className="pb-2.5 font-medium px-4">Status</th>
            <th className="pb-2.5 font-medium px-4">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cyber-purple/10">
          {transactions.map((transaction) => {
            return (
              <tr
                key={transaction.id}
                onClick={onSelect ? () => onSelect(transaction) : undefined}
                className={cn(
                  'transition hover:bg-white/[0.03] cursor-pointer',
                  onSelect && 'cursor-pointer'
                )}
              >
                <td className="font-mono text-xs text-slate-400 px-4 py-3">
                  #{shortId(transaction.id)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyber-purple/20 text-[10px] font-bold text-cyber-violet border border-cyber-purple/30">
                      {(transaction.customer?.name ?? transaction.payer_name ?? '??')
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join('')
                        .toUpperCase() || 'BP'}
                    </span>
                    <span className="block max-w-[180px] truncate text-sm font-medium text-slate-200">
                      {transaction.customer?.name ?? transaction.payer_name ?? 'Não informado'}
                    </span>
                  </div>
                </td>
                <td className="text-right font-semibold tabular-nums text-white px-4 py-3">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3">
                  <SemanticStatusBadge status={transaction.status} />
                </td>
                <td className="whitespace-nowrap text-slate-400 px-4 py-3 text-xs">
                  {formatRelative(transaction.created_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SemanticStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: 'success' | 'pending' | 'error' | 'neutral' }> = {
    approved: { label: 'Aprovada', tone: 'success' },
    paid: { label: 'Pago', tone: 'success' },
    pending: { label: 'Pendente', tone: 'pending' },
    canceled: { label: 'Cancelada', tone: 'neutral' },
    cancelled: { label: 'Cancelada', tone: 'neutral' },
    refunded: { label: 'Estornada', tone: 'neutral' },
    rejected: { label: 'Recusada', tone: 'error' },
    failed: { label: 'Falhou', tone: 'error' },
  }

  const meta = map[status] ?? { label: status, tone: 'neutral' as const }

  const toneClass: Record<typeof meta.tone, string> = {
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    error: 'bg-red-500/15 text-red-400 border border-red-500/20',
    neutral: 'bg-white/[0.06] text-slate-400 border border-white/10',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold font-mono',
        toneClass[meta.tone],
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background:
            meta.tone === 'success'
              ? '#34d399'
              : meta.tone === 'pending'
                ? '#fbbf24'
                : meta.tone === 'error'
                  ? '#f87171'
                  : 'rgba(255,255,255,0.4)',
          boxShadow:
            meta.tone === 'success'
              ? '0 0 6px #34d399'
              : meta.tone === 'pending'
                ? '0 0 6px #fbbf24'
                : 'none',
        }}
      />
      {meta.label}
    </span>
  )
}
