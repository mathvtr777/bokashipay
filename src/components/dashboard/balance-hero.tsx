import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { ArrowDownToLine, Settings } from '@/components/ui/icons'
import Link from 'next/link'

/**
 * Hero de saldo — substitui o antigo BannerCarousel.
 *
 * Visual: card com gradiente roxo profundo, ilustração orgânica no canto
 * direito (radial gradient) e o total disponível em destaque. Dois CTAs:
 * "Sacar" (primário, branco) e "Personalizar" (secundário, transparente).
 *
 * Recebe `availableBalance` e `pendingBalance` — ambos já vêm prontos de
 * `getDashboardMetrics()`. Nenhuma query nova.
 */
export function BalanceHero({
  availableBalance,
  pendingBalance,
  className,
}: {
  availableBalance: number
  pendingBalance: number
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/[0.06] bg-ink-900 px-6 py-7 sm:px-8 sm:py-9',
        className,
      )}
    >
      {/* Ilustração de fundo — radial roxo no canto superior direito. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(700px 360px at 85% 0%, rgba(139,92,246,0.30), transparent 65%), radial-gradient(600px 320px at 10% 100%, rgba(76,29,149,0.35), transparent 60%)',
        }}
      />
      {/* Halo decorativo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(167,139,250,0.6), transparent 70%)' }}
      />

      <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
              Saldo disponível
            </span>
            <span className="rounded-full bg-brand-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
              Atualizado agora · pronto para sacar ou usar
            </span>
          </div>

          <p className="mt-3 text-4xl font-semibold tabular-nums text-white sm:text-5xl">
            {formatCurrency(availableBalance)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Link
              href="/saques"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-sm transition-all duration-200 hover:bg-white/90 active:scale-[0.98]"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Solicitar saque
            </Link>
            <Link
              href="/contas-bancarias"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/[0.08]"
            >
              <Settings className="h-4 w-4" />
              Personalizar
            </Link>
          </div>
        </div>

        {/* Cartão lateral: saldo pendente */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-md md:min-w-[200px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Saldo pendente
          </p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-white">
            {formatCurrency(pendingBalance)}
          </p>
          <p className="mt-1 text-[11px] text-white/40">
            Aguardando confirmação de pagamento
          </p>
        </div>
      </div>
    </section>
  )
}