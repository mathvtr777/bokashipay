import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/queries'
import LandingPage from '@/components/landing/landing-page'

/**
 * Raiz do site — mostra a landing page para visitantes.
 * Usuários logados são redirecionados para o dashboard.
 */
export default async function RootPage() {
  const user = await getCurrentUser()

  // Se já está logado, vai direto pro dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Visitantes veem a landing page
  return <LandingPage />
}
