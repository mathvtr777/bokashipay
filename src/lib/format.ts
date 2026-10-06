/**
 * Formatação de moeda, datas e números. Locale pt-BR fixo — o produto é
 * brasileiro e não deve variar com o locale do servidor.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const NUM = new Intl.NumberFormat('pt-BR')

export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0)
  if (Number.isNaN(n)) return BRL.format(0)
  return BRL.format(n)
}

export function formatNumber(value: number | null | undefined): string {
  return NUM.format(value ?? 0)
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  return `${(value ?? 0).toFixed(digits).replace('.', ',')}%`
}

/** Valores vindos de `numeric` chegam como string do Postgres. */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "há 5 min", "há 3 h", "há 2 d" — usado no sino e no feed de eventos. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days} d`
  return formatDate(iso)
}

/** Converte "1234,56" (pt-BR) em número. Retorna null se inválido. */
export function parseCurrencyInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isNaN(n) ? null : n
}

/**
 * Mascara documentos bancários por privacy: "123.456.789-09" -> "***.456.789-09".
 * Usado nas listagens, onde o dígito verificador não é necessário.
 */
export function maskDocument(value: string | null | undefined): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) return `***.${digits.slice(3, 9)}.${digits.slice(9)}`
  if (digits.length === 14) return `***.${digits.slice(3, 12)}.${digits.slice(12)}`
  return value
}

export function maskAccount(account: string | null | undefined): string {
  if (!account) return '—'
  if (account.length <= 4) return account
  return `${'•'.repeat(3)}${account.slice(-4)}`
}

/** Últimos 8 caracteres de um UUID, para exibir como "ID" compacto na tabela. */
export function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

/** Primeiro nome para a saudação do dashboard. */
export function firstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim()
  if (!trimmed) return 'por aqui'
  return trimmed.split(/\s+/)[0]
}