'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Search, Download } from '@/components/ui/icons'
import type { DateRangePreset } from '@/lib/types'

/**
 * Barra de filtros da página /transacoes: período + status + origem +
 * busca. Todos escrevem no querystring e disparam navegação; o servidor
 * refaz a query a partir do state.
 */
const PERIOD_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'custom', label: 'Custom' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos status' },
  { value: 'approved', label: 'Aprovadas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'canceled', label: 'Canceladas' },
  { value: 'refunded', label: 'Estornadas' },
] as const

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Todas origens' },
  { value: 'telegram_bot', label: 'Bot Telegram' },
  { value: 'checkout_direct', label: 'Checkout direto' },
  { value: 'api', label: 'API' },
  { value: 'other', label: 'Outros' },
] as const

export function TransactionsFilters({
  currentPeriodo,
  currentStatus,
  currentSource,
  currentQuery,
}: {
  currentPeriodo: DateRangePreset
  currentStatus: string
  currentSource: string
  currentQuery: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = React.useState(currentQuery)

  const setParam = (next: Partial<Record<string, string>>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v && v !== 'all' && v !== '') params.set(k, v)
      else params.delete(k)
    }
    params.delete('pagina')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setParam({ q: query.trim() })
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Período */}
      <Select
        value={currentPeriodo}
        onChange={(v) => setParam({ periodo: v })}
        options={PERIOD_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        aria-label="Período"
      />

      {/* Status */}
      <Select
        value={currentStatus}
        onChange={(v) => setParam({ status: v })}
        options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        aria-label="Status"
      />

      {/* Origem */}
      <Select
        value={currentSource}
        onChange={(v) => setParam({ origem: v })}
        options={SOURCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        aria-label="Origem"
      />

      {/* Busca */}
      <form onSubmit={submit} className="relative flex-1 min-w-[200px]">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente, produto, e-mail…"
          aria-label="Buscar"
          className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-4 text-sm text-white transition-all duration-200 placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        />
      </form>

      {/* Exportar CSV */}
      <button
        type="button"
        onClick={() => {
          // Stub de export: gera um CSV mínimo em memória.
          const blob = new Blob(['id,status,amount\n'], { type: 'text/csv;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`
          a.click()
          URL.revokeObjectURL(url)
        }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/[0.08]"
      >
        <Download className="h-3.5 w-3.5" />
        Exportar CSV
      </button>
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
  ...rest
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  'aria-label'?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
      className={cn(
        'h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 pr-8 text-sm text-white transition-colors duration-200',
        'appearance-none bg-no-repeat',
        'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15',
        rest['aria-label'] ? 'min-w-[140px]' : '',
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff80' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundSize: '14px',
        backgroundPosition: 'right 0.75rem center',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ backgroundColor: '#14171f' }}>
          {o.label}
        </option>
      ))}
    </select>
  )
}