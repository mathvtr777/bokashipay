import { Donut } from './donut'
import { EmptyState } from '@/components/ui/feedback'
import { formatNumber, formatPercent } from '@/lib/format'

/**
 * Donut de "Conversão de PIX" — % no centro, "PAGARAM O PIX" como legenda.
 *
 * Os dados chegam de `getPixConversion()` (stub). Enquanto não há dados,
 * `EmptyState` ocupa o card com mensagem clara.
 */
export function PixConversion({
  generated,
  paid,
  loading,
}: {
  generated: number
  paid: number
  loading?: boolean
}) {
  if (!loading && generated === 0) {
    return (
      <EmptyState
        title="Sem PIX gerados"
        description="Quando você gerar cobranças, a conversão aparece aqui."
      />
    )
  }
  const percent = generated === 0 ? 0 : paid / generated
  return (
    <div className="flex flex-col items-center gap-3">
      <Donut
        a={paid}
        b={generated - paid}
        size={130}
        thickness={14}
        label={formatPercent(percent, 1)}
        caption="PAGARAM O PIX"
      />
      <div className="grid w-full grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Gerados</p>
          <p className="text-sm font-semibold tabular-nums text-white">{formatNumber(generated)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Pagos</p>
          <p className="text-sm font-semibold tabular-nums text-white">{formatNumber(paid)}</p>
        </div>
      </div>
    </div>
  )
}