'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PERIOD_LABELS } from '@/lib/date-range'
import type { DateRangePreset } from '@/lib/types'
import { Calendar } from '@/components/ui/icons'

/**
 * Seletor de período que escreve no querystring da URL.
 *
 * Guardar o filtro na URL (e não em estado local) faz a página ser
 * compartilhável e sobreviver a um F5 — e é o que permite ao servidor ler o
 * mesmo filtro e buscar os dados já filtrados.
 */
export function PeriodSelector({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current = (searchParams.get('periodo') ?? '30d') as DateRangePreset
  const from = searchParams.get('de') ?? ''
  const to = searchParams.get('ate') ?? ''

  const update = (next: Partial<Record<string, string>>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    // Qualquer mudança de filtro volta para a primeira página.
    params.delete('pagina')
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div
        role="tablist"
        aria-label="Selecionar período"
        className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-900"
      >
        {PERIOD_LABELS.filter((p) => p.value !== 'custom').map((preset) => {
          const active = current === preset.value
          return (
            <button
              key={preset.value}
              role="tab"
              aria-selected={active}
              onClick={() => update({ periodo: preset.value, de: '', ate: '' })}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-premium',
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white',
              )}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      {/* Intervalo manual, revelado ao escolher "Personalizado". */}
      {current === 'custom' && (
        <div className="flex animate-fade-in items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-1.5 dark:border-ink-700 dark:bg-ink-900">
          <Calendar className="h-3.5 w-3.5 text-ink-400" />
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => update({ de: e.target.value })}
            aria-label="Data inicial"
            className="bg-transparent text-xs text-ink-700 outline-none dark:text-ink-200"
          />
          <span className="text-ink-400">–</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => update({ ate: e.target.value })}
            aria-label="Data final"
            className="bg-transparent text-xs text-ink-700 outline-none dark:text-ink-200"
          />
        </div>
      )}
    </div>
  )
}