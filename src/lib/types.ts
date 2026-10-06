import type { Database } from '@/lib/database.types'

export type Json = Database['public']['Tables']['profiles']['Row']

// -----------------------------------------------------------------------------
// Domínio
// -----------------------------------------------------------------------------

export type TransactionStatus = 'approved' | 'pending' | 'canceled' | 'refunded'
export type PaymentMethod = 'pix' | 'card' | 'boleto'
export type PixStatus = 'pending' | 'paid' | 'expired' | 'canceled'
export type FinancialEntryType = 'income' | 'expense' | 'fee' | 'refund' | 'withdrawal'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type PixTransaction = Database['public']['Tables']['pix_transactions']['Row']
export type BankAccount = Database['public']['Tables']['bank_accounts']['Row']
export type WithdrawalRequest = Database['public']['Tables']['withdrawal_requests']['Row']
export type FinancialEntry = Database['public']['Tables']['financial_entries']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']
export type IntegrationSafe = Database['public']['Views']['integrations_safe']['Row']
export type IntegrationEvent = Database['public']['Tables']['integration_events']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Banner = Database['public']['Tables']['banners']['Row']
export type Settings = Database['public']['Tables']['settings']['Row']

// -----------------------------------------------------------------------------
// Agregados do dashboard
// -----------------------------------------------------------------------------

export interface DashboardMetrics {
  availableBalance: number
  pendingBalance: number
  totalReceived: number
  approvedSales: number
  totalSales: number
  conversionRate: number
  totalFees: number
  totalWithdrawn: number
}

export type DateRangePreset =
  | 'today'
  | '7d'
  | '30d'
  | '90d'
  | '12m'
  | 'custom'

export interface DateRange {
  from: string  // ISO date (yyyy-mm-dd)
  to: string
  preset: DateRangePreset
}

/** Cliente com o agregado de compras — usado na listagem e no perfil. */
export interface CustomerWithStats extends Customer {
  total_purchased: number
  purchase_count: number
  last_purchase_at: string | null
}

export interface SalesPoint {
  date: string
  label: string
  volume: number
  count: number
}

export interface PaymentMethodStat {
  method: string
  label: string
  count: number
  percentage: number
  amount: number
}

// -----------------------------------------------------------------------------
// Resultado padrão das chamadas de serviço
// -----------------------------------------------------------------------------

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/** Um provedor externo ainda sem credencial configurada. */
export const INTEGRATION_NOT_CONFIGURED = 'Integração não configurada' as const
