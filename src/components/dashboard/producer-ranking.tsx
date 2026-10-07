import { formatCurrency, formatNumber } from '@/lib/format'
import { EmptyState } from '@/components/ui/feedback'
import * as Icons from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface Producer {
  id: string
  name: string
  count: number
  amount: number
}

/**
 * Ranking dos produtores que mais venderam no período.
 *
 * Lista numerada com avatar (placeholder cinza), nome mascarado (@***…pay),
 * contagem de vendas e valor total. Os dados chegam de
 * `getProducerRanking()` (stub por enquanto).
 */
export function ProducerRanking({
  producers,
  live = false,
}: {
  producers: Producer[]
  live?: boolean
}) {
  if (producers.length === 0) {
    return (
      <EmptyState
        title="Sem ranking ainda"
        description="Quando houver vendas com produtores identificados, o top 5 aparece aqui."
      />
    )
  }

  return (
    <ul className="space-y-2.5">
      {producers.map((producer, index) => {
        const rank = index + 1
        return (
          <li
            key={producer.id}
            className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                rank === 1 && 'bg-white text-ink-950',
                rank === 2 && 'bg-white/80 text-ink-950',
                rank === 3 && 'bg-white/60 text-ink-950',
                rank > 3 && 'bg-white/[0.06] text-white/60',
              )}
            >
              {rank}
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/40 to-brand-700/40 text-[10px] font-semibold text-white">
              {maskName(producer.name).slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {maskName(producer.name)}
              </p>
              <p className="text-[11px] text-white/40">
                {formatNumber(producer.count)} {producer.count === 1 ? 'venda' : 'vendas'}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
              {formatCurrency(producer.amount)}
            </span>
          </li>
        )
      })}
      {live && (
        <li className="flex items-center justify-end gap-1.5 pt-1 text-[10px] uppercase tracking-wider text-brand-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
          Ao vivo
        </li>
      )}
    </ul>
  )
}

/**
 * Mascaramento no estilo @user***…sufixo — preserva o início (3 chars) e o
 * final (3 chars), preenchendo o meio com asteriscos. Usado para "anonimizar"
 * o nome do produtor sem perder a identidade visual.
 */
function maskName(name: string): string {
  if (name.length <= 6) return name
  return `${name.slice(0, 3)}***${name.slice(-3)}`
}