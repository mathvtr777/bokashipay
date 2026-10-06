import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/auth-forms'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  // Suspense porque LoginForm usa useSearchParams().
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}