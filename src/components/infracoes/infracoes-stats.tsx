import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * 4 stat cards da página de Infrações:
 *   - INFRAÇÕES (total) — branco
 *   - EM ANÁLISE (contagem) — âmbar
 *   - VALOR EM DISPUTA (R$) — vermelho destrutivo
 *   - DEFENDIDAS (contagem) — verde (exceção semântica: "defendido =
 *     sucesso", único verde que mantemos aqui)
 */
export function InfracoesStatsCard({
  total,
  analyzing,
  inDispute,
  defended,
}: {
  total: number
  analyzing: number
  inDispute: number
  defended: number
}) {
  const cards = [
    { label: 'Infrações', value: formatNumber(total), tone: 'neutral' as const },
    { label: 'Em análise', value: formatNumber(analyzing), tone: 'warning' as const },
    { label: 'Valor em disputa', value: formatCurrency(inDispute), tone: 'danger' as const },
    { label: 'Defendidas', value: formatNumber(defended), tone: 'success' as const },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="surface p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {c.label}
          </p>
          <p
            className={cn(
              'mt-3 text-2xl font-semibold tabular-nums',
              c.tone === 'warning' && 'text-amber-400',
              c.tone === 'danger' && 'text-red-400',
              c.tone === 'success' && 'text-emerald-400',
              c.tone === 'neutral' && 'text-white',
            )}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  )
}