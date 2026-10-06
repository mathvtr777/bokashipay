'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatNumber, maskDocument } from '@/lib/format'
import type { CustomerWithStats } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/feedback'
import { Modal } from '@/components/ui/modal'
import { Customers, Mail, Phone, Search } from '@/components/ui/icons'

export function CustomersTable({ customers }: { customers: CustomerWithStats[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const [selected, setSelected] = React.useState<CustomerWithStats | null>(null)

  const search = React.useRef<HTMLInputElement>(null)
  // Debounce da busca: evita uma consulta ao banco por tecla digitada.
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const submitSearch = (value: string) => {
    router.replace(`${pathname}?${value ? `busca=${encodeURIComponent(value)}` : ''}`)
  }

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-ink-100 p-5 dark:border-ink-800">
        <Input
          ref={search}
          placeholder="Buscar cliente pelo nome…"
          defaultValue={search.current?.value ?? ''}
          onChange={(e) => {
            const value = e.target.value
            // Debounce para não consultar a cada tecla.
            if (timer.current) clearTimeout(timer.current)
            timer.current = setTimeout(() => submitSearch(value), 400)
          }}
          icon={<Search />}
          aria-label="Buscar cliente"
        />
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={<Customers />}
          title="Nenhum cliente por aqui"
          description="Seus clientes aparecem automaticamente assim que registrarem compras."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th className="text-right">Total comprado</th>
                <th className="text-right">Compras</th>
                <th>Última compra</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelected(customer)}
                  className="cursor-pointer"
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-900 dark:text-ink-50">
                          {customer.name}
                        </p>
                        {customer.document && (
                          <p className="text-xs text-ink-500 dark:text-ink-400">
                            {maskDocument(customer.document)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="min-w-0 text-sm">
                      {customer.email && (
                        <p className="truncate text-ink-600 dark:text-ink-300">{customer.email}</p>
                      )}
                      {customer.phone && (
                        <p className="text-xs text-ink-500 dark:text-ink-400">{customer.phone}</p>
                      )}
                      {!customer.email && !customer.phone && (
                        <span className="text-ink-400">—</span>
                      )}
                    </div>
                  </td>

                  <td className="text-right font-semibold tabular-nums text-ink-900 dark:text-ink-50">
                    {formatCurrency(customer.total_purchased)}
                  </td>

                  <td className="text-right tabular-nums text-ink-600 dark:text-ink-300">
                    {formatNumber(customer.purchase_count)}
                  </td>

                  <td className="whitespace-nowrap text-ink-500 dark:text-ink-400">
                    {customer.last_purchase_at ? formatDate(customer.last_purchase_at) : '—'}
                  </td>

                  <td>
                    <Badge tone={customer.status === 'active' ? 'positive' : 'neutral'}>
                      {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerModal customer={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

/** Perfil detalhado do cliente. */
function CustomerModal({
  customer,
  onClose,
}: {
  customer: CustomerWithStats | null
  onClose: () => void
}) {
  return (
    <Modal
      open={customer !== null}
      onClose={onClose}
      title={customer?.name}
      description={`Cliente desde ${customer ? formatDate(customer.created_at) : ''}`}
      size="md"
      footer={
        <button onClick={onClose} className="text-sm font-medium text-ink-500 hover:text-ink-800 dark:hover:text-ink-200">
          Fechar
        </button>
      }
    >
      {customer && (
        <>
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800/60">
              <dt className="label">Total comprado</dt>
              <dd className="mt-1.5 text-lg font-semibold tabular-nums text-ink-900 dark:text-white">
                {formatCurrency(customer.total_purchased)}
              </dd>
            </div>
            <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800/60">
              <dt className="label">Compras</dt>
              <dd className="mt-1.5 text-lg font-semibold tabular-nums text-ink-900 dark:text-white">
                {formatNumber(customer.purchase_count)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 space-y-2.5">
            {customer.email && (
              <ContactRow icon={<Mail className="h-4 w-4" />} value={customer.email} />
            )}
            {customer.phone && (
              <ContactRow icon={<Phone className="h-4 w-4" />} value={customer.phone} />
            )}
          </div>

          <div className="mt-5">
            <p className="label">Histórico</p>
            {customer.purchase_count === 0 ? (
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                Este cliente ainda não tem compras aprovadas.
              </p>
            ) : (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2.5 text-sm dark:bg-ink-800/60">
                  <span className="text-ink-600 dark:text-ink-300">
                    {customer.purchase_count} {customer.purchase_count === 1 ? 'compra' : 'compras'} aprovadas
                  </span>
                  <span className="tabular-nums text-ink-900 dark:text-white">
                    {formatCurrency(customer.total_purchased)}
                  </span>
                </div>
                {customer.last_purchase_at && (
                  <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2.5 text-sm dark:bg-ink-800/60">
                    <span className="text-ink-600 dark:text-ink-300">Última compra</span>
                    <span className="text-ink-900 dark:text-white">
                      {formatDate(customer.last_purchase_at)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}

function ContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-ink-600 dark:text-ink-300">
      <span className={cn('text-ink-400')}>{icon}</span>
      {value}
    </div>
  )
}