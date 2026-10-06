import { formatCurrency } from '@/lib/format'
import type { DashboardMetrics } from '@/lib/types'
import * as Icons from '@/components/ui/icons'

/** Resumo financeiro: os cinco números que definem a saúde da conta. */
export function FinanceSummary({ metrics }: { metrics: DashboardMetrics }) {
  const items = [
    { label: 'Saldo disponível', value: metrics.availableBalance, icon: Icons.Wallet, tone: 'brand' },
    { label: 'Saldo pendente', value: metrics.pendingBalance, icon: Icons.Clock, tone: 'warning' },
    { label: 'Total recebido', value: metrics.totalReceived, icon: Icons.TrendUp, tone: 'positive' },
    { label: 'Total em taxas', value: metrics.totalFees, icon: Icons.Finance, tone: 'negative' },
    { label: 'Total sacado', value: metrics.totalWithdrawn, icon: Icons.Crypto, tone: 'neutral' },
  ] as const

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
      {items.map((item) => {
        const IconComponent = item.icon
        return (
          <div key={item.label} className="surface p-5">
            <div className="flex items-center gap-2.5">
              <span
                className={
                  item.tone === 'brand'
                    ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                    : item.tone === 'positive'
                      ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : item.tone === 'warning'
                        ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        : item.tone === 'negative'
                          ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                          : 'flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
                }
              >
                <IconComponent className="h-4 w-4" />
              </span>
              <p className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                {item.label}
              </p>
            </div>
            <p className="mt-3 text-xl font-semibold tracking-tight text-ink-900 dark:text-white">
              {formatCurrency(item.value)}
            </p>
          </div>
        )
      })}
    </div>
  )
}