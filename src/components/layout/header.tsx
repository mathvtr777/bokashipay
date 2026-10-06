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
  payment: 'bg-emerald-500',
  pix: 'bg-brand-500',
  withdrawal: 'bg-amber-500',
  sale: 'bg-sky-500',
  error: 'bg-red-500',
  info: 'bg-ink-400',
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
        className="relative rounded-xl p-2 text-ink-500 transition-all duration-200 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-white"
      >
        <Bell className="h-[19px] w-[19px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] animate-slide-up overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl dark:border-ink-700 dark:bg-ink-800">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Notificações</h3>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
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
              <p className="px-4 py-10 text-center text-sm text-ink-500 dark:text-ink-400">
                Nenhuma notificação por aqui.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-700">
                {items.map((item) => {
                  const body = (
                    <div
                      className={cn(
                        'flex gap-3 px-4 py-3 transition-colors hover:bg-ink-50 dark:hover:bg-ink-700/50',
                        !item.read && 'bg-brand-50/40 dark:bg-brand-500/5',
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
                            'truncate text-sm text-ink-900 dark:text-ink-50',
                            !item.read && 'font-medium',
                          )}
                        >
                          {item.title}
                        </p>
                        {item.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">
                            {item.body}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-ink-400">{formatRelative(item.created_at)}</p>
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
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
        <Search className="h-4 w-4" />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar vendas, clientes…"
        aria-label="Buscar"
        className="h-9 w-64 rounded-xl border border-ink-200 bg-white pl-9 pr-12 text-sm text-ink-900 transition-all duration-200 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12 lg:w-80 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-ink-200 px-1.5 py-0.5 text-[10px] font-medium text-ink-400 lg:block dark:border-ink-700">
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
      className="rounded-xl p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 md:hidden dark:hover:bg-ink-800 dark:hover:text-white"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}