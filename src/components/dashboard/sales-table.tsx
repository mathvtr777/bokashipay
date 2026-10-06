'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatRelative, shortId } from '@/lib/format'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/feedback'
import { Sales, ChevronRight } from '@/components/ui/icons'
import type { Transaction } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Tabela de vendas com coluna de ações.
 *
 * Compartilhada entre o dashboard (colunas reduzidas) e /vendas (completa),
 * para que a mesma linha tenha a mesma aparência nos dois lugares.
 */
export function SalesTable({
  transactions,
  onSelect,
  compact = false,
  showCustomer = true,
  showFee = false,
}: {
  transactions: (Transaction & { customer?: { name: string } | null })[]
  onSelect?: (transaction: Transaction) => void
  compact?: boolean
  showCustomer?: boolean
  showFee?: boolean
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Sales />}
        title="Você ainda não possui vendas."
        description="Assim que houver cobranças pagas, elas aparecem aqui automaticamente."
        action={
          <Link href="/pix">
            <Button>
              <span>Gerar seu primeiro PIX</span>
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            {showCustomer && <th>Cliente</th>}
            <th>Valor</th>
            {showFee && <th>Taxa</th>}
            <th>Método</th>
            <th>Status</th>
            {!compact && <th>Data</th>}
            <th className="w-12" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const row = (
              <>
                <td className="font-mono text-xs text-ink-500 dark:text-ink-400">
                  {shortId(transaction.id)}
                </td>

                {showCustomer && (
                  <td>
                    <span className="block max-w-[180px] truncate font-medium text-ink-900 dark:text-ink-50">
                      {transaction.customer?.name ?? transaction.payer_name ?? 'Não informado'}
                    </span>
                  </td>
                )}

                <td className="font-semibold tabular-nums text-ink-900 dark:text-ink-50">
                  {formatCurrency(transaction.amount)}
                </td>

                {showFee && (
                  <td className="tabular-nums text-ink-500 dark:text-ink-400">
                    {formatCurrency(transaction.fee)}
                  </td>
                )}

                <td>
                  <MethodPill method={transaction.method} />
                </td>

                <td>
                  <StatusBadge status={transaction.status} />
                </td>

                {!compact && (
                  <td className="whitespace-nowrap text-ink-500 dark:text-ink-400">
                    {formatRelative(transaction.created_at)}
                  </td>
                )}

                {onSelect && (
                  <td>
                    <ChevronRight className="h-4 w-4 text-ink-300 dark:text-ink-600" />
                  </td>
                )}
              </>
            )

            return (
              <tr
                key={transaction.id}
                onClick={onSelect ? () => onSelect(transaction) : undefined}
                className={cn(onSelect && 'cursor-pointer')}
              >
                {row}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const METHOD_LABELS: Record<string, string> = { pix: 'PIX', card: 'Cartão', boleto: 'Boleto' }

export function MethodPill({ method }: { method: string }) {
  return (
    <Badge tone={method === 'pix' ? 'brand' : method === 'card' ? 'info' : 'neutral'}>
      {METHOD_LABELS[method] ?? method}
    </Badge>
  )
}

/** Produtos/serviços com maior volume no período. */
export function TopProducts({
  products,
}: {
  products: { name: string; count: number; amount: number }[]
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Sem produtos registrados"
        description="Assim que houver vendas com descrição, o ranking aparece aqui."
      />
    )
  }

  const max = Math.max(...products.map((p) => p.amount), 1)

  return (
    <div className="surface p-5">
      <h2 className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">
        Mais vendidos
      </h2>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Por volume no período</p>

      <ul className="mt-5 space-y-4">
        {products.map((product, index) => (
          <li key={product.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-ink-400">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">
                  {product.name}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900 dark:text-white">
                {formatCurrency(product.amount)}
              </span>
            </div>

            <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div
                className="brand-gradient h-full rounded-full transition-all duration-500 ease-premium"
                style={{ width: `${(product.amount / max) * 100}%` }}
              />
            </div>
            <p className="ml-6 mt-1 text-xs text-ink-500 dark:text-ink-400">
              {product.count} {product.count === 1 ? 'venda' : 'vendas'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}