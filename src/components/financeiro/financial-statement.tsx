'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { FinancialEntry, SalesPoint } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { EmptyState } from '@/components/ui/feedback'
import { ChevronLeft, ChevronRight, Inbox } from '@/components/ui/icons'

const TYPE_LABELS: Record<string, string> = {
  income: 'Entrada',
  expense: 'Saída',
  fee: 'Taxa',
  refund: 'Estorno',
  withdrawal: 'Saque',
}

/** Sinal na coluna de valor: entradas somam, saídas subtraem. */
function isNegative(type: string) {
  return type === 'expense' || type === 'fee' || type === 'refund' || type === 'withdrawal'
}

export function FinancialStatement({
  entries,
  total,
  totalPages,
  page,
  series,
}: {
  entries: FinancialEntry[]
  total: number
  totalPages: number
  page: number
  series: SalesPoint[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const type = searchParams.get('tipo') ?? 'all'

  const update = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== 'all') params.set(key, value)
      else params.delete(key)
    }
    params.delete('pagina')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pagina', String(next))
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="xl:col-span-2">
        <SalesChart data={series} />
      </div>

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-ink-100 p-5 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">
              Extrato
            </h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Todas as movimentações da conta
            </p>
          </div>

          <Select
            value={type}
            onChange={(e) => update({ tipo: e.target.value })}
            options={[
              { value: 'all', label: 'Todos os tipos' },
              { value: 'income', label: 'Entrada' },
              { value: 'expense', label: 'Saída' },
              { value: 'fee', label: 'Taxa' },
              { value: 'refund', label: 'Estorno' },
              { value: 'withdrawal', label: 'Saque' },
            ]}
            className="w-full sm:w-[184px]"
            aria-label="Filtrar por tipo"
          />
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={<Inbox />}
            title="Sem movimentações no período"
            description="Assim que houver vendas processadas ou saques solicitados, o extrato aparece aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th className="text-right">Valor</th>
                  <th className="text-right">Saldo após</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const negative = isNegative(entry.type)
                  return (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap text-ink-500 dark:text-ink-400">
                        {formatDateTime(entry.created_at)}
                      </td>
                      <td className="max-w-[280px]">
                        <span className="block truncate font-medium text-ink-900 dark:text-ink-50">
                          {entry.description}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                            negative
                              ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
                          )}
                        >
                          {TYPE_LABELS[entry.type] ?? entry.type}
                        </span>
                      </td>
                      <td
                        className={cn(
                          'text-right font-semibold tabular-nums',
                          negative
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {negative ? '− ' : '+ '}
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="text-right font-medium tabular-nums text-ink-900 dark:text-ink-50">
                        {formatCurrency(entry.balance_after)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-ink-100 px-5 py-4 dark:border-ink-800">
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Página {page} de {totalPages} · {total} movimentações
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}