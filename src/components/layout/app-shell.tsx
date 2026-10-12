'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { firstName } from '@/lib/format'
import { Sidebar } from './sidebar'
import { GlobalSearch, MobileMenuButton, NotificationBell } from './header'

/**
 * Shell autenticado — visual cyberpunk futurista.
 * Sidebar glassmorphism + header com glass blur.
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
  const closeMenu = React.useCallback(() => setMenuOpen(false), [])

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        open={menuOpen}
        onClose={closeMenu}
        user={user}
        isAdmin={isAdmin}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 glass-panel border-b border-surface-border px-6 flex items-center justify-between z-20">
          {/* Search Input */}
          <div className="flex items-center w-80 relative">
            <svg className="w-4 h-4 text-cyber-purple/60 absolute left-3 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              className="w-full bg-surface-elevated/70 border border-cyber-purple/20 text-xs rounded-lg pl-9 pr-12 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-violet focus:ring-1 focus:ring-cyber-violet transition-all"
              placeholder="Buscar vendas, clientes, pix..."
              type="text"
            />
            <span className="absolute right-2.5 top-2 text-[9px] font-mono text-slate-500 border border-cyber-purple/30 px-1.5 py-0.5 rounded bg-deep/60">⌘K</span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <div className="relative">
              <button className="w-9 h-9 rounded-lg bg-white/5 border border-cyber-purple/20 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyber-purple/40 transition">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-purple rounded-full text-[9px] font-mono font-bold flex items-center justify-center text-white border-2 border-deep shadow-neon-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            {/* User Profile */}
            <Link
              href="/perfil"
              className="flex items-center gap-3 pl-2 border-l border-cyber-purple/20"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyber-purple to-cyber-indigo p-[1px] shadow-neon-sm">
                <div className="w-full h-full bg-deep rounded-[11px] flex items-center justify-center font-bold text-xs text-cyber-violet">
                  {firstName(user.name)[0]?.toUpperCase()}
                </div>
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white tracking-wide">{firstName(user.name)}</span>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight">{user.email}</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}

/** Cabeçalho padrão das páginas internas — estilo cyberpunk. */
export function PageHeader({
  title,
  description,
  actions,
  icon,
  className,
}: {
  title: React.ReactNode
  description?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyber-purple/10 text-cyber-violet border border-cyber-purple/20">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm text-slate-400">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}
