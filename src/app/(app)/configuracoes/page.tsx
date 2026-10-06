import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { SettingsTabs } from '@/components/configuracoes/settings-tabs'
import { getIntegration, getSettings } from '@/lib/queries'

export const metadata: Metadata = { title: 'Configurações' }

export default async function SettingsPage() {
  const [settings, integration] = await Promise.all([
    getSettings(),
    getIntegration('utmfy'),
  ])

  return (
    <div>
      <PageHeader title="Configurações" description="Preferências da sua conta." />
      <SettingsTabs settings={settings} integration={integration} />
    </div>
  )
}