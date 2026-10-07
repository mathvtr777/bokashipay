'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { firstName } from '@/lib/format'
import { Sidebar } from './sidebar'
import { GlobalSearch, MobileMenuButton, NotificationBell } from './header'
import { LogoLockup } from '@/components/ui/logo'

/**
 * Shell autenticado. Monta sidebar + header e centraliza o conteúdo.
 *
 * O conteúdo vem pronto do servidor (dados reais lidos via RLS) — os componentes
 * interativos dentro dele são client components, o shell em si não precisa ser.
 */
export function AppShell({
  user,
  unreadCount,
  isAdmin,
  children,
}: {
  user: { name: string; email: string }
  unreadCount: number
  isAdmin: boolean
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  // Estável — sem isso, o `useEffect` da Sidebar (que fecha o drawer ao
  // navegar) dispara em todo render, e a sidebar nunca chega a abrir.
  const closeMenu = React.useCallback(() => setMenuOpen(false), [])

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar open={menuOpen} onClose={closeMenu} user={user} isAdmin={isAdmin} />

      <div className="md:pl-[76px] lg:pl-[264px]">
        <header className="sticky top-0 z-30 h-16 border-b border-ink-200 bg-white/80 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/80">
          <div className="flex h-full items-center gap-3 px-4 sm:px-6">
            <MobileMenuButton onClick={() => setMenuOpen(true)} />

            {/* Marca em todos os tamanhos: no tablet/desktop reforça a identidade
                que também aparece na sidebar; no mobile substitui o texto solto. */}
            <Link href="/dashboard" aria-label="BokashiPay">
              <LogoLockup />
            </Link>

            <div className="flex-1">
              <GlobalSearch />
            </div>

            <div className="flex items-center gap-1">
              <NotificationBell initialCount={unreadCount} />

              <Link
                href="/perfil"
                className="ml-1 flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <Avatar name={user.name} />
                <span className="hidden text-left lg:block">
                  <span className="block text-sm font-medium leading-tight text-ink-900 dark:text-ink-50">
                    {firstName(user.name)}
                  </span>
                  <span className="block text-xs leading-tight text-ink-500 dark:text-ink-400">
                    {user.email}
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <span className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white">
      {initials || 'B'}
    </span>
  )
}

/** Cabeçalho padrão das páginas internas. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}