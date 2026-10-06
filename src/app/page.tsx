import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/queries'

/** Raiz encaminha para o destino certo conforme a sessão. */
export default async function RootPage() {
  const user = await getCurrentUser()
  redirect(user ? '/dashboard' : '/login')
}