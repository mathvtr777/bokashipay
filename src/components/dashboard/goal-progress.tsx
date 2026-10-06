import * as React from 'react'
import { formatCurrency } from '@/lib/format'
import type { GoalProgress } from '@/lib/types'

/**
 * Card de meta de faturamento.
 *
 * Estrutura em 3 colunas:
 *   [Faturamento R$ X]   [barra de progresso]   [Sua meta R$ Y]
 *
 * Recebe `goal` do dashboard (vem de `getDashboardMetrics()`) — sem I/O próprio.
 * As labels ("Faturamento" / "Sua meta") vêm do código; os valores vêm de `goal`.
 */
export function GoalProgress({
  goal,
  loading,
}: {
  goal: GoalProgress | null
  loading?: boolean
}) {
  if (loading || !goal) {
    return (
      <div
        role="status"
        aria-label="Carregando meta"
        className="flex h-9 w-52 animate-pulse items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 dark:border-ink-700 dark:bg-ink-900"
      >
        <div className="flex flex-1 flex-col gap-1">
          <div className="h-1.5 w-10 rounded bg-ink-100 dark:bg-ink-800" />
          <div className="h-2 w-14 rounded bg-ink-100 dark:bg-ink-800" />
        </div>
        <div className="h-1 flex-1 rounded-full bg-ink-100 dark:bg-ink-800" />
        <div className="flex flex-1 flex-col items-end gap-1">
          <div className="h-1.5 w-10 rounded bg-ink-100 dark:bg-ink-800" />
          <div className="h-2 w-14 rounded bg-ink-100 dark:bg-ink-800" />
        </div>
      </div>
    )
  }

  const currentLabel = formatCurrency(goal.current)
  const tierLabel = formatCurrency(goal.currentTier)

  return (
    <div
      className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1 dark:border-ink-700 dark:bg-ink-900"
      title={
        goal.isLastTier
          ? `Você ultrapassou ${tierLabel}`
          : `Faltam ${formatCurrency(goal.remaining)} para a meta ${tierLabel}`
      }
    >
      {/* Coluna esquerda: o que já fez */}
      <div className="flex min-w-0 flex-col">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
          Faturamento
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-ink-900 dark:text-white">
          {currentLabel}
        </span>
      </div>

      {/* Centro: barra de progresso */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={goal.percent}
        aria-label={`Progresso da meta: ${goal.percent}%`}
        className="h-1 w-20 shrink-0 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800 sm:w-28"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500 ease-premium"
          style={{ width: `${goal.percent}%` }}
        />
      </div>

      {/* Coluna direita: a meta */}
      <div className="flex min-w-0 flex-col items-end">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
          Sua meta
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-ink-900 dark:text-white">
          {tierLabel}
        </span>
      </div>
    </div>
  )
}