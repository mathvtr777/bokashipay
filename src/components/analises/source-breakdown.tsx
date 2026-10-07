import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/feedback'
import { formatCurrency, formatNumber } from '@/lib/format'
import { Bot, Globe, Code2, Layers } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { SourceBreakdown, SourceBreakdownItem } from '@/lib/types'

/**
 * Card "Bot Telegram + Checkout direto" — combina as duas fontes mais
 * importantes. O breakdown vem derivado de `transactions.description` por
 * enquanto (sem campo `source` dedicado).
 */
export function SourceBreakdownCard({
  breakdown,
}: {
  breakdown: SourceBreakdown
  paymentMethods?: { method: string; count: number; amount: number }[]
}) {
  const total = breakdown.items.reduce((s, i) => s + i.count, 0)

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-brand-300">
              <Bot className="h-3.5 w-3.5" />
            </span>
            <div>
              <CardTitle>Bot Telegram + Checkout direto</CardTitle>
              <CardDescription>Origem das vendas no período</CardDescription>
            </div>
          </div>
        </CardHeader>
        <EmptyState
          title="Sem vendas pagas no período."
          description="Quando houver vendas com origem identificada, o breakdown aparece aqui."
        />
      </Card>
    )
  }

  // Ordena por contagem decrescente.
  const sorted = [...breakdown.items].sort((a, b) => b.count - a.count)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-brand-300">
            <Bot className="h-3.5 w-3.5" />
          </span>
          <div>
            <CardTitle>Bot Telegram + Checkout direto</CardTitle>
            <CardDescription>Origem das vendas no período</CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="px-5 pb-5 pt-3 space-y-3">
        {sorted.map((item) => (
          <SourceRow key={item.key} item={item} max={Math.max(1, sorted[0].count)} />
        ))}
      </div>
    </Card>
  )
}

function SourceRow({ item, max }: { item: SourceBreakdownItem; max: number }) {
  const Icon = ICON_BY_KEY[item.key]
  const percent = max === 0 ? 0 : item.count / max
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{item.label}</p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="brand-gradient h-full rounded-full transition-all duration-500 ease-premium"
            style={{ width: `${percent * 100}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-white">
          {formatNumber(item.count)}
        </p>
        <p className="text-xs tabular-nums text-white/40">
          {formatCurrency(item.amount)}
        </p>
      </div>
    </div>
  )
}

const ICON_BY_KEY: Record<SourceBreakdownItem['key'], (p: { className?: string }) => React.ReactElement> = {
  telegram_bot: Bot,
  checkout_direct: Globe,
  api: Code2,
  other: Layers,
}