'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDateTime, formatRelative } from '@/lib/format'
import { classifyPixKey, pixKeyTypeLabel } from '@/lib/pix-key'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/feedback'
import { AlertTriangle, Check, Inbox, Wallet, X } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

interface QueueItem {
  id: string
  user_id: string
  amount_brl: number
  pix_key: string
  pix_key_type: string
  holder_name: string
  status: string
  rejection_reason: string | null
  payout_reference: string | null
  created_at: string
  reviewed_at: string | null
  profiles?: { full_name: string; email: string } | null
}

const TABS = [
  { key: 'pending', label: 'Aguardando análise' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'completed', label: 'Concluídos' },
  { key: 'rejected', label: 'Recusados' },
] as const

/**
 * Painel de aprovação de saques.
 *
 * Só você chega aqui: a página checa `ADMIN_USER_EMAILS` no servidor, e a API
 * refaz a checagem antes de qualquer escrita. A fila vem do service role, já
 * que o RLS normal esconde as solicitações dos outros usuários.
 */
export function AdminWithdrawals({ adminConfigured }: { adminConfigured: boolean }) {
  const router = useRouter()
  const { toast } = useToast()

  const [tab, setTab] = React.useState<(typeof TABS)[number]['key']>('pending')
  const [items, setItems] = React.useState<QueueItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [acting, setActing] = React.useState<string | null>(null)

  // Ação pendente de confirmação: rejeitar e concluir pedem dado extra.
  const [rejecting, setRejecting] = React.useState<QueueItem | null>(null)
  const [completing, setCompleting] = React.useState<QueueItem | null>(null)
  const [reason, setReason] = React.useState('')
  const [reference, setReference] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!adminConfigured) {
      setError('SUPABASE_SECRET_KEY não configurada no servidor.')
      setLoading(false)
      return
    }

    try {
      // A fila vem por uma rota de API: o RLS normal esconde as solicitações
      // dos outros usuários, então só o servidor com service role pode
      // reuni-las. O segredo nunca passa pelo bundle.
      const response = await fetch('/api/admin/withdrawals', { cache: 'no-store' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? `Falha ao carregar a fila (${response.status}).`)
      }

      const body = await response.json()
      setItems((body.withdrawals ?? []) as QueueItem[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar a fila.')
    } finally {
      setLoading(false)
    }
  }, [adminConfigured])

  React.useEffect(() => {
    void load()
  }, [load])

  // Realtime: um pedido novo aparece sem recarregar a página.
  React.useEffect(() => {
    if (!adminConfigured) return

    const supabase = createClient()
    const channel = supabase
      .channel('admin-withdrawals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawal_requests' },
        () => void load(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [adminConfigured, load])

  const act = async (
    item: QueueItem,
    action: 'approve' | 'reject' | 'complete',
    extra: Record<string, string> = {},
  ) => {
    setActing(item.id)

    const response = await fetch('/api/admin/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id: item.id, ...extra }),
    }).catch(() => null)

    if (!response) {
      toast({ title: 'Falha de conexão', tone: 'error' })
    } else if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast({
        title: 'Ação não concluída',
        description: body?.error ?? 'Tente novamente.',
        tone: 'error',
      })
    } else {
      toast({
        title:
          action === 'approve'
            ? 'Solicitação aprovada'
            : action === 'reject'
              ? 'Solicitação recusada'
              : 'Pagamento confirmado',
      })
      await load()
      router.refresh()
    }

    setActing(null)
    setRejecting(null)
    setCompleting(null)
    setReason('')
    setReference('')
  }

  const filtered = items.filter((item) => item.status === tab)
  const pendingTotal = items
    .filter((i) => i.status === 'pending')
    .reduce((sum, i) => sum + Number(i.amount_brl), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl text-white">
            Saques
          </h1>
          <p className="mt-1.5 text-sm text-white/50 text-white/50">
            Aprove e confirme os pagamentos. Nenhum dinheiro sai sem sua decisão.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white px-5 py-3 border-white/[0.08] bg-ink-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 bg-brand-500/10 text-brand-400">
            <Wallet className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-white/50 text-white/50">Aguardando análise</p>
            <p className="text-lg font-semibold tabular-nums text-white text-white">
              {formatCurrency(pendingTotal)}
            </p>
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] p-2 border-white/[0.08]">
          {TABS.map((item) => {
            const count = items.filter((i) => i.status === item.key).length
            const active = tab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-brand-50 text-brand-700 bg-brand-500/10 text-brand-300'
                    : 'text-white/60 hover:bg-white/[0.04] text-white/50 hover:bg-white/[0.08]',
                )}
              >
                {item.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                      active
                        ? 'bg-brand-600 text-white'
                        : 'bg-white/[0.04] text-white/60 bg-white/[0.08] text-white/50',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loading ? (
          <LoadingState label="Carregando solicitações…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox />}
            title={tab === 'pending' ? 'Nenhum saque aguardando análise' : 'Nada aqui'}
            description={
              tab === 'pending'
                ? 'Quando um usuário solicitar um saque, ele aparece nesta fila.'
                : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-white/[0.06] divide-white/[0.06]">
            {filtered.map((item) => {
              const keyInfo = classifyPixKey(item.pix_key)
              const busy = acting === item.id

              return (
                <li key={item.id} className="px-5 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold tabular-nums text-white text-white">
                          {formatCurrency(item.amount_brl)}
                        </p>
                        <Badge tone="brand">{pixKeyTypeLabel(item.pix_key_type)}</Badge>
                      </div>

                      <dl className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
                        <Field
                          label="Chave PIX"
                          value={item.pix_key}
                          mono
                          hint={
                            keyInfo.valid ? undefined : 'Chave não parece válida — confira.'
                          }
                        />
                        <Field label="Titular" value={item.holder_name} />
                        <Field
                          label="Usuário"
                          value={item.profiles?.full_name ?? '—'}
                          hint={item.profiles?.email ?? undefined}
                        />
                        <Field
                          label="Solicitado"
                          value={`${formatDateTime(item.created_at)} (${formatRelative(item.created_at)})`}
                        />
                      </dl>

                      {item.status === 'rejected' && item.rejection_reason && (
                        <p className="mt-2.5 text-xs text-red-600 text-red-400">
                          Motivo enviado ao usuário: {item.rejection_reason}
                        </p>
                      )}
                      {item.payout_reference && (
                        <p className="mt-2.5 text-xs text-white/50 text-white/50">
                          Referência do pagamento: {item.payout_reference}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {item.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            loading={busy}
                            onClick={() => act(item, 'approve')}
                          >
                            <Check className="h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => setRejecting(item)}
                            className="text-red-600 hover:bg-red-50 text-red-400 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4" />
                            Recusar
                          </Button>
                        </>
                      )}

                      {item.status === 'approved' && (
                        <Button size="sm" loading={busy} onClick={() => setCompleting(item)}>
                          <Check className="h-4 w-4" />
                          Confirmar pagamento
                        </Button>
                      )}

                      {(item.status === 'completed' || item.status === 'rejected') && (
                        <Badge tone={item.status === 'completed' ? 'positive' : 'muted'} dot>
                          {item.status === 'completed' ? 'Concluído' : 'Recusado'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Recusa */}
      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="Recusar solicitação"
        description="O motivo é enviado ao usuário por notificação."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={acting === rejecting?.id}
              onClick={() => rejecting && act(rejecting, 'reject', { reason })}
            >
              Recusar saque
            </Button>
          </>
        }
      >
        {rejecting && (
          <>
            <div className="mb-4 flex gap-3 rounded-xl bg-white/[0.04] p-3.5 text-sm bg-white/[0.08]/60">
              <Wallet className="h-4 w-4 shrink-0 text-white/50" />
              <div>
                <p className="font-medium text-white text-white">
                  {formatCurrency(rejecting.amount_brl)}
                </p>
                <p className="mt-0.5 text-xs text-white/50 text-white/50">
                  Chave {pixKeyTypeLabel(rejecting.pix_key_type).toLowerCase()}: {rejecting.pix_key}
                </p>
              </div>
            </div>

            <Input
              label="Motivo"
              placeholder="Ex.: chave PIX em nome de terceiros"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              hint="Opcional, mas ajuda o usuário a entender."
            />
          </>
        )}
      </Modal>

      {/* Confirmação de pagamento */}
      <Modal
        open={completing !== null}
        onClose={() => setCompleting(null)}
        title="Confirmar que o pagamento foi feito"
        description="Isso marca o saque como concluído e lança a saída no extrato do usuário."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompleting(null)}>
              Cancelar
            </Button>
            <Button
              loading={acting === completing?.id}
              onClick={() => completing && act(completing, 'complete', { payoutReference: reference })}
            >
              Confirmar pagamento
            </Button>
          </>
        }
      >
        {completing && (
          <>
            <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-white/[0.05] p-3.5 text-sm border-amber-500/25 bg-white/[0.10]/10">
              <AlertTriangle className="h-4 w-4 shrink-0 text-white/70 text-white/70" />
              <p className="text-amber-800 text-amber-300">
                Confirme <strong>depois</strong> de efetivamente transferir{' '}
                {formatCurrency(completing.amount_brl)} para a chave informada. Esta ação não envia
                dinheiro — ela registra o que você já pagou.
              </p>
            </div>

            <Input
              label="Referência do pagamento"
              placeholder="Ex.: ID da transferência no banco"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              hint="Opcional. Ajuda a conciliar depois."
            />
          </>
        )}
      </Modal>
    </div>
  )
}

function Field({
  label,
  value,
  hint,
  mono,
}: {
  label: string
  value: string
  hint?: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-white/50 text-white/50">{label}</dt>
      <dd
        className={cn(
          'truncate font-medium text-white text-white',
          mono && 'font-mono text-sm',
        )}
      >
        {value}
      </dd>
      {hint && <p className="truncate text-xs text-white/50">{hint}</p>}
    </div>
  )
}