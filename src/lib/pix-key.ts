/** Validação de chave PIX — mesma gramática do PIX do Banco Central. */

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Classifica a chave e diz se é válida.
 *
 * A ordem importa: uma chave aleatória é um UUID, um e-mail tem `@` e um
 * telefone só tem dígitos — testar na ordem errada daria falsos positivos.
 */
export function classifyPixKey(raw: string): { type: PixKeyType; valid: boolean } {
  const value = raw.trim()
  if (!value) return { type: 'random', valid: false }

  // CPF/CNPJ costuma vir colado com máscara, e é assim que as pessoas copiam.
  // Aceitar a máscara é tolerância de UX — o PIX transmite só os dígitos.
  const digits = value.replace(/\D/g, '')
  if (/^\d{11}$/.test(digits)) return { type: 'cpf', valid: true }
  if (/^\d{14}$/.test(digits)) return { type: 'cnpj', valid: true }

  // Telefone: +55 com DDD e número, 12 ou 13 dígitos.
  if (/^\+?\d{12,13}$/.test(digits.replace(/^\+/, '')) && value.startsWith('+55')) {
    return { type: 'phone', valid: true }
  }
  if (/^\+55\d{10,11}$/.test(digits)) return { type: 'phone', valid: true }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return { type: 'email', valid: true }
  if (UUID_RE.test(value)) return { type: 'random', valid: true }

  return { type: 'random', valid: false }
}

export function isValidPixKey(raw: string): boolean {
  return classifyPixKey(raw).valid
}

/** Rótulo do tipo, para exibir na tela de aprovação. */
export function pixKeyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    phone: 'Telefone',
    random: 'Chave aleatória',
  }
  return labels[type] ?? type
}