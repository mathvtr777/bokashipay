import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { TelegramStatsCard } from '@/components/telegram/telegram-stats'
import { TelegramEmptyState } from '@/components/telegram/telegram-empty-state'
import { TelegramSetupSteps } from '@/components/telegram/telegram-setup-steps'
import { Briefcase } from '@/components/ui/icons'

export const metadata: Metadata = { title: 'Telegram' }

export default function TelegramPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Briefcase className="h-[18px] w-[18px]" />}
        title="Telegram"
        description="Seus bots, fluxos e analytics — tudo em um só lugar."
      />

      <TelegramStatsCard />

      <TelegramEmptyState />

      <TelegramSetupSteps />
    </div>
  )
}