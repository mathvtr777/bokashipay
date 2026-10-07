'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { Check, Copy, Download, Pix, Zap } from '@/components/ui/icons'
import type { PixTransaction } from '@/lib/types'

/** Mínimo aceito pela Pushin Pay, em reais. */
const MIN_PIX_VALUE = 0.5

/**
 * Modal "Pagamento rápido" — disparado pelo botão no BalanceHero. Pede
 * um valor ao merchant, gera a cobrança via `/api/pix` e mostra QR Code
 * + código copia-e-cola, com a chave PIX do merchant já exibida.
 *
 * Reusa o endpoint público `/api/pix` (que já faz toda a parte de
 * provedor configurado, fallback, persistência em `pix_transactions`).
 */
export function QuickPaymentModal({
  open,
  onClose,
  pixKey,
  providerConfigured,
}: {
  open: boolean
  onClose: () => void
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-brand-400" />
          Pagamento rápido
        </span>
      }
      description="Informe o valor, gere o PIX e compartilhe com o cliente."
    >
      {!created ? (
        <form onSubmit={generate} className="space-y-4">
          {/* Chave PIX — exibida para conferência antes de gerar. */}
          <div className="surface flex items-start gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
              <Pix className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Sua chave PIX (do merchant)
              </p>
              <p className="mt-1 truncate font-mono text-sm text-white">
                {pixKey ?? 'Nenhuma conta bancária com chave PIX cadastrada'}
              </p>
              {!pixKey && (
                <p className="mt-1 text-xs text-white/40">
                  Cadastre uma em <a href="/contas-bancarias" className="text-brand-300 underline">Contas Bancárias</a>.
                </p>
              )}
            </div>
          </div>

          <Input
            label="Valor da cobrança"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            suffix={<span className="text-sm font-medium text-white/70">R$</span>}
            hint={
              valid
                ? `Cobrar ${formatCurrency(parsed)}`
                : 'Use vírgula para os centavos (mínimo R$ 0,50).'
            }
            autoFocus
          />

          {!providerConfigured && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-3.5 text-sm text-amber-200">
              Provedor PIX ainda não está conectado. A cobrança será registrada, mas
              o QR Code só sai após você configurar o <code className="font-mono text-xs">PUSHINPAY_API_TOKEN</code>.
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={!valid || !pixKey}
            className="w-full"
          >
            <Zap className="h-4 w-4" />
            Gerar PIX
          </Button>
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
            <StatusBadge status={created.status} />
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
              <p className="label">Código PIX copia e cola</p>
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-white/[0.14] bg-white/[0.08] p-3">
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
            <Button variant="outline" size="sm" onClick={copy} disabled={!created.copy_paste_code}>
              <Copy className="h-4 w-4" />
              Copiar código
            </Button>
            <Button variant="outline" size="sm" onClick={download} disabled={!created.qr_code_base64}>
              <Download className="h-4 w-4" />
              Baixar QR
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}