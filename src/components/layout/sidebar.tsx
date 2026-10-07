'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ADMIN_ITEMS,
  FOOTER_ITEMS,
  NavItem,
  NAV_ITEMS,
  isActive,
} from '@/lib/nav'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import {
  ChevronDown,
  Help,
  Logout,
  Settings,
  User,
  X,
  Zap,
  Gift,
  Bot,
  Sparkles,
  Box,
} from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

/**
 * Sidebar única para os três breakpoints:
 *  - desktop (lg+): fixa, 240px, sempre visível
 *  - tablet (md):   ícones apenas, 76px, com tooltip
 *  - mobile (<md):  drawer deslizante, aberto pelo hamburger do header
 *
 * Estrutura (visual Laranjinha adaptado para o BokashiPay):
 *   [Logo]                                  [fechar no mobile]
 *   [+ Criar novo produto]   (CTA brand-gradient)
 *   Avatar + nome + notificação
 *   ── Menu ─────────────────
 *   Dashboard / Vendas / PIX / Clientes / Financeiro / Saques
 *   ── Automações ───────────
 *   Bot Telegram / Agent IA (em breve) / Produtos & Checkouts / Temas
 *   ── Integrações ──────────
 *   Integrações (link)
 *   ── Configurações ────────
 *   Configurações (link)
 *   ── rodapé ───────────────
 *   Indicação (GANHE R$)
 *   Faturamento (R$ 0 / R$ 10k)
 *   Ajuda / Perfil / Sair
 *
 * Sem toggle de tema: dark é o estado fixo.
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

  // Iniciais para o avatar.
  const initials = (user?.name ?? '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'B'
  const hasUnread = (unreadCount ?? 0) > 0

  return (
    <>
      {/* Backdrop, só no mobile. */}
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Navegação principal"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-ink-900 transition-transform duration-300 ease-premium',
          // mobile: drawer; md: ícones; lg: largura cheia
          'w-[264px] md:w-[76px] lg:w-[264px]',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Topo: Logo + (mobile) botão fechar. */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-5 md:justify-center md:px-0 lg:justify-start lg:px-5">
          <Link href="/dashboard" aria-label="BokashiPay">
            {/* md: só ícone, lg: ícone no tamanho padrão. */}
            <Logo size={32} className="md:!h-8 md:!w-8" />
          </Link>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo scrollável: CTA, avatar, grupos. */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* CTA principal */}
          <div className="px-3 pt-4 md:px-2.5 lg:px-3">
            <Link
              href={primaryActionHref}
              className={cn(
                'group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:brightness-110 active:brightness-95',
                'md:!justify-center md:!gap-0 md:!px-2',
                'lg:justify-start lg:gap-2 lg:px-3.5',
              )}
            >
              <span className="text-base leading-none">＋</span>
              <span className="md:hidden lg:inline">Criar novo produto</span>
            </Link>
          </div>

          {/* Avatar com notificação (somente lg — em md fica só o ícone). */}
          {user && (
            <div className="mt-4 hidden border-y border-white/[0.06] px-3 py-3 lg:block">
              <Link
                href="/perfil"
                className="group relative flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
              >
                <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
                  {initials}
                  {hasUnread && (
                    <span
                      aria-label="Notificações não lidas"
                      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-ink-900"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">
                    {user.name || 'Conta'}
                  </span>
                  <span className="block truncate text-xs text-white/40">{user.email}</span>
                </span>
              </Link>
            </div>
          )}

          {/* Menu */}
          <Section label="Menu" pathname={pathname} items={NAV_ITEMS.slice(0, 6)} />

          {/* Automações — inclui produtos (que é o "Criar novo produto" também). */}
          <Section
            label="Automações"
            pathname={pathname}
            items={[
              { href: '/integracoes', label: 'Bot Telegram', icon: Bot },
              { href: '/integracoes', label: 'Agent IA', icon: Sparkles, badge: 'EM BREVE' },
              { href: '/produtos', label: 'Produtos & Checkouts', icon: Box },
              { href: '/configuracoes', label: 'Temas', icon: Settings, badge: 'NOVO' },
            ]}
          />

          {/* Integrações / Configurações como cabeçalhos com 1 link cada. */}
          <Section
            label="Integrações"
            pathname={pathname}
            items={[{ href: '/integracoes', label: 'Integrações', icon: Zap }]}
          />

          <Section
            label="Configurações"
            pathname={pathname}
            items={[{ href: '/configuracoes', label: 'Configurações', icon: Settings }]}
          />

          {/* Indicação + Faturamento (rodapé promocional). */}
          <div className="mt-4 hidden border-t border-white/[0.06] p-3 lg:block">
            <Link
              href="/configuracoes"
              className="group flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/[0.08] p-3 transition-all hover:border-brand-400/50 hover:bg-brand-500/[0.12]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300">
                <Gift className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                  Indicações
                </span>
                <span className="block text-sm font-semibold text-white">
                  Ganhe R$ indicando amigos
                </span>
              </span>
              <span className="rounded-full bg-brand-500/30 px-2 py-0.5 text-[10px] font-semibold text-brand-200">
                GANHE R$
              </span>
            </Link>

            {/* Linha de faturamento (ranking visual). */}
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-white/40">
                <span>Faturamento</span>
                <span>0% • R$ 0 / R$ 10k</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="brand-gradient h-full w-[2%] rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Área administrativa + rodapé funcional: Ajuda / Perfil / Sair. */}
        <div className="shrink-0 border-t border-white/[0.06] p-3 md:px-2.5">
          {isAdmin && (
            <>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30 md:px-0 md:text-center lg:px-3 lg:text-left">
                Admin
              </p>
              <ul className="space-y-1">
                {ADMIN_ITEMS.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </ul>
            </>
          )}

          <ul className="mt-1 space-y-1">
            {FOOTER_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <li>
              <button
                onClick={signOut}
                disabled={signingOut}
                title="Sair"
                className={cn(
                  'mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-all duration-200',
                  'hover:bg-red-500/10 hover:text-red-300',
                  'disabled:opacity-50',
                  'md:justify-center md:px-0 lg:justify-start lg:px-3',
                )}
              >
                <Logout className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate md:hidden lg:inline">
                  {signingOut ? 'Saindo…' : 'Sair'}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </>
  )
}

/** Cabeçalho de seção da sidebar. md: nada, lg: rótulo. */
function Section({
  label,
  items,
  pathname,
}: {
  label: string
  items: (NavItem & { badge?: string })[]
  pathname: string
}) {
  return (
    <div className="mt-4 px-3 md:px-2.5 lg:px-3">
      <p className="mb-1.5 hidden text-[10px] font-semibold uppercase tracking-widest text-white/30 lg:block">
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <NavLink key={`${label}-${item.href}-${item.label}`} item={item} pathname={pathname} badge={item.badge} />
        ))}
      </ul>
    </div>
  )
}

/** Item de navegação com estado ativo. Badge opcional (ex.: NOVO, EM BREVE). */
function NavLink({
  item,
  pathname,
  badge,
}: {
  item: NavItem
  pathname: string
  badge?: string
}) {
  const active = isActive(item.href, pathname)
  const Icon = item.icon
  return (
    <li>
      <Link
        href={item.href}
        title={item.label}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-premium',
          'md:justify-center md:px-0 lg:justify-start lg:px-3',
          active
            ? 'bg-brand-500/15 text-brand-300'
            : 'text-white/60 hover:bg-white/[0.04] hover:text-white',
        )}
      >
        <span
          className={cn(
            'absolute left-0 h-5 w-1 rounded-r-full bg-brand-500 transition-all duration-200',
            active ? 'opacity-100' : 'opacity-0',
            'md:hidden lg:block',
          )}
          aria-hidden="true"
        />
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors',
            active && 'text-brand-300',
          )}
        />
        <span className="truncate md:hidden lg:inline">{item.label}</span>
        {badge && (
          <span className="ml-auto hidden rounded-full bg-brand-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-200 lg:inline">
            {badge}
          </span>
        )}
      </Link>
    </li>
  )
}