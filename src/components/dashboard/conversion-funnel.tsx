import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { EmptyState } from '@/components/ui/feedback'
import { ArrowRight } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

/**
 * Funil de conversão em duas etapas: PIX gerados → Pagos.
 *
 * O card mostra uma barra horizontal dividida em duas faixas (gerados/pagos)
 * e um delta de "queda" entre elas, com seta apontando para a próxima etapa.
 * Dados vazios → `EmptyState`.
 */
export function ConversionFunnel({
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
        title="Funil vazio"
        description="Quando você gerar PIX, o funil de conversão aparece aqui."
      />
    )
  }
  const percent = generated === 0 ? 0 : paid / generated
  const generatedAmount = generated
  const paidAmount = paid

  return (
    <div className="space-y-4">
      {/* Etapa 1: PIX gerados */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            PIX gerados
          </span>
          <span className="text-[10px] font-semibold text-white/40">
            {formatNumber(generated)} {generated === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
        <p className="mt-1.5 text-xl font-semibold tabular-nums text-white">
          {formatNumber(generatedAmount)}
        </p>
      </div>

      {/* Seta */}
      <div className="flex items-center gap-2 px-1 text-[10px] uppercase tracking-wider text-white/40">
        <span>↓ {formatPercent(1 - percent, 0)} perdidos</span>
      </div>

      {/* Etapa 2: Pagos */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Pagos
          </span>
          <span className="text-[10px] font-semibold text-brand-300">
            {formatNumber(paid)} {paid === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
        <p className="mt-1.5 text-xl font-semibold tabular-nums text-white">
          {formatNumber(paidAmount)}
        </p>
      </div>

      {/* Barra composta de conversão */}
      <div className="space-y-1.5">
        <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.05]">
          <span
            className="brand-gradient h-full transition-all duration-500"
            style={{ width: `${percent * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>Conversão</span>
          <span className="font-semibold text-white">{formatPercent(percent, 1)}</span>
        </div>
      </div>
    </div>
  )
}