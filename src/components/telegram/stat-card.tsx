import * as React from 'react'
import { Calendar, CheckCircle, Clock } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export function StatCard({
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
