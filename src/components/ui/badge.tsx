import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Badges — paleta roxo/preto/branco.
 *
 * Sem cor semântica: status se diferenciam por **shape** e **opacidade**, não
 * por hue. Tons disponíveis:
 *   - `brand`     → fundo brand-500/15, texto brand-300
 *   - `solid`     → fundo branco sólido, texto preto (alto contraste)
 *   - `positive`  → fundo branco/10, texto branco (aprovado/pago)
 *   - `neutral`   → fundo branco/5, texto branco/70 (genérico)
 *   - `muted`     → fundo branco/5, texto branco/40 (inativo/expirado)
 *
 * `danger` continua existindo para erro destrutivo (vermelho).
 */
type Tone = 'brand' | 'solid' | 'positive' | 'neutral' | 'muted' | 'danger'

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-500/15 text-brand-300 ring-brand-400/30',
  solid: 'bg-white text-ink-950 ring-white/20',
  positive: 'bg-white/10 text-white ring-white/15',
  neutral: 'bg-white/[0.06] text-white/70 ring-white/10',
  muted: 'bg-white/[0.04] text-white/40 ring-white/10',
  danger: 'bg-red-500/10 text-red-300 ring-red-400/30',
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
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full bg-current',
            tone === 'muted' && 'bg-transparent ring-1 ring-current ring-inset',
          )}
        />
      )}
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

/**
 * Tons por status. Sem cor semântica — diferenciação por shape/opacidade:
 *   - positivo (aprovado/pago/concluído) → fundo branco/10 (texto branco)
 *   - neutro (pendente/processando/recebido) → fundo branco/5 (texto branco/70)
 *   - negativo (cancelado/estornado/rejeitado) → neutro com dot vazado
 *   - ignorado/expirado/inativo → muted com dot vazado
 *   - falhou → danger (vermelho, único caso)
 */
export const STATUS_TONES: Record<string, Tone> = {
  approved: 'positive',
  paid: 'positive',
  completed: 'positive',
  processed: 'positive',
  active: 'positive',
  pending: 'neutral',
  processing: 'neutral',
  received: 'neutral',
  canceled: 'muted',
  refunded: 'muted',
  rejected: 'muted',
  failed: 'danger',
  expired: 'muted',
  ignored: 'muted',
  inactive: 'muted',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONES[status] ?? 'neutral'
  // Para status negativos, dot vazado para diferenciar.
  const outlined = tone === 'muted'
  return (
    <Badge tone={tone} dot={!outlined} className={className}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}