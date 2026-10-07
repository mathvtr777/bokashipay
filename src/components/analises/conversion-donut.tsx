import { formatNumber, formatPercent } from '@/lib/format'
import { Donut } from '@/components/dashboard/donut'

/**
 * Donut "Conversão geral" — anel simples + legenda de "De X gerados, Y foram
 * pagos" no rodapé. Usa o `Donut` genérico (SVG puro, sem lib).
 */
export function ConversionDonut({
  percent,
  generated,
  paid,
}: {
  percent: number
  generated: number
  paid: number
}) {
  const isEmpty = generated === 0
  return (
    <div className="flex flex-col items-center gap-4 px-5 pb-6 pt-2">
      <Donut
        a={paid}
        b={Math.max(0, generated - paid)}
        size={160}
        thickness={16}
        label={isEmpty ? '0,0%' : formatPercent(percent, 1)}
        caption="PAGARAM"
      />
      <p className="text-center text-xs text-white/50">
        {isEmpty
          ? 'Ainda não há vendas para calcular.'
          : `De ${formatNumber(generated)} PIX gerados, ${formatNumber(paid)} foram pagos.`}
      </p>
    </div>
  )
}