import * as React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/app-shell'
import { ApiKeysSection } from '@/components/integracoes/api-keys-section'
import { WebhooksSection } from '@/components/integracoes/webhooks-section'
import { getApiKeys, getWebhookEndpoints, getCurrentUser } from '@/lib/queries'

export const metadata: Metadata = { title: 'API & Webhooks' }

export default async function ApiPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [apiKeys, webhooks] = await Promise.all([
    getApiKeys(user.id),
    getWebhookEndpoints(user.id),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="API & Webhooks"
        description="Integre pagamentos PIX no seu SaaS. Use API keys para autenticar e webhooks para receber notificações."
      />
      <ApiKeysSection initialKeys={apiKeys} />
      <WebhooksSection initialWebhooks={webhooks} />
    </div>
  )
}