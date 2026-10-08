import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { TelegramStatsCard } from '@/components/telegram/telegram-stats'
import { TelegramEmptyState } from '@/components/telegram/telegram-empty-state'
import { TelegramSetupSteps } from '@/components/telegram/telegram-setup-steps'
import { TelegramTabsClient } from '@/components/telegram/telegram-tabs-client'
import { TelegramFluxos } from '@/components/telegram/telegram-fluxos'
import { Briefcase } from '@/components/ui/icons'

export const metadata: Metadata = { title: 'Telegram' }

export default async function TelegramPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const params = await searchParams
  const aba = (params.aba === 'fluxos' ? 'fluxos' : 'robos') as 'robos' | 'fluxos'

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
          <TelegramStatsCard />
          <TelegramEmptyState />
          <TelegramSetupSteps />
        </>
      ) : (
        <TelegramFluxos />
      )}
    </div>
  )
}