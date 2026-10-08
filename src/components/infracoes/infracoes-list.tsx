'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from '@/components/ui/icons'
import { EmptyState } from '@/components/ui/feedback'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface InfracaoRow {
  id: string
  status: string
  type: string
  amount: number
  reason: string | null
  opened_at: string
  resolved_at: string | null
  transaction_id: string | null
  created_at: string
}

/**
 * Card de busca + lista de infrações. Filtra por status (escrito no
 * querystring) e busca textual. Empty state amigável quando não há
 * infrações (situação comum — só aparecem quando o PSP sinaliza fraude).
 */
export function InfracoesList({
  rows,
  currentQuery,
  currentStatus,
}: {
  rows: InfracaoRow[]
  currentQuery: string
  currentStatus: string
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
    router.replace(`${pathname}?${params.toString()}`)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setParam({ q: query.trim() })
  }

  const STATUS_OPTIONS = [
    { value: 'all', label: 'Todos status' },
    { value: 'open', label: 'Abertas' },
    { value: 'analyzing', label: 'Em análise' },
    { value: 'defended', label: 'Defendidas' },
    { value: 'won', label: 'Ganhas' },
    { value: 'lost', label: 'Perdidas' },
  ] as const

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={submit} className="relative w-full sm:max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por transação ou cliente"
            aria-label="Buscar"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-4 text-sm text-white transition-all duration-200 placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </form>

        <select
          value={currentStatus}
          onChange={(e) => setParam({ status: e.target.value })}
          aria-label="Status"
          className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 pr-8 text-sm text-white transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} style={{ backgroundColor: '#14171f' }}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="surface p-12 text-center">
          <p className="text-sm text-white/60">Nenhuma infração registrada nas suas vendas.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="surface flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge tone={TYPE_TONE[row.type] ?? 'neutral'}>
                    {TYPE_LABEL[row.type] ?? row.type}
                  </Badge>
                  <span className="text-xs text-white/40">
                    aberta em {formatDateTime(row.opened_at)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-white">
                  {row.reason ?? '—'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold tabular-nums text-white">
                  {formatCurrency(row.amount)}
                </span>
                <StatusBadge status={STATUS_TO_TONE[row.status] ?? 'neutral'} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const TYPE_LABEL: Record<string, string> = {
  chargeback: 'Chargeback',
  fraud: 'Fraude',
  dispute: 'Disputa',
}

const TYPE_TONE: Record<string, 'danger' | 'muted' | 'brand'> = {
  chargeback: 'danger',
  fraud: 'danger',
  dispute: 'muted',
}

// Mapeia o status da infração para o tom de StatusBadge existente.
const STATUS_TO_TONE: Record<string, 'positive' | 'warning' | 'muted' | 'danger'> = {
  open: 'warning',
  analyzing: 'warning',
  defended: 'positive',
  won: 'positive',
  lost: 'muted',
}