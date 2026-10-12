'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface NewFlowModalProps {
  open: boolean
  onClose: () => void
  bots?: { id: string; name: string }[]
  selectedBotId?: string | null
}

interface TemplateStep {
  type: 'send_message' | 'send_buttons' | 'generate_pix'
  text?: string
  buttons?: { text: string; data: string }[]
  description?: string
}

export function NewFlowModal({ open, onClose, bots = [], selectedBotId }: NewFlowModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [botId, setBotId] = React.useState<string>('')
  const [triggerType, setTriggerType] = React.useState('keyword')
  const [triggerValue, setTriggerValue] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // Quando selectedBotId vem de um template, já preenche.
  React.useEffect(() => {
    if (selectedBotId) setBotId(selectedBotId)
  }, [selectedBotId])

  // Limpa o form quando o modal fecha.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setName('')
        setDescription('')
        setBotId('')
        setTriggerType('keyword')
        setTriggerValue('')
      }, 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const trimmed = name.trim()
  const valid = trimmed.length >= 3

  const handleSubmit = async (e: React.FormEvent, steps?: TemplateStep[]) => {
    e.preventDefault()
    if (!valid) {
      toast({ title: 'Nome muito curto', description: 'Use pelo menos 3 caracteres.', tone: 'error' })
      return
    }

    setLoading(true)
    const body: Record<string, unknown> = {
      name: trimmed,
      description: description.trim() || undefined,
      trigger_type: triggerType,
      trigger_value: triggerValue.trim() || undefined,
    }
    if (botId) body.bot_id = botId
    if (steps) body.steps = steps

    const res = await fetch('/api/telegram/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      toast({ title: 'Erro ao criar fluxo', description: data.error ?? 'Tente novamente.', tone: 'error' })
    } else {
      toast({ title: 'Fluxo criado!', description: 'Você pode ativá-lo na lista.' })
      router.refresh()
      onClose()
    }
    setLoading(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Novo fluxo"
      description="Configure os detalhes básicos. O editor visual será adicionado em breve."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do fluxo"
          placeholder="Ex: Funil principal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={80}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">
            Descrição <span className="text-white/40">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para que serve esse fluxo?"
            rows={2}
            maxLength={280}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white transition-all duration-200 placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>

        {bots.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">
              Bot <span className="text-white/40">(opcional)</span>
            </label>
            <select
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            >
              <option value="">Nenhum</option>
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">Gatilho</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            >
              <option value="keyword">Palavra-chave</option>
              <option value="command">Comando (/)</option>
            </select>
          </div>
          <Input
            label="Valor"
            placeholder={triggerType === 'command' ? 'pix' : 'ajuda'}
            value={triggerValue}
            onChange={(e) => setTriggerValue(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valid} loading={loading}>
            Criar fluxo
          </Button>
        </div>
      </form>
    </Modal>
  )
}
