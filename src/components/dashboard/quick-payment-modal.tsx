'use client'

import * as React from 'react'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Check, Copy, Download, Pix, Zap } from '@/components/ui/icons'
import type { PixTransaction } from '@/lib/types'
import { useToast } from '@/components/ui/toast'

/** Mínimo aceito pela Pushin Pay, em reais. */
const MIN_PIX_VALUE = 0.5

/** Valores pré-definidos do chip selector. */
const PRESET_VALUES = [20, 50, 100, 200, 500, 1000] as const

/**
 * Modal "Gerar pagamento rápido" — disparado pelo botão no BalanceHero.
 *
 * Mostra um formulário com valor pré-definido (chips) ou valor custom,
 * gera a cobrança via `/api/pix` e exibe QR Code + código copia-cola
 * para o merchant compartilhar com o pagador.
 *
 * Reusa o endpoint público `/api/pix` (que já faz toda a parte de
 * provedor configurado, fallback, persistência em `pix_transactions`).
 */
export function QuickPaymentModal({
  open,
  onClose,
  pixKey: _pixKey,
  providerConfigured,
}: {
  open: boolean
  onClose: () => void
  /** Mantido para retrocompatibilidade, mas não é exibido no formulário. */
  pixKey: string | null
  providerConfigured: boolean
}) {
  const { toast } = useToast()
  const [amount, setAmount] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [created, setCreated] = React.useState<PixTransaction | null>(null)
  const [copied, setCopied] = React.useState(false)

  // Reset ao abrir/fechar.
  React.useEffect(() => {
    if (!open) {
      // mantém o resultado visível por 1.5s antes de limpar
      const t = setTimeout(() => {
        setCreated(null)
        setAmount('')
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [open])

  const parsed = Number(amount.replace(/\./g, '').replace(',', '.'))
  const valid = Number.isFinite(parsed) && parsed >= MIN_PIX_VALUE

  const selectPreset = (value: number) => {
    setAmount(value.toFixed(2))
  }

  const generate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) {
      toast({ title: 'Informe um valor válido', tone: 'error' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: parsed, description: 'Pagamento rápido' }),
      })
      const body = (await res.json().catch(() => null)) as {
        pix?: PixTransaction
        providerConfigured?: boolean
        error?: string
      } | null
      if (!res.ok || !body?.pix) {
        toast({
          title: 'Não foi possível gerar',
          description: body?.error ?? 'Tente novamente.',
          tone: 'error',
        })
        return
      }
      setCreated(body.pix)
      setAmount('')
      toast({
        title: 'Cobrança PIX gerada',
        description: `${formatCurrency(parsed)} · mostra QR Code e código abaixo`,
      })
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!created?.copy_paste_code) return
    try {
      await navigator.clipboard.writeText(created.copy_paste_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
      toast({ title: 'Código PIX copiado' })
    } catch {
      toast({ title: 'Não foi possível copiar', tone: 'error' })
    }
  }

  const download = () => {
    if (!created?.qr_code_base64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${created.qr_code_base64}`
    link.download = `pix-${created.id.slice(0, 8)}.png`
    link.click()
  }

  // Detecta se o input manual bate com algum preset (formato "20.00", "20", etc.)
  const activePreset = (() => {
    if (!valid) return null
    const match = PRESET_VALUES.find((v) => Math.abs(v - parsed) < 0.005)
    return match ?? null
  })()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Gerar pagamento rápido"
    >
      {!created ? (
        <form onSubmit={generate} className="space-y-5">
          {/* Card laranjinha com o fluxo explicativo. */}
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.08] p-4">
            <p className="text-sm font-semibold text-orange-200">
              Receba via PIX em segundos
            </p>
            <ol className="mt-2 space-y-1 text-sm text-orange-100/85">
              <li>1. Escolha o valor a cobrar (mínimo R$ {MIN_PIX_VALUE.toFixed(2).replace('.', ',')}).</li>
              <li>2. Compartilhe o QR Code ou o copia-e-cola com o pagador.</li>
              <li>3. Assim que pagar, o valor cai automaticamente na sua conta.</li>
            </ol>
          </div>

          {/* Chips de valor pré-definido. */}
          <div>
            <p className="mb-2 text-sm font-medium text-white/80">Valor a cobrar</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_VALUES.map((value) => {
                const active = activePreset === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectPreset(value)}
                    className={
                      'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ease-premium ' +
                      (active
                        ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                        : 'border-white/[0.08] bg-white/[0.04] text-white/70 hover:border-orange-500/40 hover:text-white')
                    }
                  >
                    R$ {value}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Input alternativo. */}
          <Input
            label="Ou informe outro valor (R$)"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            suffix={<span className="text-sm font-medium text-white/70">R$</span>}
            autoFocus
          />

          {providerConfigured === false && (
            <p className="text-xs text-orange-300/80">
              Provedor PIX ainda não está conectado. A cobrança será registrada,
              mas o QR Code só sai após você configurar o{' '}
              <code className="font-mono text-[11px]">PUSHINPAY_API_TOKEN</code>.
            </p>
          )}

          <p className="text-center text-xs text-white/40">
            Geramos o QR Code na hora — sem cadastros, sem complicação.
          </p>

          <button
            type="submit"
            disabled={loading || !valid}
            className={
              'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200 ease-premium ' +
              'bg-orange-500 shadow-glow hover:bg-orange-600 active:scale-[0.99] ' +
              'disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/30 disabled:shadow-none'
            }
          >
            {loading ? (
              <>
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                Gerando…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Gerar QR Code PIX
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          {/* Status + valor */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Cobrança criada em {formatDateTime(created.created_at)}
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-white">
                {formatCurrency(created.amount)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-200">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              Aguardando pagamento
            </span>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            {created.qr_code_base64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${created.qr_code_base64}`}
                alt="QR Code da cobrança PIX"
                width={220}
                height={220}
                className="rounded-2xl border border-white/[0.14] bg-white p-3"
              />
            ) : (
              <div className="flex h-[232px] w-[232px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.14] p-4 text-center">
                <Pix className="h-7 w-7 text-white/60" />
                <p className="text-xs text-white/50">
                  QR Code disponível após conectar o provedor
                </p>
              </div>
            )}
          </div>

          {/* Código PIX copia-cola */}
          {created.copy_paste_code && (
            <div>
              <p className="mb-1.5 block text-sm font-medium text-white/80">
                Código PIX copia e cola
              </p>
              <div className="flex items-start gap-2 rounded-xl border border-white/[0.14] bg-white/[0.08] p-3">
                <p className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed text-white/70">
                  {created.copy_paste_code}
                </p>
                <button
                  type="button"
                  onClick={copy}
                  aria-label="Copiar código PIX"
                  className="shrink-0 rounded-lg bg-white/[0.20] p-2 text-white/70 transition-colors hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={copy}
              disabled={!created.copy_paste_code}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.05] disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar código
            </button>
            <button
              type="button"
              onClick={download}
              disabled={!created.qr_code_base64}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.05] disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar QR
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
