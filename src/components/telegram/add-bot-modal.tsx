'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Bot } from '@/components/ui/icons'

interface AddBotModalProps {
  open: boolean
  onClose: () => void
}

export function AddBotModal({ open, onClose }: AddBotModalProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [token, setToken] = React.useState('')
  const [name, setName] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // Limpa o form quando o modal fecha.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setToken('')
        setName('')
      }, 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedToken = token.trim()
    if (!trimmedToken) {
      toast({ title: 'Informe o token do bot', description: 'Cole o token do @BotFather.', tone: 'error' })
      return
    }
    if (trimmedToken.length < 20) {
      toast({ title: 'Token muito curto', description: 'Tokens do Telegram têm pelo menos 20 caracteres.', tone: 'error' })
      return
    }

    setLoading(true)
    const res = await fetch('/api/telegram/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: trimmedToken, name: name.trim() || undefined }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast({ title: 'Erro ao conectar bot', description: data.error ?? 'Tente novamente.', tone: 'error' })
    } else {
      toast({ title: 'Bot conectado com sucesso!', description: 'Agora você pode criar fluxos para ele.' })
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
      title="Conectar Bot do Telegram"
      description="Cole o token do seu bot do Telegram. Encontre-o no @BotFather com /newbot ou /token."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Cole o token do bot"
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
            maxLength={120}
          />
          <p className="mt-1.5 text-xs text-white/40">
            Cole o token gerado pelo @BotFather
          </p>
        </div>
        <Input
          label="Nome (opcional)"
          placeholder="Ex: Bot de Vendas"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Conectar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
