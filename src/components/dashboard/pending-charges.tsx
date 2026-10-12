'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronRight, FileText } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { formatCurrency, formatRelative, shortId } from '@/lib/format'
import type { Transaction } from '@/lib/types'

/**
 * Card de "Cobranças em aberto" — lista compacta de transações pendentes.
 *
 * Cada item: ícone, identificador (#XXXXXXX), valor, data, seta para detalhes.
 * Quando vazio: empty state elegante.
 */
export function PendingCharges({
  transactions,
  loading,
  className,
}: {
  transactions: Transaction[]
  loading?: boolean
  className?: string
}) {
  if (loading) {
    return (
      <div className={cn('flex flex-col gap-2.5', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
        <div className="brand-glow mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-status-success/10 text-status-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white">Nenhuma cobrança em aberto</h3>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/50">
          Suas cobranças pendentes aparecem aqui. Tudo em dia.
        </p>
      </div>
    )
  }

  return (
    <ul className={cn('flex flex-col gap-2', className)}>
      {transactions.slice(0, 6).map((transaction) => {
        const body = (
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.10] hover:bg-white/[0.04]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-white/50">#{shortId(transaction.id)}</span>
                <span className="text-sm font-semibold tabular-nums text-white">
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: '#F5B942' }}
                />
                Pendente · {formatRelative(transaction.created_at)}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
          </div>
        )

        return (
          <li key={transaction.id}>
            <Link href={`/vendas?id=${transaction.id}`} className="block">
              {body}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
