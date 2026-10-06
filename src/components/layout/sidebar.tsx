'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ADMIN_ITEMS, FOOTER_ITEMS, NAV_ITEMS, isActive } from '@/lib/nav'
import { createClient } from '@/lib/supabase/client'
import { LogoLockup } from '@/components/ui/logo'
import { Logout, X } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

/**
 * Sidebar única para os três breakpoints:
 *  - desktop (lg+): fixa, 260px, sempre visível
 *  - tablet (md):   ícones apenas, 76px, com tooltip
 *  - mobile (<md):  drawer deslizante, aberto pelo hamburger do header
 */
export function Sidebar({
  open,
  onClose,
  user,
  isAdmin,
}: {
  open: boolean
  onClose: () => void
  user: { name: string; email: string } | null
  isAdmin: boolean
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
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({ title: 'Não foi possível sair', description: error.message, tone: 'error' })
      setSigningOut(false)
      return
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Backdrop, só no mobile. */}
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-ink-950/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Navegação principal"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-ink-200 bg-white transition-transform duration-300 ease-premium dark:border-ink-800 dark:bg-ink-900',
          // mobile: drawer; md: ícones; lg: largura cheia
          'w-[264px] md:w-[76px] lg:w-[264px]',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Topo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-100 px-5 dark:border-ink-800 md:justify-center md:px-0 lg:justify-start lg:px-5">
          <Link href="/dashboard" className="hidden md:block lg:hidden" aria-label="BokashiPay">
            <LogoLockup />
          </Link>
          <Link href="/dashboard" className="md:hidden" aria-label="BokashiPay">
            <LogoLockup />
          </Link>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu principal */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 md:px-2.5">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href, pathname)
              const IconComponent = item.icon

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.label}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-premium',
                      'md:justify-center md:px-0 lg:justify-start lg:px-3',
                      active
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white',
                    )}
                  >
                    {/* Marca de ativo, alinhada à esquerda na versão cheia. */}
                    <span
                      className={cn(
                        'absolute left-0 h-5 w-1 rounded-r-full bg-brand-600 transition-all duration-200',
                        active ? 'opacity-100' : 'opacity-0',
                        'md:hidden lg:block',
                      )}
                      aria-hidden="true"
                    />
                    <IconComponent
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        active ? 'text-brand-600 dark:text-brand-400' : '',
                      )}
                    />
                    <span className="truncate md:hidden lg:inline">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Área administrativa — só para você. */}
        {isAdmin && (
          <div className="shrink-0 border-t border-ink-100 p-3 dark:border-ink-800 md:px-2.5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 md:px-0 md:text-center lg:px-3 lg:text-left">
              Admin
            </p>
            <ul className="space-y-1">
              {ADMIN_ITEMS.map((item) => {
                const active = isActive(item.href, pathname)
                const IconComponent = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        'md:justify-center md:px-0 lg:justify-start lg:px-3',
                        active
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white',
                      )}
                    >
                      <IconComponent className="h-[18px] w-[18px] shrink-0" />
                      <span className="truncate md:hidden lg:inline">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Rodapé: Ajuda / Perfil / Sair, visualmente separado do menu. */}
        <div className="shrink-0 border-t border-ink-100 p-3 dark:border-ink-800 md:px-2.5">
          <ul className="space-y-1">
            {FOOTER_ITEMS.map((item) => {
              const active = isActive(item.href, pathname)
              const IconComponent = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.label}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      'md:justify-center md:px-0 lg:justify-start lg:px-3',
                      active
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white',
                    )}
                  >
                    <IconComponent className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate md:hidden lg:inline">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          <button
            onClick={signOut}
            disabled={signingOut}
            title="Sair"
            className={cn(
              'mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition-all duration-200',
              'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400',
              'disabled:opacity-50',
              'md:justify-center md:px-0 lg:justify-start lg:px-3',
            )}
          >
            <Logout className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate md:hidden lg:inline">
              {signingOut ? 'Saindo…' : 'Sair'}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}