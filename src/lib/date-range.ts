import type { DateRange, DateRangePreset } from './types'

/** Resolve o preset em um intervalo concreto de datas (yyyy-mm-dd). */
export function resolveRange(preset: DateRangePreset, from?: string, to?: string): DateRange {
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  if (preset === 'custom' && from && to) {
    return { from, to, preset: 'custom' }
  }

  const days: Record<string, number> = {
    today: 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '12m': 365,
  }

  const daysBack = days[preset] ?? 30
  const start = new Date(today)
  // `today` com 1 dia devolveria apenas o próprio dia; queremos os últimos N dias.
  start.setDate(start.getDate() - (daysBack === 1 ? 0 : daysBack - 1))

  return { from: iso(start), to: iso(today), preset }
}

/** Rótulos do seletor de período. */
export const PERIOD_LABELS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'custom', label: 'Personalizado' },
]

/** Períodos do gráfico — distinto do seletor geral, como no briefing. */
export const CHART_RANGES = [
  { value: '7d' as const, label: '7 dias' },
  { value: '30d' as const, label: '30 dias' },
  { value: '90d' as const, label: '90 dias' },
  { value: '12m' as const, label: '12 meses' },
]

/** Rótulo curto do período, para o cabeçalho do card. */
export function rangeLabel(range: DateRange): string {
  const found = PERIOD_LABELS.find((p) => p.value === range.preset)
  return found?.label ?? 'Período'
}

/**
 * Período imediatamente anterior ao informado, com a mesma duração.
 * Ex.: 30d de 13 dias atrás até hoje → 30d anteriores (43 dias atrás até 14 dias atrás).
 *
 * Usado para calcular variação % entre o range atual e o anterior.
 */
export function previousRange(range: DateRange): DateRange {
  const from = new Date(`${range.from}T00:00:00Z`)
  const to = new Date(`${range.to}T00:00:00Z`)
  const days =
    Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const prevTo = new Date(from)
  prevTo.setUTCDate(prevTo.getUTCDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setUTCDate(prevFrom.getUTCDate() - (days - 1))
  return {
    from: prevFrom.toISOString().slice(0, 10),
    to: prevTo.toISOString().slice(0, 10),
    preset: 'custom',
  }
}