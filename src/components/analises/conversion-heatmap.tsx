import { cn } from '@/lib/utils'
import type { ConversionHeatmap } from '@/lib/types'

/**
 * Heatmap "Quando seus clientes compram": grade 7 dias × 4 faixas
 * horárias (manhã, manhã, tarde, noite). Cada célula tem intensidade
 * proporcional ao valor máximo do período. Cor única roxa (paleta restrita).
 */
export function ConversionHeatmap({ heatmap }: { heatmap: ConversionHeatmap }) {
  const cells = new Map<string, number>()
  for (const c of heatmap.cells) cells.set(`${c.weekday}-${c.bucket}`, c.count)
  const max = heatmap.max
  const total = heatmap.cells.reduce((s, c) => s + c.count, 0)

  return (
    <div className="px-5 pb-5 pt-2">
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-10" />
            {[0, 1, 2, 3].map((b) => (
              <th
                key={b}
                className="px-1.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40"
              >
                {LABELS_BUCKET[b]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
            <tr key={wd}>
              <td className="py-1 pr-2 text-[11px] font-medium text-white/50">
                {LABELS_WEEKDAY[wd]}
              </td>
              {[0, 1, 2, 3].map((b) => {
                const count = cells.get(`${wd}-${b}`) ?? 0
                const intensity = max === 0 ? 0 : count / max
                return (
                  <td key={b} className="py-1 px-1.5">
                    <div
                      className={cn(
                        'h-7 rounded-md transition-colors',
                        intensity === 0
                          ? 'bg-white/[0.04]'
                          : 'bg-brand-500/15',
                      )}
                      style={
                        intensity > 0
                          ? {
                              backgroundColor: `rgba(139, 92, 246, ${0.18 + intensity * 0.55})`,
                            }
                          : undefined
                      }
                      title={`${count} venda${count === 1 ? '' : 's'}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[10px] text-white/40">
        {total === 0
          ? 'Vendas pagas distribuídas por dia da semana e faixa horária.'
          : `Vendas pagas distribuídas por dia da semana e faixa horária (${total} no total).`}
      </p>
    </div>
  )
}

const LABELS_WEEKDAY: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
}

const LABELS_BUCKET: Record<number, string> = {
  0: 'Madrugada',
  1: 'Manhã',
  2: 'Tarde',
  3: 'Noite',
}