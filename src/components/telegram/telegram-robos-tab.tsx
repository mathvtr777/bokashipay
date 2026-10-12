'use client'

import * as React from 'react'
import { Plus } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { StatCard } from '@/components/telegram/stat-card'
import { Calendar, CheckCircle, Clock } from '@/components/ui/icons'

interface TelegramRobosTabProps {
  stats: { total: number; active: number; inactive: number }
  bots: import('@/lib/types').TelegramBot[]
}

export function TelegramRobosTab({ stats, bots }: TelegramRobosTabProps) {
  const { toast } = useToast()

  const openComingSoon = () => {
    toast({
      title: 'Em breve',
      description: 'A conexão com bots do Telegram será habilitada em breve.',
    })
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/50">Gerencie seus bots do Telegram</p>
        <Button
          onClick={openComingSoon}
          disabled
          className="inline-flex items-center gap-1.5 bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white shadow-glow opacity-50 cursor-not-allowed"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Conectar Bot ({stats.total}/50)
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total de Bots"
          value={stats.total}
          unit="Bots"
          icon={Calendar}
          tone="brand"
        />
        <StatCard
          label="Bots Ativos"
          value={stats.active}
          unit="Bots"
          icon={CheckCircle}
          tone="success"
        />
        <StatCard
          label="Bots Inativos"
          value={stats.inactive}
          unit="Bots"
          icon={Clock}
          tone="muted"
        />
      </div>
    </>
  )
}
