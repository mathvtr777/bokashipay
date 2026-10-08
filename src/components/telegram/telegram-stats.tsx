'use client'

import * as React from 'react'
import { Calendar, CheckCircle, Clock, Plus } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

/**
 * Cabeçalho "Gerencie seus bots do Telegram" + botão "Conectar Bot (0/50)"
 * + 3 stat cards (Total / Ativos / Inativos). Os números ficam zerados até
 * a feature de bots ser ligada no schema.
 */
export function TelegramStatsCard() {
  const { toast } = useToast()
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/50">Gerencie seus bots do Telegram</p>
        <button
          type="button"
          onClick={() =>
            toast({
              title: 'Em breve',
              description: 'A conexão com bots do Telegram será habilitada em breve.',
            })
          }
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Conectar Bot (0/50)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total de Bots"
          value={0}
          unit="Bots"
          icon={Calendar}
          tone="brand"
        />
        <StatCard
          label="Bots Ativos"
          value={0}
          unit="Bots"
          icon={CheckCircle}
          tone="success"
        />
        <StatCard
          label="Bots Inativos"
          value={0}
          unit="Bots"
          icon={Clock}
          tone="muted"
        />
      </div>
    </>
  )
}

function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  unit: string
  icon: (p: { className?: string }) => React.ReactElement
  tone: 'brand' | 'success' | 'muted'
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {label}
        </p>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            tone === 'brand' && 'bg-brand-500/15 text-brand-300',
            tone === 'success' && 'bg-emerald-500/15 text-emerald-300',
            tone === 'muted' && 'bg-white/[0.04] text-white/40',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-0.5 text-xs text-white/40">{unit}</p>
    </div>
  )
}