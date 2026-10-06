/**
 * Contrato do provedor de PIX.
 *
 * A UI em /pix fala apenas com `PixProvider`. Qualquer PSP real (Gerencianet,
 * Mercado Pago, Pagar.me,itiq, ou um gateway próprio) implementa esta interface
 * e é plugado via `PIX_PROVIDER_URL` / `PIX_PROVIDER_API_KEY`.
 *
 * Ponto central do design: enquanto `isConfigured()` for false, o serviço
 * retorna um erro explícito e NENHUMA cobrança é marcada como paga. Um QR Code
 * gerado localmente é apenas uma representation do valor — não é um pagamento.
 */

export interface PixChargeRequest {
  amount: number
  customerId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerDocument?: string | null
  description?: string
  /**
   * URL pública que o provedor deve chamar quando o status mudar.
   * Sem ela, a cobrança fica pendente até alguém consultar manualmente.
   */
  webhookUrl?: string
  /** Idempotência: duas chamadas com o mesmo id devolvem a mesma cobrança. */
  idempotencyKey: string
}

export interface PixChargeResult {
  providerRequestId: string
  /** Código copia-e-cola no formato EMV (payload PIX). */
  copyPasteCode: string
  /** PNG do QR Code, idealmente já em base64 para embutir. */
  qrCodeBase64: string
  expiresAt: string
}

export interface PixProvider {
  readonly name: string
  isConfigured(): boolean
  createCharge(req: PixChargeRequest): Promise<PixChargeResult>
  /** Consulta o status real de uma cobrança no PSP. */
  getChargeStatus(providerRequestId: string): Promise<{ status: string; paidAt?: string }>
}