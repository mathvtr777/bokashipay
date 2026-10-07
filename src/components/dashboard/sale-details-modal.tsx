'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateTime, formatNumber, formatRelative } from '@/lib/format'
import type { Transaction } from '@/lib/types'
import { Modal } from '@/components/ui/modal'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { MethodPill } from '@/components/dashboard/sales-table'
import { Copy, Check } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

/**
 * Detalhe de uma venda. Recebe a transação que o Server Component já carregou —
 * o modal não refaz a consulta, então abrir é instantâneo.
 */
export function SaleDetailsModal({
  sale,
  onClose,
}: {
  sale: (Transaction & { customer?: { name: string; email: string | null } | null }) | null
  onClose: () => void
}) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: `${label} copiado` })
    } catch {
      toast({ title: 'Não foi possível copiar', tone: 'error' })
    }
  }

  if (!sale) return null

  const rows = [
    { label: 'Cliente', value: sale.customer?.name ?? sale.payer_name ?? 'Não informado' },
    { label: 'E-mail', value: sale.customer?.email ?? '—' },
    { label: 'Valor', value: formatCurrency(sale.amount) },
    { label: 'Taxa', value: `- ${formatCurrency(sale.fee)}` },
    { label: 'Valor líquido', value: formatCurrency(sale.net_amount), emphasis: true },
    { label: 'Método', value: <MethodPill method={sale.method} /> },
    { label: 'Data', value: formatDateTime(sale.created_at) },
    { label: 'Descrição', value: sale.description ?? '—' },
  ]

  return (
    <Modal
      open
      onClose={onClose}
      title="Detalhes da venda"
      description={sale.description ?? undefined}
      size="lg"
      footer={<button onClick={onClose} className="text-sm font-medium text-white/50 hover:text-white/80">Fechar</button>}
    >
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5 border-white/[0.14] bg-white/[0.08]/50">
        <div>
          <p className="label">Status</p>
          <div className="mt-1.5">
            <StatusBadge status={sale.status} />
          </div>
        </div>
        <div className="text-right">
          <p className="label">Recebido em</p>
          <p className="mt-1.5 text-sm text-white/60 text-white/70">
            {formatRelative(sale.created_at)}
          </p>
        </div>
      </div>

      <dl className="mt-5 divide-y divide-white/[0.06] divide-white/[0.06]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm text-white/50 text-white/50">{row.label}</dt>
            <dd
              className={
                row.emphasis
                  ? 'text-sm font-semibold tabular-nums text-white text-white'
                  : 'text-sm font-medium text-white text-white'
              }
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Identificadores técnicos — o que o usuário precisa para concatenar
          com o provedor ou abrir um chamado. */}
      <div className="mt-5 space-y-3 rounded-xl border border-white/[0.08] p-4 border-white/[0.14]">
        <p className="label">Identificadores</p>

        <IdentifierRow
          label="ID da transação"
          value={sale.id}
          onCopy={() => copy(sale.id, 'ID da transação')}
          copied={copied}
        />

        <IdentifierRow
          label="Identificador do provedor"
          value={sale.external_id ?? 'Não informado'}
          onCopy={sale.external_id ? () => copy(sale.external_id!, 'Identificador') : undefined}
          copied={copied}
        />
      </div>
    </Modal>
  )
}

function IdentifierRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string
  value: string
  onCopy?: () => void
  copied: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-white/50 text-white/50">{label}</p>
        <p className="truncate font-mono text-xs text-white/70 text-white/80">{value}</p>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          aria-label={`Copiar ${label.toLowerCase()}`}
          className="shrink-0 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/70 hover:bg-white/[0.2]"
        >
          {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}

/** Link "ver todas" usado nos cards do dashboard. */
export function ViewAllLink({ href, label = 'Ver todas' }: { href: string; label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 text-brand-400"
    >
      {label}
    </button>
  )
}