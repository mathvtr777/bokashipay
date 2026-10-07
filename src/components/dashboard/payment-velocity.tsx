import { EmptyState } from '@/components/ui/feedback'
import { Activity } from '@/components/ui/icons'

export interface PaymentVelocityPoint {
  hour: string
  seconds: number
}

/**
 * "Velocidade de pagamento" — tempo médio entre gerar e pagar o PIX.
 *
 * Quando há dados, mostra um pequeno sparkline (SVG inline) com a mediana.
 * Quando não há, mostra `EmptyState` com ícone e mensagem amigável.
 */
export function PaymentVelocity({
  series,
  medianSeconds,
  loading,
}: {
  series: PaymentVelocityPoint[]
  medianSeconds: number | null
  loading?: boolean
}) {
  if (!loading && (series.length === 0 || medianSeconds === null)) {
    return (
      <EmptyState
        icon={<Activity className="h-6 w-6" />}
        title="Sem dados ainda"
        description="Quando você tiver pagamentos confirmados, mostraremos quanto tempo leva em média."
      />
    )
  }

  // Sparkline: max 60px, mapeia seconds → altura.
  const max = Math.max(...series.map((p) => p.seconds), 1)
  const points = series
    .map((p, i) => {
      const x = (i / Math.max(series.length - 1, 1)) * 100
      const y = 60 - (p.seconds / max) * 60
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Tempo médio de pagamento
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
          {formatSeconds(medianSeconds ?? 0)}
        </p>
      </div>
      <svg viewBox="0 0 100 60" className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
        <polyline
          fill="none"
          stroke="rgba(139,92,246,0.6)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <polyline
          fill="rgba(139,92,246,0.10)"
          stroke="none"
          points={`0,60 ${points} 100,60`}
        />
      </svg>
    </div>
  )
}

function formatSeconds(s: number): string {
  if (s < 60) return `${Math.round(s)}s`
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  if (m < 60) return `${m}m ${sec.toString().padStart(2, '0')}s`
  const h = Math.floor(m / 60)
  return `${h}h ${(m % 60).toString().padStart(2, '0')}m`
}