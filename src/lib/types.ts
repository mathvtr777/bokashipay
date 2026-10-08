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
export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type WebhookEndpoint = Database['public']['Tables']['webhook_endpoints']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type BioPage = Database['public']['Tables']['bio_pages']['Row']
export type Infracao = Database['public']['Tables']['infracoes']['Row']

/** Status possíveis de uma infração. */
export type InfracaoStatus = 'open' | 'analyzing' | 'defended' | 'lost' | 'won'
/** Tipos de infração. */
export type InfracaoType = 'chargeback' | 'fraud' | 'dispute'

/** Status possíveis de um produto. */
export type ProductStatus = 'draft' | 'active' | 'archived'

/** Modelo de cobrança do produto. Assinatura por enquanto é só flag — pagamento ainda é one-time. */
export type ProductModel = 'one_time' | 'subscription'

/**
 * Configurações visuais e funcionais do checkout público.
 * Persistidas como JSONB em `products.checkout_settings`.
 */
export interface ProductCheckoutSettings {
  /** Cor primária do checkout (hex). Default: brand-500. */
  primaryColor?: string
  /** URL de banner/imagem de capa. */
  bannerUrl?: string
  /** Mensagem mostrada após pagamento confirmado. */
  successMessage?: string
  /** Pedir telefone no formulário. */
  requirePhone?: boolean
  /** Pedir CPF no formulário. */
  requireDocument?: boolean
}

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
  goal: GoalProgress
  /** Variação entre o range atual e o anterior. `value: null` = sem base. */
  change: DashboardChange
}

export interface DashboardChange {
  totalReceived: RangeChange
  approvedSales: RangeChange
}

/** Direção da variação entre dois valores. */
export type Trend = 'up' | 'down' | 'flat'

export interface RangeChange {
  value: number | null
  trend: Trend
}

/**
 * Progresso do merchant em relação aos tiers de meta.
 * Os tiers são fixos (vide `GOAL_TIERS` em services/payments/rules.ts).
 */
export interface GoalProgress {
  current: number         // valor bruto recebido até agora
  currentTier: number     // tier atual em que o merchant está
  nextTier: number | null // próximo tier, ou null se já passou do último
  percent: number         // 0..100 dentro do tier atual
  remaining: number       // quanto falta pro próximo tier (0 se null)
  isLastTier: boolean     // true se nextTier === null
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
// Estruturas do dashboard (visual Laranjinha) — mocks por enquanto.
// Quando forem ligadas, basta substituir o corpo das queries stub
// correspondentes em `lib/queries.ts`. Os componentes da UI já consomem
// esses tipos.
// -----------------------------------------------------------------------------

/** Produtor no ranking — nome, vendas e valor. */
export interface Producer {
  id: string
  name: string
  count: number
  amount: number
}

/** Status dos pedidos no período (donut). */
export interface StatusDonut {
  approved: number
  pending: number
}

/** Funil de conversão: PIX gerados → pagos. */
export interface ConversionFunnel {
  generated: number
  paid: number
  percent: number
}

/** Velocidade de pagamento: série por hora + mediana em segundos. */
export interface PaymentVelocity {
  series: { hour: string; seconds: number }[]
  medianSeconds: number | null
}

/**
 * Funil de 3 etapas: PIX gerado → aguardando pagamento → pago. Cada etapa tem
 * valor absoluto e percent em relação ao total gerado (a primeira é sempre
 * 100%). Usado na página de Análises.
 */
export interface ConversionFunnelSteps {
  generated: number
  awaiting: number
  paid: number
  approvalRate: number // paid / generated
  medianSecondsToPay: number | null
}

/**
 * Heatmap de quando os clientes compram: 7 dias da semana × 4 faixas
 * (manhã, manhã, tarde, noite). Cada célula é o total de vendas aprovadas
 * no período. Usado na página de Análises.
 */
export interface ConversionHeatmapCell {
  weekday: number // 0=Dom, 1=Seg, ..., 6=Sáb
  bucket: 0 | 1 | 2 | 3 // 0=manhã(0-6), 1=manhã(6-12), 2=tarde(12-18), 3=noite(18-24)
  count: number
}

export interface ConversionHeatmap {
  cells: ConversionHeatmapCell[]
  max: number
}

/**
 * Breakdown por fonte/origem. Derivado de `transactions.method` +
 * `transactions.description` no momento — quando houver campo `source`
 * próprio, o cálculo fica mais preciso. Cada item tem uma `key` estável
 * para mapear ícone/label.
 */
export interface SourceBreakdownItem {
  key: 'telegram_bot' | 'checkout_direct' | 'api' | 'other'
  label: string
  count: number
  amount: number
}

export interface SourceBreakdown {
  items: SourceBreakdownItem[]
}

// -----------------------------------------------------------------------------
// Resultado padrão das chamadas de serviço
// -----------------------------------------------------------------------------

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/** Um provedor externo ainda sem credencial configurada. */
export const INTEGRATION_NOT_CONFIGURED = 'Integração não configurada' as const
