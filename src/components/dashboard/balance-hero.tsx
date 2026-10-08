'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { Zap, Settings } from '@/components/ui/icons'
import Link from 'next/link'
import { QuickPaymentModal } from './quick-payment-modal'

/**
 * Hero de saldo — visual da referência adaptado para a paleta roxa.
 * O botão primário é "Pagamento rápido" — abre um modal que gera
 * cobrança PIX (QR Code + código copia-e-cola) na hora.
 */
export function BalanceHero({
  availableBalance,
  pixKey,
  providerConfigured,
  className,
}: {
  availableBalance: number
  pixKey: string | null
  providerConfigured: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/[0.06] bg-ink-900 px-6 py-7 sm:px-8 sm:py-9',
        className,
      )}
    >
      {/* Ilustração de fundo — gradiente roxo + halo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(700px 360px at 90% 0%, rgba(139,92,246,0.28), transparent 65%), radial-gradient(600px 320px at 0% 100%, rgba(76,29,149,0.30), transparent 60%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(167,139,250,0.55), transparent 70%)' }}
      />

      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
          Saldo disponível
        </p>
        <p className="mt-1.5 text-xs text-white/40">
          Atualizado agora · pronto para sacar ou usar
        </p>

        <p className="mt-4 text-5xl font-semibold tracking-tight tabular-nums text-white sm:text-6xl">
          {formatCurrency(availableBalance)}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {pixKey ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              <Zap className="h-[18px] w-[18px]" />
              Pagamento rápido
            </button>
          ) : (
            <Link
              href="/contas-bancarias"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/[0.10] px-5 py-3 text-sm font-semibold text-amber-200 transition-all duration-200 hover:bg-amber-500/[0.18]"
              title="Cadastre uma conta com chave PIX para gerar cobranças"
            >
              <Zap className="h-[18px] w-[18px]" />
              Cadastrar chave PIX para cobrar
            </Link>
          )}
          <Link
            href="/contas-bancarias"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/[0.10] hover:border-white/25"
          >
            <Settings className="h-[18px] w-[18px]" />
            Personalizar
          </Link>
        </div>
        {providerConfigured === false && (
          <p className="mt-3 text-xs text-amber-300/80">
            Provedor PIX (Pushin Pay) ainda não está conectado — a cobrança só vai gerar
            QR Code após você configurar o <code className="font-mono">PUSHINPAY_API_TOKEN</code>.
          </p>
        )}
      </div>

      <QuickPaymentModal
        open={open}
        onClose={() => setOpen(false)}
        pixKey={pixKey}
        providerConfigured={providerConfigured}
      />
    </section>
  )
}

/**
 * Card lateral de "Saldo pendente" — exibido ao lado do hero de saldo.
 * Mantém o valor e a legenda curta sem roubar espaço do hero principal.
 */
export function PendingBalanceCard({ value }: { value: number }) {
  return (
    <div className="surface flex h-full flex-col justify-between p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Saldo pendente
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-white">
          {formatCurrency(value)}
        </p>
      </div>
      <p className="mt-4 text-xs text-white/40">
        Aguardando confirmação de pagamento
      </p>
    </div>
  )
}