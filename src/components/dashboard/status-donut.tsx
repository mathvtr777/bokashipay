'use client'

import { Donut } from './donut'
import { EmptyState } from '@/components/ui/feedback'
import { cn } from '@/lib/utils'
import { useState } from 'react'

/**
 * Donut "Status dos pedidos" — aprovas vs pendentes, com abas.
 *
 * Dados vazios → `EmptyState` (sem donut). O componente é puramente visual:
 * os números chegam de `getStatusDonut()` (stub por enquanto).
 */
export function StatusDonut({
  approved,
  pending,
  loading,
}: {
  approved: number
  pending: number
  loading?: boolean
}) {
  const [tab, setTab] = useState<'all' | 'approved' | 'pending'>('all')

  const total = approved + pending
  const isEmpty = !loading && total === 0

  if (isEmpty) {
    return (
      <EmptyState
        title="Sem pedidos ainda"
        description="Quando houver vendas, o status aparece aqui."
      />
    )
  }

  // Para a aba selecionada, mostramos ela como "a" no donut e o resto como "b".
  const showA = tab === 'approved' || tab === 'all' ? approved : 0
  const showB = tab === 'pending' || tab === 'all' ? pending : 0

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Tabs */}
      <div className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] p-1">
        {(
          [
            { key: 'all', label: 'Todas', dot: approved + pending },
            { key: 'approved', label: 'Aprovadas', dot: approved },
            { key: 'pending', label: 'Pendentes', dot: pending },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            onClick={() => setTab(option.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
              tab === option.key
                ? 'bg-white/[0.10] text-white'
                : 'text-white/50 hover:text-white',
            )}
          >
            <span>{option.label}</span>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-white/60">
              {option.dot}
            </span>
          </button>
        ))}
      </div>

      <Donut
        a={showA}
        b={showB}
        size={150}
        thickness={16}
        label={total === 0 ? '0' : total}
        caption="TOTAL"
      />
    </div>
  )
}