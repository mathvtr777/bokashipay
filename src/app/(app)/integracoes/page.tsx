import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/app-shell'
import { UtmfyIntegration } from '@/components/integracoes/utmfy-integration'
import * as Icons from '@/components/ui/icons'
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
        description="Conecte seus serviços de rastreamento, automação e expanda via API."
      />

      <Link
        href="/integracoes/api"
        className="surface flex items-center justify-between gap-4 p-5 transition-colors hover:bg-white/[0.04] hover:bg-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 bg-brand-500/10 text-brand-400">
            <Icons.Barcode />
          </span>
          <div>
            <p className="font-medium text-white text-white">API & Webhooks</p>
            <p className="text-xs text-white/50 text-white/50">
              Gere API keys e cadastre webhooks de saída
            </p>
          </div>
        </div>
        <Icons.ArrowRight className="h-4 w-4 text-white/50" />
      </Link>

      <UtmfyIntegration
        integration={integration}
        events={events}
        webhookUrl={`${proto}://${host}/api/webhooks/utmfy`}
        serverConfigured={client.isConfigured()}
      />
    </div>
  )
}