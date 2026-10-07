'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/format'
import type { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

export function ProfileForm({
  profile,
  email,
  createdAt,
}: {
  profile: Profile | null
  email: string
  createdAt: string
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [form, setForm] = React.useState({
    fullName: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    document: profile?.document ?? '',
  })
  const [saving, setSaving] = React.useState(false)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.fullName.trim(),
        phone: form.phone.trim() || null,
        document: form.document.trim() || null,
      })
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')

    if (error) {
      toast({ title: 'Não foi possível salvar', description: error.message, tone: 'error' })
    } else {
      toast({ title: 'Perfil atualizado' })
      router.refresh()
    }

    setSaving(false)
  }

  return (
    <div className="surface p-6">
      <h2 className="text-base font-semibold text-white text-white">Dados pessoais</h2>
      <p className="mt-1.5 text-sm text-white/50 text-white/50">
        Estas informações aparecem nos seus comprovantes.
      </p>

      <form onSubmit={save} className="mt-6 space-y-4">
        <Input
          label="Nome"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />

        {/* O e-mail é a identidade de login; alterar exige fluxo de verificação. */}
        <Input label="E-mail" value={email} disabled icon={<Mail />} />

        <Input
          label="Telefone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(11) 99999-9999"
          hint="Opcional."
        />

        <Input
          label="CPF/CNPJ"
          value={form.document}
          onChange={(e) => setForm({ ...form, document: e.target.value })}
          placeholder="000.000.000-00"
          hint="Necessário para emitir cobranças em seu nome."
        />

        <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-5 border-white/[0.08]">
          <p className="text-xs text-white/50 text-white/50">
            Conta criada em {formatDate(createdAt)}
          </p>
          <Button type="submit" loading={saving}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}