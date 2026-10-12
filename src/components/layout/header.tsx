'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/format'
import type { Notification } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

const TYPE_DOT: Record<string, string> = {
  payment: 'bg-white',
  pix: 'bg-cyber-violet',
  withdrawal: 'bg-white/50',
  sale: 'bg-cyber-neon',
  error: 'bg-red-400',
  info: 'bg-white/30',
}

/**
 * Sino de notificações cyberpunk com Realtime.
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
        className="relative rounded-lg p-2 text-slate-300 transition-all duration-200 hover:bg-white/5 hover:text-white hover:border-cyber-purple/40 border border-cyber-purple/20 bg-white/5"
      >
        <svg className="h-[19px] w-[19px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-purple rounded-full text-[9px] font-mono font-bold flex items-center justify-center text-white border-2 border-deep shadow-neon-sm">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[340px] animate-slide-up overflow-hidden rounded-2xl border border-cyber-purple/20 bg-surface-card shadow-neon-md"
        >
          <div className="flex items-center justify-between border-b border-cyber-purple/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notificações</h3>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-cyber-violet transition-colors hover:text-white"
              >
                <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-10 rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">
                Nenhuma notificação por aqui.
              </p>
            ) : (
              <ul className="divide-y divide-cyber-purple/10">
                {items.map((item) => {
                  const body = (
                    <div
                      className={cn(
                        'flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]',
                        !item.read && 'bg-cyber-purple/8',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          TYPE_DOT[item.type] ?? TYPE_DOT.info,
                          !item.read && 'shadow-[0_0_8px_currentColor]',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm text-slate-200',
                            !item.read && 'font-medium text-white',
                          )}
                        >
                          {item.title}
                        </p>
                        {item.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                            {item.body}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">{formatRelative(item.created_at)}</p>
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
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple/60">
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar vendas, clientes…"
        aria-label="Buscar"
        className="h-9 w-64 rounded-xl border border-cyber-purple/20 bg-surface-elevated/70 pl-9 pr-12 text-sm text-slate-200 transition-all duration-200 placeholder:text-slate-500 focus:border-cyber-violet focus:outline-none focus:ring-1 focus:ring-cyber-violet lg:w-80"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-cyber-purple/30 bg-deep/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 lg:block">
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
      className="rounded-lg p-2 text-slate-300 transition-all hover:bg-white/5 hover:text-white border border-cyber-purple/20 bg-white/5"
    >
      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
      </svg>
    </button>
  )
}