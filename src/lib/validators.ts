/**
 * Validadores compartilhados entre cliente e servidor.
 *
 * Ficam fora de `components/` de propósito: as rotas de API também precisam
 * validar, e importar de um componente arrastaria JSX para o bundle do servidor.
 */

/**
 * CPF/CNPJ com verificação de dígito verificador.
 * Um documento válido é pré-requisito para repasses — só validar o tamanho
 * deixaria passar número inventado.
 */
export function isValidDocument(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11 && digits.length !== 14) return false

  const checkDigit = (base: string, length: number): number => {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += Number(base[i]) * (length + 1 - i)
    }
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  // Sequências de dígitos repetidos (000..., 111...) passam no cálculo mas
  // nunca são documentos reais.
  if (/^(\d)\1+$/.test(digits)) return false

  if (digits.length === 11) {
    return (
      checkDigit(digits.slice(0, 9), 9) === Number(digits[9]) &&
      checkDigit(digits.slice(0, 10), 10) === Number(digits[10])
    )
  }

  return (
    checkDigit(digits.slice(0, 11), 11) === Number(digits[11]) &&
    checkDigit(digits.slice(0, 12), 12) === Number(digits[12])
  )
}

/** E-mail com o suficiente de rigor para rejeitar erro de digitação. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

/** Telefone brasileiro com DDD. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === 11 || digits.length === 10
}