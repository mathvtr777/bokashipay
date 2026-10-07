'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/format'
import type { Notification } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, Menu, Search } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

const TYPE_DOT: Record<string, string> = {
  payment: 'bg-white',
  pix: 'bg-brand-400',
  withdrawal: 'bg-white/50',
  sale: 'bg-brand-300',
  error: 'bg-red-400',
  info: 'bg-white/30',
}

/**
 * Sino de notificações com Realtime.
 *
 * Assina a tabela `notifications` para o usuário logado; como o RLS filtra o
 * canal por usuário, chega apenas o que pertence a ele. "Marcar todas como
 * lidas" roda direto no browser — é uma escrita no próprio registro do usuário.
 */
export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = React.useState(false)
  const [count, setCount] = React.useState(initialCount)
  const [items, setItems] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  React.useEffect(() => setCount(initialCount), [initialCount])

  const load = React.useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15)
    setItems((data ?? []) as Notification[])
    setLoading(false)
  }, [])

  // Realtime: mantém o sino atualizado sem refresh.
  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setItems((current) => [payload.new as Notification, ...current].slice(0, 15))
          setCount((c) => c + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Fecha ao clicar fora ou apertar Esc.
  React.useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openPanel = async () => {
    const next = !open
    setOpen(next)
    if (next && items.length === 0) await load()
  }

  const markAllRead = async () => {
    const supabase = createClient()
    const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false)
    if (error) {
      toast({ title: 'Falha ao marcar como lidas', description: error.message, tone: 'error' })
      return
    }
    setCount(0)
    setItems((current) => current.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={openPanel}
        aria-label={`Notificações${count > 0 ? ` (${count} não lidas)` : ''}`}
        aria-expanded={open}
        className="relative rounded-xl p-2 text-white/50 transition-all duration-200 hover:bg-white/[0.05] hover:text-white"
      >
        <Bell className="h-[19px] w-[19px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[340px] animate-slide-up overflow-hidden rounded-2xl border border-white/[0.08] bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notificações</h3>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-300 transition-colors hover:text-brand-200"
              >
                <Check className="h-3.5 w-3.5" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-10 rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-white/50">
                Nenhuma notificação por aqui.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {items.map((item) => {
                  const body = (
                    <div
                      className={cn(
                        'flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]',
                        !item.read && 'bg-brand-500/[0.08]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          TYPE_DOT[item.type] ?? TYPE_DOT.info,
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm text-white',
                            !item.read && 'font-medium',
                          )}
                        >
                          {item.title}
                        </p>
                        {item.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-white/50">
                            {item.body}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-white/30">{formatRelative(item.created_at)}</p>
                      </div>
                    </div>
                  )

                  return (
                    <li key={item.id}>
                      {item.link ? (
                        <Link href={item.link} onClick={() => setOpen(false)}>
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Busca global: navegação por atalho "/" e filtro de páginas. */
export function GlobalSearch() {
  const [query, setQuery] = React.useState('')
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA'].includes(target.tagName)
      if (event.key === '/' && !typing) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/vendas?cliente=${encodeURIComponent(trimmed)}`)
    setQuery('')
    inputRef.current?.blur()
  }

  return (
    <form onSubmit={submit} className="relative hidden md:block">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
        <Search className="h-4 w-4" />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar vendas, clientes…"
        aria-label="Buscar"
        className="h-9 w-64 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-12 text-sm text-white transition-all duration-200 placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 lg:w-80"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-white/40 lg:block">
        /
      </kbd>
    </form>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir menu"
      className="rounded-xl p-2 text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white md:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}