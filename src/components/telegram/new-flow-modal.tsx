'use client'

import * as React from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

/**
 * Modal "Novo fluxo" — disparado pelo botão "Criar Fluxo" na aba
 * Fluxos de /telegram. Pede nome e descrição opcional, e "Cria e abre
 * o editor" (placeholder por enquanto — o editor visual será feito em
 * outro passo).
 */
export function NewFlowModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (flow: { name: string; description: string }) => void
}) {
  const { toast } = useToast()
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')

  // Limpa o form quando o modal fecha.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setName('')
        setDescription('')
      }, 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const trimmed = name.trim()
  const valid = trimmed.length >= 3

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) {
      toast({ title: 'Nome muito curto', description: 'Use pelo menos 3 caracteres.', tone: 'error' })
      return
    }
    onCreated?.({ name: trimmed, description: description.trim() })
    toast({
      title: 'Fluxo criado',
      description: 'O editor visual será habilitado em breve.',
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Novo fluxo"
      description="Configure os detalhes básicos. Você poderá editar tudo no editor depois."
    >
      <form onSubmit={create} className="space-y-4">
        <Input
          label="Nome"
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
            rows={4}
            maxLength={280}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white transition-all duration-200 placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valid}>
            Criar e abrir editor
          </Button>
        </div>
      </form>
    </Modal>
  )
}