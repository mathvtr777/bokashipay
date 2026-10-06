import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import type { PaymentMethodStat } from '@/lib/types'
import * as Icons from '@/components/ui/icons'

const METHOD_META = {
  pix: { icon: Icons.Pix, color: 'bg-brand-500', text: 'text-brand-600 dark:text-brand-400' },
  card: { icon: Icons.Card, color: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
  boleto: { icon: Icons.Barcode, color: 'bg-ink-400', text: 'text-ink-600 dark:text-ink-400' },
} as const

/**
 * Distribuição por método de pagamento.
 *
 * A barra de cada método é relativa ao total de vendas: mostra a composição, e
 * não uma escala absoluta — que num dashboard seria enganosa.
 */
export function PaymentMethods({ stats }: { stats: PaymentMethodStat[] }) {
  const total = stats.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="surface p-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">
          Métodos de pagamento
        </h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {total === 0
            ? 'Nenhuma venda registrada ainda'
            : `${formatNumber(total)} ${total === 1 ? 'venda' : 'vendas'} no total`}
        </p>
      </div>

      {/* Barra composta — sempre visível, mesmo zerada. */}
      <div className="mb-5 flex h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        {stats
          .filter((stat) => stat.percentage > 0)
          .map((stat) => {
            const meta = METHOD_META[stat.method as keyof typeof METHOD_META]
            return (
              <span
                key={stat.method}
                className={cn('h-full transition-all duration-500', meta?.color)}
                style={{ width: `${stat.percentage}%` }}
              />
            )
          })}
      </div>

      <ul className="space-y-4">
        {stats.map((stat) => {
          const meta = METHOD_META[stat.method as keyof typeof METHOD_META] ?? {
            icon: Icons.Card,
            color: 'bg-ink-400',
            text: 'text-ink-600',
          }
          const IconComponent = meta.icon

          return (
            <li key={stat.method}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-800',
                      meta.text,
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                      {stat.label}
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      {formatNumber(stat.count)} {stat.count === 1 ? 'venda' : 'vendas'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-ink-900 dark:text-ink-50">
                    {formatCurrency(stat.amount)}
                  </p>
                  <p className="text-xs tabular-nums text-ink-500 dark:text-ink-400">
                    {formatPercent(stat.percentage, 1)}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}