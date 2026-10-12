'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { firstName } from '@/lib/format'
import {
  ADMIN_ITEMS,
  FOOTER_ITEMS,
} from '@/lib/nav'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

/**
 * Sidebar cyberpunk futurista com glassmorphism.
 * Menu com neon roxo e gradientes vibrantes.
 */
export function Sidebar({
  open,
  onClose,
  user,
  isAdmin,
  unreadCount,
  primaryActionHref = '/pix',
}: {
  open: boolean
  onClose: () => void
  user: { name: string; email: string } | null
  isAdmin: boolean
  unreadCount?: number
  primaryActionHref?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [signingOut, setSigningOut] = React.useState(false)

  // Fecha o drawer ao navegar no mobile.
  React.useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Bloqueia o scroll do body enquanto o drawer estiver aberto no mobile.
  React.useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const signOut = async () => {
    setSigningOut(true)
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        toast({
          title: 'Não foi possível sair',
          description: body.error ?? 'Tente novamente.',
          tone: 'error',
        })
        setSigningOut(false)
        return
      }
      router.push('/login')
      router.refresh()
    } catch (err) {
      toast({
        title: 'Não foi possível sair',
        description: err instanceof Error ? err.message : 'Erro de rede.',
        tone: 'error',
      })
      setSigningOut(false)
    }
  }

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Navegação principal"
        className={cn(
          'glass-panel border-r border-surface-border flex flex-col justify-between z-30 transition-all duration-300',
          'fixed inset-y-0 left-0 w-64',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Top Section */}
        <div className="p-5 flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyber-purple via-cyber-indigo to-pink-500 p-[1.5px] shadow-neon-sm flex items-center justify-center">
              <div className="w-full h-full bg-deep rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-cyber-violet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg font-bold tracking-wider text-white">Bokashi<span className="text-cyber-neon">Pay</span></span>
              <span className="text-[9px] uppercase tracking-widest text-cyber-purple/70 font-mono -mt-1">Quantum Gateway</span>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href={primaryActionHref}
            className="w-full relative group overflow-hidden rounded-xl p-[1px] focus:outline-none transition-all duration-300 hover:shadow-neon-md mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple via-fuchsia-500 to-cyber-indigo rounded-xl transition-all duration-300 group-hover:opacity-90"></div>
            <div className="relative px-4 py-2.5 rounded-[11px] bg-gradient-to-r from-deep/80 to-surface-elevated/80 backdrop-blur-md flex items-center justify-center gap-2 text-white font-medium text-xs tracking-wide">
              <svg className="w-4 h-4 text-cyber-violet group-hover:rotate-90 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>+ Criar novo produto</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1 -mr-2">
            {/* Core Menu */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 block mb-2 font-mono">Geral</span>
              <ul className="space-y-1">
                {MAIN_NAV.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </ul>
            </div>

            {/* Automations */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 block mb-2 font-mono">Automações</span>
              <ul className="space-y-1">
                {AUTOMATION_NAV.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} badge={item.badge} />
                ))}
              </ul>
            </div>

            {/* Integration */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 block mb-2 font-mono">Integração</span>
              <ul className="space-y-1">
                {INTEGRATION_NAV.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </ul>
            </div>

            {/* Referral Card */}
            <div className="pt-2">
              <div className="rounded-xl p-3 bg-gradient-to-b from-cyber-purple/10 to-surface-card border border-cyber-purple/20 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-cyber-purple/20 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-cyber-neon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                  </svg>
                  <span className="text-xs font-semibold text-cyber-violet">Indique & Ganhe</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mb-2.5">Ganhe até 0.5% de todas transações de amigos convidados.</p>
                <button className="w-full py-1.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-cyber-purple/30 hover:bg-cyber-purple/50 border border-cyber-purple/40 text-cyber-violet transition-all">
                  CONVIDAR
                </button>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="pt-4 border-t border-cyber-purple/20 mt-2 space-y-1">
            <a className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-400 hover:text-white transition" href="#">
              <svg className="w-3.5 h-3.5 text-cyber-purple/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
              </svg>
              <span>Apoio e Suporte</span>
            </a>
            <a className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-400 hover:text-white transition" href="#">
              <svg className="w-3.5 h-3.5 text-cyber-purple/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
              </svg>
              <span>Ajuda & Docs</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}

/** NavLink cyberpunk com glow roxo */
function NavLink({
  item,
  pathname,
  badge,
}: {
  item: NavItem & { badge?: string }
  pathname: string
  badge?: string
}) {
  const active = isActive(item, pathname)

  // Dynamic icon based on item href
  const IconComponent = getIcon(item.href)

  return (
    <li>
      <Link
        href={item.href}
        title={item.label}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          active
            ? 'bg-gradient-to-r from-cyber-purple/30 to-cyber-purple/10 text-cyber-violet border-l-2 border-cyber-violet shadow-sm'
            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
        )}
      >
        <span className={cn('w-4 h-4', active ? 'text-cyber-violet' : 'text-slate-400')}>
          {IconComponent}
        </span>
        <span className="truncate">{item.label}</span>
        {badge && (
          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyber-purple/20 text-cyber-violet border border-cyber-purple/30">
            {badge}
          </span>
        )}
        {item.href === '/telegram' && (
          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            EM BREVE
          </span>
        )}
      </Link>
    </li>
  )
}

function getIcon(href: string) {
  switch (href) {
    case '/dashboard':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    case '/transacoes':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="7" x2="17" y2="17"/><line x1="21" y1="7" x2="21" y2="17"/><line x1="3" y1="7" x2="3" y2="17"/><path d="m21 7-9 9-9-9"/></svg>
    case '/vendas':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
    case '/clientes':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case '/financeiro':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    case '/saques':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    case '/produtos':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    case '/telegram':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 9 15"/><path d="M12 3H3v18h18V12h-7"/><path d="m9 9 1.5 3.5L14 10l3.5 6.5"/></svg>
    case '/apps-ia':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
    case '/integracoes':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    case '/webhooks':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    case '/configuracoes':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
    case '/ajuda':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
    case '/perfil':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case '/chaves':
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
    default:
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  }
}

// Navigation arrays
const MAIN_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/transacoes', label: 'Transações' },
  { href: '/vendas', label: 'Vendas' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/financeiro', label: 'Financeiro' },
  { href: '/saques', label: 'Pay-outs' },
  { href: '/produtos', label: 'Produtos' },
]

const AUTOMATION_NAV = [
  { href: '/telegram', label: 'Bot Telegram' },
  { href: '/apps-ia', label: 'Apps IA', badge: 'NOVO' },
  { href: '/produtos', label: 'Produtos & Checkouts' },
  { href: '/taxas', label: 'Taxas', badge: 'PROMO' },
]

const INTEGRATION_NAV = [
  { href: '/webhooks', label: 'Integração Webhook' },
  { href: '/configuracoes', label: 'Configurações' },
]

// Extend NavItem type locally
type NavItem = {
  href: string
  label: string
  badge?: string
}

function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/'
  }
  return pathname.startsWith(item.href)
}
