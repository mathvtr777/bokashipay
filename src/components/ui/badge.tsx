import * as React from 'react'
import { cn } from '@/lib/utils'

/** Badges de status — tom semântico sem poluir a paleta. */
type Tone = 'positive' | 'warning' | 'negative' | 'neutral' | 'brand' | 'info'

const TONES: Record<Tone, string> = {
  positive:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  negative:
    'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
  neutral:
    'bg-ink-100 text-ink-600 ring-ink-500/20 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-600/40',
  brand:
    'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-400/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20',
}

export function Badge({
  tone = 'neutral',
  className,
  dot,
  children,
}: {
  tone?: Tone
  className?: string
  dot?: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/**
 * Rótulos e tons do vocabulário de VENDA.
 *
 * `approved` aqui significa venda aprovada. Saques têm o seu próprio mapa
 * (ver components/saques), porque "aprovado" numa solicitação é um estado
 * diferente — e com tom diferente — de uma venda aprovada.
 */
export const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovada',
  pending: 'Pendente',
  canceled: 'Cancelada',
  refunded: 'Estornada',
  paid: 'Pago',
  expired: 'Expirado',
  processing: 'Processando',
  completed: 'Concluído',
  rejected: 'Rejeitado',
  rejected_saque: 'Recusado',
  active: 'Ativo',
  inactive: 'Inativo',
  received: 'Recebido',
  processed: 'Processado',
  ignored: 'Ignorado',
  failed: 'Falhou',
}

export const STATUS_TONES: Record<string, Tone> = {
  approved: 'positive',
  paid: 'positive',
  completed: 'positive',
  processed: 'positive',
  active: 'positive',
  pending: 'warning',
  processing: 'warning',
  received: 'info',
  canceled: 'negative',
  refunded: 'negative',
  rejected: 'negative',
  failed: 'negative',
  expired: 'neutral',
  ignored: 'neutral',
  inactive: 'neutral',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? 'neutral'} dot className={className}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}