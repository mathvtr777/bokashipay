'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatPercent } from '@/lib/format'
import { Bank, Search, Zap, Check, ArrowRight } from '@/components/ui/icons'

/**
 * Adquirente — provedor de pagamento que processa as transações.
 *
 * Estrutura visual: número, nome fantasia, banco, barra de conversão 24h,
 * percent e botão à direita. O item canônico (activeId) recebe destaque e o
 * botão vira "Principal em uso" (não clicável); os outros mostram "Usar
 * esta →" que dispara um toast.
 */
export interface Acquirer {
  id: string
  name: string
  bank: string
  conversion: number // 0..1
}

/** Mock estático. Quando a feature for ligada, substituir por query. */
const MOCK_ACQUIRERS: Acquirer[] = [
  { id: 'nexo', name: 'NEXO_INTERMEDIACOES_LTDA', bank: 'FYHUB', conversion: 0.6028 },
  { id: 'vuxpag', name: 'VUXPAG LTDA', bank: 'SANTSBANK', conversion: 0.5573 },
  { id: 'santa', name: 'SANTA LTDA', bank: 'SANTSBANK', conversion: 0.4367 },
]

const PRIMARY_ID = 'nexo'

/**
 * Página de Adquirentes. Server-component mínimo — o conteúdo interativo
 * (busca, toggle) é encapsulado em `AcquirentesView` (client).
 */
export default function AcquirentesPage() {
  return (
    <div className="space-y-6">
      <Header />
      <AcquirentesView acquirers={MOCK_ACQUIRERS} primaryId={PRIMARY_ID} />
    </div>
  )
}

function Header() {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/70 ring-1 ring-white/[0.08]">
          <Bank className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Adquirentes
          </h1>
          <p className="mt-1.5 text-sm text-white/50">
            Veja a conversão das últimas 24 horas e escolha a sua nominal principal
          </p>
        </div>
      </div>
      <SearchInput />
    </div>
  )
}

function SearchInput() {
  return (
    <div className="relative w-full sm:w-72">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
        <Search className="h-4 w-4" />
      </span>
      <input
        type="search"
        placeholder="Buscar adquirente..."
        aria-label="Buscar adquirente"
        className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-4 text-sm text-white transition-all duration-200 placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
      />
    </div>
  )
}

/**
 * Versão client — concentra o estado do toggle de "Troca automática" e o
 * feedback visual ao clicar em "Usar esta".
 */
function AcquirentesView({
  acquirers,
  primaryId,
}: {
  acquirers: Acquirer[]
  primaryId: string
}) {
  const [autoSwap, setAutoSwap] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [feedback, setFeedback] = React.useState<{ id: string; ok: boolean } | null>(null)

  const primary = acquirers.find((a) => a.id === primaryId) ?? acquirers[0]
  const filtered = acquirers.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.bank.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <>
      {/* Card "Troca automática" */}
      <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
            <Zap className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Troca automática</p>
            <p className="mt-1 text-xs text-white/50">
              A cada 30 minutos sua nominal principal muda para a de maior conversão nas últimas 24 horas (hoje: {primary.name}).
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoSwap}
          onClick={() => setAutoSwap((v) => !v)}
          className={cn(
            'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
            autoSwap ? 'bg-brand-500' : 'bg-white/[0.10]',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ease-premium',
              autoSwap ? 'left-[22px]' : 'left-0.5',
            )}
          />
        </button>
      </div>

      {/* Ranking */}
      <ul className="space-y-2.5">
        {filtered.map((acquirer, index) => {
          const isPrimary = acquirer.id === primaryId
          const feedbackState = feedback?.id === acquirer.id ? feedback : null
          return (
            <li
              key={acquirer.id}
              className={cn(
                'flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200 sm:flex-row sm:items-center sm:gap-4',
                isPrimary
                  ? 'border-brand-500/30 bg-brand-500/[0.06] shadow-glow'
                  : 'border-white/[0.06] bg-surface hover:border-white/[0.10]',
              )}
            >
              <div className="flex flex-1 items-center gap-3">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                    index === 0
                      ? 'bg-white text-ink-950'
                      : index === 1
                        ? 'bg-white/80 text-ink-950'
                        : 'bg-white/[0.10] text-white/60',
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{acquirer.name}</p>
                  <p className="mt-0.5 text-xs text-white/40">{acquirer.bank}</p>
                </div>
              </div>

              {/* Barra + percent */}
              <div className="flex flex-1 items-center gap-3">
                <div className="hidden flex-1 sm:block">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Conversão 24H
                  </p>
                  <ConversionBar value={acquirer.conversion} />
                </div>
                <span
                  className={cn(
                    'shrink-0 text-lg font-semibold tabular-nums',
                    acquirer.conversion >= 0.5 ? 'text-emerald-400' : 'text-amber-400',
                  )}
                >
                  {formatPercent(acquirer.conversion, 2)}
                </span>
              </div>

              {/* Botão */}
              {isPrimary ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/15 px-3 py-1.5 text-xs font-semibold text-brand-300">
                  <Check className="h-3.5 w-3.5" />
                  Principal em uso
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFeedback({ id: acquirer.id, ok: true })
                    setTimeout(() => setFeedback(null), 1800)
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-white/[0.10]"
                >
                  {feedbackState ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Definida
                    </>
                  ) : (
                    <>
                      Usar esta
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-white/[0.06] bg-surface p-8 text-center text-sm text-white/50">
            Nenhum adquirente encontrado para "{query}".
          </li>
        )}
      </ul>
    </>
  )
}

function ConversionBar({ value }: { value: number }) {
  // Cor da barra: verde quando >= 50% (similar à referência), âmbar quando <.
  // Mantém a paleta restrita (sem verde/âmbar semântico em outros lugares),
  // aqui é só para o highlight visual que a referência pediu.
  const good = value >= 0.5
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-premium',
          good ? 'bg-emerald-400' : 'bg-amber-400',
        )}
        style={{ width: `${value * 100}%` }}
      />
    </div>
  )
}