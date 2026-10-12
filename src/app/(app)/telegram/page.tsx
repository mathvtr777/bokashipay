import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { TelegramRobosTab } from '@/components/telegram/telegram-robos-tab'
import { TelegramSetupSteps } from '@/components/telegram/telegram-setup-steps'
import { TelegramTabsClient } from '@/components/telegram/telegram-tabs-client'
import { TelegramFluxos } from '@/components/telegram/telegram-fluxos'
import { getTelegramBots, getTelegramBotStats, getTelegramFlows } from '@/lib/queries'
import { Briefcase } from '@/components/ui/icons'

export const metadata: Metadata = { title: 'Telegram' }

export default async function TelegramPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const params = await searchParams
  const aba = (params.aba === 'fluxos' ? 'fluxos' : 'robos') as 'robos' | 'fluxos'

  // Busca em paralelo bots (para aba "robos") e fluxos (para aba "fluxos").
  const [bots, stats, flows] = await Promise.all([
    getTelegramBots(),
    getTelegramBotStats(),
    getTelegramFlows(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Briefcase className="h-[18px] w-[18px]" />}
        title="Telegram"
        description="Seus bots, fluxos e analytics — tudo em um só lugar."
      />

      <TelegramTabsClient initial={aba} />

      {aba === 'robos' ? (
        <>
          <TelegramRobosTab stats={stats} bots={bots} />
          {bots.length === 0 && <TelegramSetupSteps />}
        </>
      ) : (
        <TelegramFluxos flows={flows} bots={bots.map((b) => ({ id: b.id, name: b.name }))} />
      )}
    </div>
  )
}
