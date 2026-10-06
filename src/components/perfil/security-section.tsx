'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/auth/auth-forms'
import { ConfirmDialog } from '@/components/ui/modal'
import { Devices, Lock, Logout } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

export function SecuritySection() {
  const router = useRouter()
  const { toast } = useToast()

  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)
  const [confirmOthers, setConfirmOthers] = React.useState(false)

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault()

    if (password.length < 8) {
      toast({ title: 'Use ao menos 8 caracteres', tone: 'error' })
      return
    }
    if (password !== confirm) {
      toast({ title: 'As senhas não conferem', tone: 'error' })
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast({ title: 'Não foi possível alterar', description: error.message, tone: 'error' })
    } else {
      toast({ title: 'Senha alterada' })
      setPassword('')
      setConfirm('')
    }

    setSaving(false)
  }

  const signOutOthers = async () => {
    setSigningOut(true)
    const supabase = createClient()

    // scope 'others' revoga os refresh tokens de todas as sessões menos a atual
    // — é o equivalente a "sair de outros dispositivos".
    const { error } = await supabase.auth.signOut({ scope: 'others' })

    if (error) {
      toast({
        title: 'Não foi possível encerrar as sessões',
        description: error.message,
        tone: 'error',
      })
    } else {
      toast({ title: 'Outras sessões encerradas' })
    }

    setSigningOut(false)
    setConfirmOthers(false)
  }

  const signOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-white">
          <Lock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          Segurança
        </h2>

        <form onSubmit={changePassword} className="mt-5 space-y-4">
          <PasswordInput
            label="Nova senha"
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordInput
            label="Confirmar nova senha"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" loading={saving} variant="outline" className="w-full">
            Alterar senha
          </Button>
        </form>
      </div>

      <div className="surface p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-white">
          <Devices className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          Sessões
        </h2>
        <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
          Encerre o acesso em outros dispositivos caso suspeite de algo estranho.
        </p>

        <div className="mt-5 space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setConfirmOthers(true)}
            disabled={signingOut}
          >
            Sair de outros dispositivos
          </Button>
          <Button
            variant="outline"
            className="w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            onClick={signOut}
            disabled={signingOut}
          >
            <Logout className="h-4 w-4" />
            Sair desta conta
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOthers}
        onClose={() => setConfirmOthers(false)}
        onConfirm={signOutOthers}
        tone="primary"
        title="Encerrar outras sessões?"
        description="Todos os outros dispositivos serão desconectados. Você permanece conectado aqui."
        confirmLabel="Encerrar outras"
      />
    </div>
  )
}