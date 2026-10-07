'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { Copy, Lock, Trash } from '@/components/ui/icons'

type ApiKeyRow = {
  id: string
  name: string
  prefix: string
  suffix: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

export function ApiKeysSection({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [creating, setCreating] = React.useState(false)
  const [name, setName] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [newKey, setNewKey] = React.useState<string | null>(null)
  const [revoking, setRevoking] = React.useState<ApiKeyRow | null>(null)

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const res = await fetch('/api/integracoes/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setBusy(false)
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      toast({ title: 'Falha ao criar', description: body.error, tone: 'error' })
      return
    }
    const body = (await res.json()) as { full_key: string }
    setNewKey(body.full_key)
    setName('')
    setCreating(false)
    router.refresh()
  }

  const revoke = async () => {
    if (!revoking) return
    const res = await fetch(
      `/api/integracoes/api-keys?id=${encodeURIComponent(revoking.id)}`,
      { method: 'DELETE' },
    )
    if (!res.ok) {
      toast({ title: 'Falha ao revogar', tone: 'error' })
      return
    }
    toast({ title: 'Chave revogada' })
    setRevoking(null)
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

  const active = initialKeys.filter((k) => !k.revoked_at)

  return (
    <section className="surface overflow-hidden p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white text-white">
            <Lock className="h-4 w-4 text-brand-600 text-brand-400" />
            Chaves de API
          </h2>
          <p className="mt-1 text-sm text-white/50 text-white/50">
            Autentique chamadas com <code className="rounded bg-white/[0.04] px-1 bg-white/[0.08]">Authorization: Bearer &lt;chave&gt;</code>.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          Gerar nova chave
        </Button>
      </header>

      {active.length === 0 ? (
        <EmptyState
          icon={<Lock />}
          title="Nenhuma chave ainda"
          description="Gere uma chave para começar a integrar."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Chave</th>
                <th>Criada</th>
                <th>Último uso</th>
                <th className="w-1" />
              </tr>
            </thead>
            <tbody>
              {active.map((k) => (
                <tr key={k.id}>
                  <td className="font-medium text-white text-white">
                    {k.name}
                  </td>
                  <td>
                    <code className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs bg-white/[0.08]">
                      bok_live_{k.prefix}…{k.suffix}
                    </code>
                  </td>
                  <td className="text-xs text-white/50 text-white/50">
                    {new Date(k.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="text-xs text-white/50 text-white/50">
                    {k.last_used_at
                      ? new Date(k.last_used_at).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => setRevoking(k)}
                      aria-label="Revogar chave"
                      title="Revogar"
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

      {/* Modal: criar */}
      <Modal
        open={creating}
        onClose={() => !busy && setCreating(false)}
        title="Gerar nova chave de API"
        description="Dê um nome pra identificar essa chave."
        size="sm"
      >
        <form onSubmit={create} className="space-y-4">
          <div>
            <label htmlFor="keyName" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
              Nome
            </label>
            <Input
              id="keyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Integração Stripe Zap"
              maxLength={80}
              required
            />
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

      {/* Modal: mostra a chave 1x */}
      {newKey && (
        <Modal
          open
          onClose={() => setNewKey(null)}
          title="Sua chave de API"
          description="Copie agora. Esta chave não será exibida novamente."
          size="md"
          footer={
            <Button onClick={() => setNewKey(null)}>Fechar</Button>
          }
        >
          <div className="space-y-3">
            <p className="rounded-lg border border-amber-200 bg-white/[0.05] px-3 py-2 text-xs text-amber-800 border-amber-500/30 bg-white/[0.10]/10 text-amber-300">
              ⚠️ Esta é a única vez que a chave aparece por completo. Guarde em local seguro.
            </p>
            <button
              type="button"
              onClick={() => copy(newKey, 'Chave')}
              className="group flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white px-3 py-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/50 border-white/[0.14] bg-ink-900 hover:bg-white/[0.08]"
            >
              <code className="flex-1 break-all font-mono text-[11px] text-white/70 text-white/80">
                {newKey}
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
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={revoke}
        title="Revogar chave"
        description={`Chaves revogadas não podem ser usadas. A integração que depender dessa chave vai parar de funcionar imediatamente. Esta ação não pode ser desfeita.`}
        confirmLabel="Revogar"
        tone="danger"
      />
    </section>
  )
}