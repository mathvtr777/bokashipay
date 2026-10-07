import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TrendUp, Cart, Clock, Gift } from '@/components/ui/icons'

/**
 * 4 stat cards da página de Transações (referência):
 *   - Total Recebido (verde, trend-up)
 *   - Vendas Pagas (verde, cart)
 *   - Pendentes (âmbar, clock)
 *   - Indicações (verde, gift)
 * Ícones sempre em `bg-brand-500/15 text-brand-300` — paleta única roxa.
 */
export function TransactionsStats({
  totalReceived,
  paidSales,
  paidAmount,
  ticket,
  pendingAmount,
  pendingCount,
  indicationsAmount,
  indicationsCount,
}: {
  totalReceived: number
  paidSales: number
  paidAmount: number
  ticket: number
  pendingAmount: number
  pendingCount: number
  indicationsAmount: number
  indicationsCount: number
}) {
  const cards = [
    {
      label: 'Total recebido',
      value: formatCurrency(totalReceived),
      hint: `${formatNumber(paidSales)} ${paidSales === 1 ? 'paga' : 'pagas'}`,
      icon: TrendUp,
    },
    {
      label: 'Vendas pagas',
      value: formatCurrency(paidAmount),
      hint: `${formatNumber(paidSales)} ${paidSales === 1 ? 'pedido' : 'pedidos'} · ticket ${formatCurrency(ticket)}`,
      icon: Cart,
    },
    {
      label: 'Pendentes',
      value: formatCurrency(pendingAmount),
      hint: `${formatNumber(pendingCount)} ${pendingCount === 1 ? 'pendente' : 'pendentes'}`,
      icon: Clock,
    },
    {
      label: 'Indicações',
      value: formatCurrency(indicationsAmount),
      hint: `bônus por indicação${indicationsCount > 0 ? ` · ${formatNumber(indicationsCount)} venda${indicationsCount === 1 ? '' : 's'}` : ''}`,
      icon: Gift,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.label} className={cn('surface p-5')}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {c.label}
              </p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                <Icon className="h-[18px] w-[18px]" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums text-white">
              {c.value}
            </p>
            <p className="mt-1.5 text-xs text-white/50">{c.hint}</p>
          </div>
        )
      })}
    </div>
  )
}