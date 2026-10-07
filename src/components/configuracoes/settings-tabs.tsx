'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { IntegrationSafe, Settings } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bell, Integrations, Shield, Sun, User } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

const TABS = [
  { key: 'notificacoes', label: 'Notificações', icon: Bell },
  { key: 'conta', label: 'Conta', icon: User },
  { key: 'integracoes', label: 'Integrações', icon: Integrations },
  { key: 'aparencia', label: 'Aparência', icon: Sun },
  { key: 'seguranca', label: 'Segurança', icon: Shield },
] as const

type TabKey = (typeof TABS)[number]['key']

export function SettingsTabs({
  settings,
  integration,
}: {
  settings: Settings | null
  integration: IntegrationSafe | null
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [tab, setTab] = React.useState<TabKey>('notificacoes')
  const [saving, setSaving] = React.useState(false)

  const [prefs, setPrefs] = React.useState({
    notify_payment: settings?.notify_payment ?? true,
    notify_pix: settings?.notify_pix ?? true,
    notify_withdrawal: settings?.notify_withdrawal ?? true,
    notify_sale: settings?.notify_sale ?? true,
    notify_email: settings?.notify_email ?? true,
  })

  const toggle = (key: keyof typeof prefs) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setPrefs({ ...prefs, [key]: event.target.checked })

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      return
    }

    // upsert: a linha de settings pode não existir ainda.
    const { error } = await supabase.from('settings').upsert(
      { ...prefs, user_id: user.id },
      { onConflict: 'user_id' },
    )

    if (error) {
      toast({ title: 'Não foi possível salvar', description: error.message, tone: 'error' })
    } else {
      toast({ title: 'Preferências salvas' })
    }

    setSaving(false)
    router.refresh()
  }

  return (
    <div className="surface overflow-hidden">
      {/* Navegação das seções */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] p-2 border-white/[0.08]">
        {TABS.map((item) => {
          const IconComponent = item.icon
          const active = tab === item.key
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-brand-50 text-brand-700 bg-brand-500/10 text-brand-300'
                  : 'text-white/60 hover:bg-white/[0.04] text-white/50 hover:bg-white/[0.08]',
              )}
            >
              <IconComponent className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="p-6">
        {tab === 'notificacoes' && (
          <section>
            <h2 className="text-base font-semibold text-white text-white">
              Notificações
            </h2>
            <p className="mt-1.5 text-sm text-white/50 text-white/50">
              Escolha o que quer ser avisado.
            </p>

            <div className="mt-6 space-y-4">
              <Checkbox label="Pagamento aprovado" checked={prefs.notify_payment} onChange={toggle('notify_payment')} />
              <Checkbox label="Novo PIX criado" checked={prefs.notify_pix} onChange={toggle('notify_pix')} />
              <Checkbox label="Saque solicitado ou concluído" checked={prefs.notify_withdrawal} onChange={toggle('notify_withdrawal')} />
              <Checkbox label="Nova venda recebida" checked={prefs.notify_sale} onChange={toggle('notify_sale')} />
              <Checkbox label="Enviar também por e-mail" checked={prefs.notify_email} onChange={toggle('notify_email')} />
            </div>

            <div className="mt-6 border-t border-white/[0.06] pt-5 border-white/[0.08]">
              <Button onClick={save} loading={saving}>
                Salvar preferências
              </Button>
            </div>
          </section>
        )}

        {tab === 'conta' && (
          <section>
            <h2 className="text-base font-semibold text-white text-white">Conta</h2>
            <p className="mt-1.5 text-sm text-white/50 text-white/50">
              Dados de identificação do seu negócio. Nome, e-mail e documento ficam na aba Perfil.
            </p>
            <p className="mt-5 text-sm text-white/50 text-white/50">
              Razão social e dados de faturamento serão exibidos aqui quando forem configurados.
            </p>
          </section>
        )}

        {tab === 'integracoes' && (
          <section>
            <h2 className="text-base font-semibold text-white text-white">Integrações</h2>
            <p className="mt-1.5 text-sm text-white/50 text-white/50">
              Serviços conectados à sua conta.
            </p>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] p-4 border-white/[0.14]">
              <div className="flex items-center gap-3">
                <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white">
                  U
                </span>
                <div>
                  <p className="text-sm font-semibold text-white text-white">UTMFY</p>
                  <p className="text-xs text-white/50 text-white/50">
                    Rastreamento de vendas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={integration?.connected ? 'positive' : 'neutral'} dot>
                  {integration?.connected ? 'Conectado' : 'Desconectado'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/integracoes')}
                >
                  Gerenciar
                </Button>
              </div>
            </div>
          </section>
        )}

        {tab === 'aparencia' && (
          <section>
            <h2 className="text-base font-semibold text-white text-white">Aparência</h2>
            <p className="mt-1.5 text-sm text-white/50 text-white/50">
              O tema segue o seu sistema por padrão.
            </p>
            <div className="mt-6 flex gap-3">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => {
                    document.documentElement.classList.toggle('dark', theme === 'dark')
                    toast({
                      title: `Tema ${theme === 'light' ? 'claro' : theme === 'dark' ? 'escuro' : 'do sistema'} aplicado`,
                      description: 'A preferência é salva nas configurações do sistema.',
                      tone: 'info',
                    })
                  }}
                  className="rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-white/70 transition-all hover:border-brand-300 hover:bg-brand-50/40 border-white/[0.14] text-white/80 hover:border-brand-700"
                >
                  {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === 'seguranca' && (
          <section>
            <h2 className="text-base font-semibold text-white text-white">Segurança</h2>
            <p className="mt-1.5 text-sm text-white/50 text-white/50">
              Senha, sessões e dispositivos conectados ficam na aba Perfil.
            </p>
            <Button variant="outline" className="mt-5" onClick={() => router.push('/perfil')}>
              Ir para Segurança
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}