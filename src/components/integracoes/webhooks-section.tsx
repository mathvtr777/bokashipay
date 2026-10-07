'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { Copy, Share, Trash } from '@/components/ui/icons'

type WebhookRow = {
  id: string
  url: string
  events: string[]
  active: boolean
  last_delivery_at: string | null
  last_status: number | null
  last_error: string | null
  created_at: string
}

const AVAILABLE_EVENTS = [
  { value: 'charge.paid', label: 'Cobrança paga' },
]

export function WebhooksSection({ initialWebhooks }: { initialWebhooks: WebhookRow[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [creating, setCreating] = React.useState(false)
  const [url, setUrl] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [deleting, setDeleting] = React.useState<WebhookRow | null>(null)
  const [newSecret, setNewSecret] = React.useState<{ id: string; url: string; secret: string } | null>(null)

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setBusy(true)
    const res = await fetch('/api/integracoes/webhook-endpoints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), events: ['charge.paid'] }),
    })
    setBusy(false)
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      toast({ title: 'Falha ao criar', description: body.error, tone: 'error' })
      return
    }
    const body = (await res.json()) as { id: string; url: string; secret: string }
    setNewSecret({ id: body.id, url: body.url, secret: body.secret })
    setUrl('')
    setCreating(false)
    router.refresh()
  }

  const remove = async () => {
    if (!deleting) return
    const res = await fetch(
      `/api/integracoes/webhook-endpoints?id=${encodeURIComponent(deleting.id)}`,
      { method: 'DELETE' },
    )
    if (!res.ok) {
      toast({ title: 'Falha ao remover', tone: 'error' })
      return
    }
    toast({ title: 'Webhook removido' })
    setDeleting(null)
    router.refresh()
  }

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: `${label} copiado` })
    } catch {
      toast({ title: 'Falha ao copiar', tone: 'error' })
    }
  }

  return (
    <section className="surface overflow-hidden p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white text-white">
            <Share className="h-4 w-4 text-brand-600 text-brand-400" />
            Webhooks de saída
          </h2>
          <p className="mt-1 text-sm text-white/50 text-white/50">
            Receba POSTs quando cobranças forem pagas. Cada um com HMAC no header.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          Adicionar webhook
        </Button>
      </header>

      {initialWebhooks.length === 0 ? (
        <EmptyState
          icon={<Share />}
          title="Nenhum webhook configurado"
          description="Adicione uma URL para receber notificações."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Eventos</th>
                <th>Última entrega</th>
                <th className="w-1" />
              </tr>
            </thead>
            <tbody>
              {initialWebhooks.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs bg-white/[0.08]">
                        {w.url}
                      </code>
                    </div>
                  </td>
                  <td>
                    {w.events.map((ev) => (
                      <span
                        key={ev}
                        className="mr-1 inline-flex rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/70 bg-white/[0.08] text-white/70"
                      >
                        {AVAILABLE_EVENTS.find((a) => a.value === ev)?.label ?? ev}
                      </span>
                    ))}
                  </td>
                  <td className="text-xs text-white/50 text-white/50">
                    {w.last_delivery_at
                      ? `${new Date(w.last_delivery_at).toLocaleDateString('pt-BR')} · HTTP ${w.last_status ?? '?'}`
                      : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => setDeleting(w)}
                      aria-label="Remover webhook"
                      title="Remover"
                      className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-red-50 hover:text-red-600 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => !busy && setCreating(false)}
        title="Adicionar webhook"
        description="A Bokashi vai fazer POST pra cá quando o evento configurado ocorrer."
        size="md"
      >
        <form onSubmit={create} className="space-y-4">
          <div>
            <label htmlFor="webhookUrl" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
              URL de destino
            </label>
            <Input
              id="webhookUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.seusite.com/webhooks/bokashipay"
              type="url"
              required
            />
            <p className="mt-1 text-[11px] text-white/50 text-white/50">
              Deve ser uma URL pública. HTTPS obrigatório em produção.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setCreating(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" loading={busy}>
              Criar
            </Button>
          </div>
        </form>
      </Modal>

      {newSecret && (
        <Modal
          open
          onClose={() => setNewSecret(null)}
          title="Webhook criado"
          description="Anote o secret. Ele é usado pra verificar a assinatura HMAC."
          size="md"
          footer={
            <Button onClick={() => setNewSecret(null)}>Fechar</Button>
          }
        >
          <div className="space-y-3">
            <p className="rounded-lg border border-amber-200 bg-white/[0.05] px-3 py-2 text-xs text-amber-800 border-amber-500/30 bg-white/[0.10]/10 text-amber-300">
              ⚠️ Anote o secret agora — ele não vai aparecer novamente.
            </p>
            <button
              type="button"
              onClick={() => copy(newSecret.secret, 'Secret')}
              className="group flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white px-3 py-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/50 border-white/[0.14] bg-ink-900 hover:bg-white/[0.08]"
            >
              <code className="flex-1 break-all font-mono text-[11px] text-white/70 text-white/80">
                {newSecret.secret}
              </code>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/70 bg-white/[0.08] text-white/80">
                <Copy className="h-3 w-3" />
                Copiar
              </span>
            </button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        title="Remover webhook"
        description="Esta ação não pode ser desfeita. Você vai parar de receber eventos nessa URL."
        confirmLabel="Remover"
        tone="danger"
      />
    </section>
  )
}