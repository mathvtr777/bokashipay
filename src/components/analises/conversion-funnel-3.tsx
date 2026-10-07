import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { ConversionFunnelSteps } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Funil de 3 etapas: PIX gerado → aguardando pagamento → pago. Cada
 * etapa mostra número absoluto, percent em relação ao total gerado e uma
 * barra horizontal (a primeira sempre 100%, as seguintes caem).
 *
 * No rodapé: dois sub-cards — Taxa de aprovação e Tempo médio até pagar.
 */
export function ConversionFunnel3Steps({ funnel }: { funnel: ConversionFunnelSteps }) {
  const steps = [
    { key: 'generated', label: 'PIX gerado', value: funnel.generated, percent: 1 },
    { key: 'awaiting', label: 'Aguardando pagamento', value: funnel.awaiting, percent: funnel.generated === 0 ? 0 : funnel.awaiting / funnel.generated },
    { key: 'paid', label: 'Pagos', value: funnel.paid, percent: funnel.generated === 0 ? 0 : funnel.paid / funnel.generated },
  ]

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Etapas do funil</CardTitle>
          <CardDescription>Os 3 estágios do PIX até o pagamento confirmado</CardDescription>
        </div>
      </CardHeader>

      <div className="px-5 pb-5 pt-3 space-y-4">
        {steps.map((s) => (
          <div key={s.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-white/70">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                    s.key === 'paid' ? 'bg-brand-500/20 text-brand-300' : 'bg-white/[0.06] text-white/60',
                  )}
                >
                  {steps.indexOf(s) + 1}
                </span>
                {s.label}
              </span>
              <span className="text-white/50 tabular-nums">
                <span className="text-white/90 font-semibold mr-1.5">R$ 0,00</span>
                ({formatPercent(s.percent, 1)})
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="brand-gradient h-full rounded-full transition-all duration-500 ease-premium"
                style={{ width: `${Math.max(2, s.percent * 100)}%` }}
              />
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/[0.06] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Taxa de aprovação
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-white">
              {formatPercent(funnel.approvalRate, 1)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Tempo médio até pagar
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-white">
              {funnel.medianSecondsToPay === null ? '—' : formatSeconds(funnel.medianSecondsToPay)}
            </p>
          </div>
        </div>
      </div>
    </Card>
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