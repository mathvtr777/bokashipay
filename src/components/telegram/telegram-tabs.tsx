'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Bot, Link2 } from '@/components/ui/icons'

type Tab = 'robos' | 'fluxos'

/**
 * Tabs "Robôs / Fluxos" da página /telegram. Quando o user troca de aba,
 * escreve `?aba=robos|fluxos` no querystring para que o estado fique
 * refletido na URL e o componente "aba atual" saiba qual renderizar.
 */
export function TelegramTabs({
  value,
  onChange,
}: {
  value: Tab
  onChange: (next: Tab) => void
}) {
  const tabs: { key: Tab; label: string; icon: (p: { className?: string }) => React.ReactElement }[] = [
    { key: 'robos', label: 'Robôs', icon: Bot },
    { key: 'fluxos', label: 'Fluxos', icon: Link2 },
  ]

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1">
      {tabs.map((t) => {
        const Icon = t.icon
        const active = value === t.key
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
              active
                ? 'border border-brand-500/50 bg-ink-900 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.30)]'
                : 'text-white/60 hover:text-white',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}