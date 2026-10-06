import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { getCurrentUser, getProfile, getUnreadCount } from '@/lib/queries'
import { isAdmin } from '@/lib/admin'
import { firstName } from '@/lib/format'

/**
 * Layout de todas as páginas autenticadas.
 *
 * Busca o usuário no servidor e monta o shell. O proxy.ts já redireciona quem
 * não tem sessão, mas verificamos de novo aqui: defense in depth custa pouco e
 * o `getUser()` valida o JWT, não só a presença do cookie.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const [profile, unreadCount, admin] = await Promise.all([
    getProfile(),
    getUnreadCount(),
    isAdmin(),
  ])

  return (
    <AppShell
      user={{
        name: profile?.full_name ?? firstName(user.email) ?? 'BokashiPay',
        email: user.email ?? '',
      }}
      unreadCount={unreadCount}
      isAdmin={admin}
    >
      {children}
    </AppShell>
  )
}