import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { UtmfyIntegration } from '@/components/integracoes/utmfy-integration'
import { getIntegration, getIntegrationEvents } from '@/lib/queries'

export const metadata: Metadata = { title: 'Integrações' }

export default async function IntegrationsPage() {
  const [integration, events] = await Promise.all([
    getIntegration('utmfy'),
    getIntegrationEvents(20),
  ])

  // A URL de webhook é montada no servidor: depende do host real da requisição.
  const { headers } = await import('next/headers')
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')

  const { getUtmfyClient } = await import('@/services/utmfy')
  const client = getUtmfyClient()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        description="Conecte seus serviços de rastreamento e automação."
      />

      <UtmfyIntegration
        integration={integration}
        events={events}
        webhookUrl={`${proto}://${host}/api/webhooks/utmfy`}
        serverConfigured={client.isConfigured()}
      />
    </div>
  )
}