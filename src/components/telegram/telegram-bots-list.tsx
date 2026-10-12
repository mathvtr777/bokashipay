'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Bot, CheckCircle, Trash, Edit, Activity, AlertTriangle } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { TelegramBot } from '@/lib/types'

interface TelegramBotsListProps {
  bots: TelegramBot[]
}

export function TelegramBotsList({ bots }: TelegramBotsListProps) {
  if (bots.length === 0) return null

  return (
    <div className="surface space-y-3 p-0">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Meus Bots ({bots.length})
        </p>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {bots.map((bot) => (
          <BotRow key={bot.id} bot={bot} />
        ))}
      </div>
    </div>
  )
}

function BotRow({ bot }: { bot: TelegramBot }) {
  const { toast } = useToast()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [testing, setTesting] = React.useState(false)

  const toggleStatus = async () => {
    const newStatus = bot.status === 'active' ? 'inactive' : 'active'
    const res = await fetch(`/api/telegram/bots/${bot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      toast({ title: `Bot ${newStatus === 'active' ? 'ativado' : 'desativado'}` })
      router.refresh()
    } else {
      const data = await res.json()
      toast({ title: 'Erro', description: data.error, tone: 'error' })
    }
    setMenuOpen(false)
  }

  const deleteBot = async () => {
    if (!confirm(`Remover o bot "${bot.name}"? Isso também remove todos os fluxos.`)) return
    setDeleting(true)
    const res = await fetch(`/api/telegram/bots/${bot.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Bot removido' })
      router.refresh()
    } else {
      const data = await res.json()
      toast({ title: 'Erro', description: data.error, tone: 'error' })
    }
    setDeleting(false)
    setMenuOpen(false)
  }

  const testBot = async () => {
    setTesting(true)
    const res = await fetch(`/api/telegram/bots/${bot.id}/test`, { method: 'POST' })
    const data = await res.json()
    if (res.ok && data.ok) {
      toast({
        title: 'Conexão OK',
        description: `Bot: @${data.bot.username}`,
      })
    } else {
      toast({
        title: 'Falha na conexão',
        description: data.error ?? 'Verifique o token e as configurações.',
        tone: 'error',
      })
    }
    setTesting(false)
    setMenuOpen(false)
  }

  const statusColor =
    bot.status === 'active'
      ? 'text-emerald-400'
      : bot.status === 'error'
        ? 'text-red-400'
        : 'text-white/40'

  const statusBg =
    bot.status === 'active'
      ? 'bg-emerald-500/10'
      : bot.status === 'error'
        ? 'bg-red-500/10'
        : 'bg-white/[0.04]'

  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{bot.name}</p>
          <p className="truncate text-xs text-white/40">
            {bot.bot_username ? `@${bot.bot_username}` : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Status badge */}
        <span className={cn('flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', statusColor, statusBg)}>
          {bot.status === 'active' ? (
            <CheckCircle className="h-3 w-3" />
          ) : bot.status === 'error' ? (
            <AlertTriangle className="h-3 w-3" />
          ) : null}
          {bot.status === 'active' ? 'Ativo' : bot.status === 'error' ? 'Erro' : 'Inativo'}
        </span>

        {/* Actions menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((v) => !v)}
            className="h-8 w-8 text-white/40 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </Button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-white/10 bg-[#111] p-1 shadow-xl">
                <MenuItem icon={<Activity className="h-3.5 w-3.5" />} onClick={testBot} loading={testing}>
                  Testar conexão
                </MenuItem>
                <MenuItem icon={<Edit className="h-3.5 w-3.5" />} onClick={toggleStatus}>
                  {bot.status === 'active' ? 'Desativar' : 'Ativar'}
                </MenuItem>
                <div className="my-1 h-px bg-white/[0.06]" />
                <MenuItem
                  icon={<Trash className="h-3.5 w-3.5" />}
                  onClick={deleteBot}
                  loading={deleting}
                  danger
                >
                  Remover
                </MenuItem>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuItem({
  icon,
  onClick,
  loading,
  danger,
  children,
}: {
  icon: React.ReactNode
  onClick: () => void
  loading?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors',
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/80 hover:bg-white/5 hover:text-white',
        loading && 'opacity-50',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
