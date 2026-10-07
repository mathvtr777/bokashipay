import { formatCurrency, formatDateTime, shortId } from '@/lib/format'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/feedback'
import { Eye, CreditCard, ShoppingBag } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface Row {
  id: string
  status: string
  amount: number
  method: string
  description: string | null
  payer_name: string | null
  created_at: string
  customer?: { id: string; name: string; email: string | null } | null
  product?: { id: string; name: string } | null
}

/**
 * Tabela "Transações" — colunas: Data, Status, Origem, Produto, Cliente,
 * Valor (com ícone "ver detalhes" à direita). Sem ações inline para não
 * poluir a primeira impressão — o ícone leva ao modal (a integrar).
 */
export function TransactionsTable({
  rows,
  total,
  page,
  totalPages,
}: {
  rows: Row[]
  total: number
  page: number
  totalPages: number
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nenhuma transação no período."
        description="Quando houver cobranças pagas ou pendentes, elas aparecem aqui."
      />
    )
  }

  return (
    <div className="surface overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Status</th>
              <th>Origem</th>
              <th>Produto</th>
              <th>Cliente</th>
              <th className="text-right">Valor</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const origin = deriveOrigin(row)
              return (
                <tr key={row.id} className="group">
                  <td className="whitespace-nowrap text-white/70">
                    {formatDateTime(row.created_at)}
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>
                    <OriginPill origin={origin} />
                  </td>
                  <td className="text-white/70">
                    {row.product?.name ?? row.description ?? '—'}
                  </td>
                  <td className="text-white">
                    {row.customer?.name ?? row.payer_name ?? 'Não informado'}
                  </td>
                  <td className="text-right font-semibold tabular-nums text-white">
                    {formatCurrency(row.amount)}
                  </td>
                  <td>
                    <button
                      type="button"
                      aria-label={`Ver detalhes de ${shortId(row.id)}`}
                      className="rounded-lg p-1 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3 text-xs text-white/40">
          <span>
            {total} {total === 1 ? 'transação' : 'transações'}
          </span>
          <span>
            Página {page} de {totalPages}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Origem derivada de `description` + `method`. Mesma heurística de
 * `getSourceBreakdown` para ficar igual.
 */
type Origin = 'telegram_bot' | 'checkout_direct' | 'api' | 'other'

function deriveOrigin(row: Row): Origin {
  const desc = (row.description ?? '').toLowerCase()
  if (desc.includes('telegram')) return 'telegram_bot'
  if (desc.includes('checkout') || row.method === 'card' || row.method === 'boleto') return 'checkout_direct'
  if (desc.includes('api')) return 'api'
  return 'other'
}

function OriginPill({ origin }: { origin: Origin }) {
  if (origin === 'other') return <span className="text-white/30">—</span>
  const Icon = ICON_BY_ORIGIN[origin]
  return (
    <Badge tone="brand">
      <Icon className="h-3 w-3" />
      {LABEL_BY_ORIGIN[origin]}
    </Badge>
  )
}

const ICON_BY_ORIGIN: Record<Exclude<Origin, 'other'>, (p: { className?: string }) => React.ReactElement> = {
  telegram_bot: ShoppingBag,
  checkout_direct: CreditCard,
  api: Eye,
}

const LABEL_BY_ORIGIN: Record<Exclude<Origin, 'other'>, string> = {
  telegram_bot: 'Bot Telegram',
  checkout_direct: 'Link Rápido',
  api: 'API',
}