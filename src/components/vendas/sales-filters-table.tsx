'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, Input } from '@/components/ui/input'
import { SalesTable } from '@/components/dashboard/sales-table'
import { SaleDetailsModal } from '@/components/dashboard/sale-details-modal'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from '@/components/ui/icons'
import type { Transaction } from '@/lib/types'

/**
 * Tabela de vendas com filtros.
 *
 * Os filtros vivem no querystring (não em estado), então o servidor busca
 * exatamente o conjunto mostrado, e a URL é compartilhável.
 */
export function SalesFiltersTable({
  rows,
  total,
  totalPages,
}: {
  rows: (Transaction & { customer?: { name: string } | null })[]
  total: number
  totalPages: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = React.useState<Transaction | null>(null)
  const [expanded, setExpanded] = React.useState(false)
  // Debounce do campo de busca: evita uma consulta por tecla digitada.
  const updateTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => () => {
    if (updateTimer.current) clearTimeout(updateTimer.current)
  }, [])

  const status = searchParams.get('status') ?? 'all'
  const method = searchParams.get('metodo') ?? 'all'
  const customer = searchParams.get('cliente') ?? ''
  const min = searchParams.get('min') ?? ''
  const max = searchParams.get('max') ?? ''
  // A página vem da URL; o total vem do servidor (que já consultou).
  const page = Math.max(1, Number(searchParams.get('pagina') ?? '1'))

  const update = React.useCallback(
    (next: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(next)) {
        if (value && value !== 'all') params.set(key, value)
        else params.delete(key)
      }
      params.delete('pagina')
      router.replace(`/vendas?${params.toString()}`)
    },
    [router, searchParams],
  )

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pagina', String(next))
    router.replace(`/vendas?${params.toString()}`)
  }

  const hasFilters = status !== 'all' || method !== 'all' || customer || min || max

  const clear = () => {
    const params = new URLSearchParams()
    const periodo = searchParams.get('periodo')
    if (periodo) params.set('periodo', periodo)
    router.replace(`/vendas?${params.toString()}`)
  }

  return (
    <div className="surface overflow-hidden">
      {/* Filtros */}
      <div className="border-b border-white/[0.06] p-5 border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Buscar por nome do cliente…"
              defaultValue={customer}
              onChange={(e) => {
                // Espera o usuário parar de digitar antes de consultar.
                const value = e.target.value
                if (updateTimer.current) clearTimeout(updateTimer.current)
                updateTimer.current = setTimeout(() => update({ cliente: value }), 400)
              }}
              icon={<Search />}
              aria-label="Buscar por cliente"
            />
          </div>

          <Select
            value={status}
            onChange={(e) => update({ status: e.target.value })}
            options={[
              { value: 'all', label: 'Todos os status' },
              { value: 'approved', label: 'Aprovada' },
              { value: 'pending', label: 'Pendente' },
              { value: 'canceled', label: 'Cancelada' },
              { value: 'refunded', label: 'Estornada' },
            ]}
            className="w-[168px]"
            aria-label="Filtrar por status"
          />

          <Select
            value={method}
            onChange={(e) => update({ metodo: e.target.value })}
            options={[
              { value: 'all', label: 'Todos os métodos' },
              { value: 'pix', label: 'PIX' },
              { value: 'card', label: 'Cartão' },
              { value: 'boleto', label: 'Boleto' },
            ]}
            className="w-[168px]"
            aria-label="Filtrar por método"
          />

          <Button
            variant="outline"
            onClick={() => setExpanded((v) => !v)}
            className="lg:hidden"
            aria-expanded={expanded}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Valor
          </Button>

          <div className={cn('hidden w-full items-center gap-3 lg:flex', expanded && 'lg:flex')}>
            <Input
              type="number"
              placeholder="Valor mínimo"
              defaultValue={min}
              onBlur={(e) => update({ min: e.target.value })}
              className="w-full"
              aria-label="Valor mínimo"
            />
            <Input
              type="number"
              placeholder="Valor máximo"
              defaultValue={max}
              onBlur={(e) => update({ max: e.target.value })}
              className="w-full"
              aria-label="Valor máximo"
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" onClick={clear}>
              Limpar
            </Button>
          )}
        </div>

        {/* Faixa de valores no mobile, onde o filtro por valor é escondido. */}
        {expanded && (
          <div className="mt-3 flex items-center gap-3 lg:hidden">
            <Input
              type="number"
              placeholder="Valor mínimo"
              defaultValue={min}
              onBlur={(e) => update({ min: e.target.value })}
              aria-label="Valor mínimo"
            />
            <Input
              type="number"
              placeholder="Valor máximo"
              defaultValue={max}
              onBlur={(e) => update({ max: e.target.value })}
              aria-label="Valor máximo"
            />
          </div>
        )}
      </div>

      <SalesTable transactions={rows} onSelect={setSelected} showFee />

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] px-5 py-4 border-white/[0.08]">
          <p className="text-sm text-white/50 text-white/50">
            Página {page} de {totalPages} · {total} vendas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <SaleDetailsModal sale={selected} onClose={() => setSelected(null)} />
    </div>
  )
}