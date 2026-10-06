/**
 * Regras de negócio puras — sem I/O, sem dependência de React ou Supabase.
 * Testáveis isoladamente e compartilhadas entre servidor e cliente.
 */

import type { Transaction } from '@/lib/types'

/** Taxas padrão por método, em percentual. Configurável por settings no futuro. */
export const DEFAULT_FEES = {
  pix: 0.99,
  card: 3.49,
  boleto: 0,
} as const

export function calculateFee(amount: number, method: string): number {
  const rate = DEFAULT_FEES[method as keyof typeof DEFAULT_FEES]
  if (rate === undefined) return 0
  return roundCurrency(amount * (rate / 100))
}

export function calculateNet(amount: number, method: string): number {
  return roundCurrency(amount - calculateFee(amount, method))
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Saldo disponível = soma de tudo que já entrou menos tudo que já saiu.
 * Só conta transações aprovadas e concluídas — pendências não são saldo.
 */
export function computeAvailableBalance(transactions: Pick<Transaction, 'status' | 'net_amount'>[]): number {
  const received = transactions
    .filter((t) => t.status === 'approved')
    .reduce((sum, t) => sum + Number(t.net_amount), 0)
  return roundCurrency(received)
}

export function computePendingBalance(transactions: Pick<Transaction, 'status' | 'net_amount'>[]): number {
  const pending = transactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.net_amount), 0)
  return roundCurrency(pending)
}

/** Taxa de conversão = aprovadas / total de cobranças. */
export function computeConversionRate(transactions: Pick<Transaction, 'status'>[]): number {
  if (transactions.length === 0) return 0
  const approved = transactions.filter((t) => t.status === 'approved').length
  return (approved / transactions.length) * 100
}

/**
 * Agrupa por método de pagamento, já com percentual e valor movimentado.
 * Percentuais somam 100 entre os métodos que efetivamente tiveram venda.
 */
export function computeMethodStats(
  transactions: Pick<Transaction, 'method' | 'amount' | 'status'>[],
): { method: string; label: string; count: number; percentage: number; amount: number }[] {
  const labels: Record<string, string> = { pix: 'PIX', card: 'Cartão', boleto: 'Boleto' }
  const buckets = new Map<string, { count: number; amount: number }>()

  for (const t of transactions) {
    const current = buckets.get(t.method) ?? { count: 0, amount: 0 }
    buckets.set(t.method, {
      count: current.count + 1,
      amount: roundCurrency(current.amount + Number(t.amount)),
    })
  }

  const total = [...buckets.values()].reduce((sum, b) => sum + b.count, 0)

  // Garante que os três métodos apareçam, mesmo com zero vendas.
  for (const method of ['pix', 'card', 'boleto']) {
    if (!buckets.has(method)) buckets.set(method, { count: 0, amount: 0 })
  }

  return [...buckets.entries()].map(([method, value]) => ({
    method,
    label: labels[method] ?? method,
    count: value.count,
    percentage: total > 0 ? (value.count / total) * 100 : 0,
    amount: value.amount,
  }))
}

/** Variação percentual entre dois períodos, para os cards do dashboard. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

export function formatPercentChange(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1).replace('.', ',')}%`
}