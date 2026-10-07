'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { PixTransaction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { AlertTriangle, Check, Copy, Download, Inbox, Pix, Share } from '@/components/ui/icons'
import { EmptyState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { INTEGRATION_NOT_CONFIGURED } from '@/lib/types'

/** Mínimo aceito pela Pushin Pay, em reais. Espelha MIN_VALUE_CENTS no servidor. */
const MIN_PIX_VALUE = 0.5

/**
 * Tela de geração de PIX.
 *
 * Duas situações distintas, e a UI precisa deixar isso explícito:
 *  - provedor configurado: mostra QR Code e código copia-e-cola reais;
 *  - provedor ausente: mostra "Integração não configurada" e NÃO inventa QR Code.
 */
export function PixGenerator({ initialItems, providerConfigured }: { initialItems: PixTransaction[]; providerConfigured: boolean }) {
  const { toast } = useToast()
  const router = useRouter()

  const [amount, setAmount] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [created, setCreated] = React.useState<PixTransaction | null>(null)

  const parsedAmount = Number(amount.replace(/\./g, '').replace(',', '.'))
  const isValid = Number.isFinite(parsedAmount) && parsedAmount >= MIN_PIX_VALUE

  const generate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) {
      toast({ title: 'Informe um valor válido', tone: 'error' })
      return
    }
    if (parsedAmount < MIN_PIX_VALUE) {
      toast({ title: 'O valor mínimo é R$ 0,50', tone: 'error' })
      return
    }

    setLoading(true)
    const response = await fetch('/api/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parsedAmount, description: description || undefined }),
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      toast({
        title: 'Não foi possível gerar',
        description: body?.error ?? 'Tente novamente.',
        tone: 'error',
      })
      setLoading(false)
      return
    }

    if (!body.providerConfigured) {
      toast({
        title: INTEGRATION_NOT_CONFIGURED,
        description: 'A cobrança foi registrada, mas nenhum provedor PIX está conectado.',
        tone: 'info',
      })
    } else {
      toast({ title: 'Cobrança PIX criada' })
    }

    setCreated(body.pix)
    setAmount('')
    setDescription('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      {/* Geração */}
      <div className="xl:col-span-2">
        <div className="surface p-6">
          <h1 className="text-xl font-semibold tracking-tight text-white text-white">
            Gerar PIX
          </h1>
          <p className="mt-1.5 text-sm text-white/50 text-white/50">
            Informe o valor e gere a cobrança na hora.
          </p>

          {!providerConfigured && (
            <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-white/[0.05] p-3.5 border-amber-500/25 bg-white/[0.10]/10">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-white/70 text-white/70" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 text-amber-300">
                  {INTEGRATION_NOT_CONFIGURED}
                </p>
                <p className="mt-0.5 text-white/70/90 text-white/70/80">
                  Configure <code className="font-mono text-xs">PUSHINPAY_API_TOKEN</code> para emitir
                  cobranças reais. Nenhum QR Code é gerado localmente.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={generate} className="mt-6 space-y-4">
            <Input
              label="Valor da cobrança"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              suffix={<span className="text-sm font-medium">R$</span>}
              hint={isValid ? `Cobrar ${formatCurrency(parsedAmount)}` : 'Use vírgula para os centavos.'}
              autoFocus
            />

            <Input
              label="Descrição"
              placeholder="Opcional — aparece no comprovante"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={140}
            />

            <Button type="submit" size="lg" loading={loading} disabled={!isValid} className="w-full">
              Gerar PIX
            </Button>
          </form>
        </div>
      </div>

      {/* Resultado + histórico */}
      <div className="space-y-6 xl:col-span-3">
        {created ? <PixResult pix={created} onDismiss={() => setCreated(null)} /> : <PixPlaceholder />}

        <PixHistory items={initialItems} />
      </div>
    </div>
  )
}

function PixPlaceholder() {
  return (
    <div className="surface flex flex-col items-center justify-center p-10 text-center">
      <div className="brand-glow flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 bg-brand-500/10 text-brand-400">
        <Pix className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-white text-white">
        Sua cobrança aparece aqui
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-white/50 text-white/50">
        Depois de gerar, você verá o QR Code, o código copia-e-cola e o identificador da cobrança.
      </p>
    </div>
  )
}

function PixResult({ pix, onDismiss }: { pix: PixTransaction; onDismiss: () => void }) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    if (!pix.copy_paste_code) return
    try {
      await navigator.clipboard.writeText(pix.copy_paste_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      toast({ title: 'Não foi possível copiar', tone: 'error' })
    }
  }

  const download = () => {
    if (!pix.qr_code_base64) {
      toast({ title: 'QR Code indisponível', description: 'O provedor não devolveu a imagem.', tone: 'info' })
      return
    }
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${pix.qr_code_base64}`
    link.download = `pix-${pix.id.slice(0, 8)}.png`
    link.click()
  }

  const share = async () => {
    const text = pix.copy_paste_code
      ? `Pague R$ ${formatCurrency(pix.amount)} via PIX:\n${pix.copy_paste_code}`
      : `Pague R$ ${formatCurrency(pix.amount)} via PIX`

    if (navigator.share) {
      await navigator.share({ title: 'Cobrança PIX BokashiPay', text }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(text)
    toast({ title: 'Cobrança copiada', description: 'Cole onde quiser compartilhar.' })
  }

  return (
    <div className="surface animate-slide-up p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white text-white">Cobrança gerada</h2>
          <p className="mt-1 text-sm text-white/50 text-white/50">
            {formatDateTime(pix.created_at)}
          </p>
        </div>
        <StatusBadge status={pix.status} />
      </div>

      <div className="mt-6 flex flex-col items-center">
        {pix.qr_code_base64 ? (
          // next/image com base64 não serve aqui; um <img> é apropriado.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${pix.qr_code_base64}`}
            alt="QR Code da cobrança PIX"
            width={208}
            height={208}
            className="rounded-2xl border border-white/[0.08] bg-white p-3 border-white/[0.14]"
          />
        ) : (
          <div className="flex h-[232px] w-[232px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.10] p-4 text-center border-white/[0.14]">
            <Pix className="h-7 w-7 text-white/70 text-white/60" />
            <p className="text-xs text-white/50 text-white/50">
              QR Code disponível após conectar o provedor
            </p>
          </div>
        )}

        <p className="mt-5 text-3xl font-semibold tracking-tight text-white text-white">
          {formatCurrency(pix.amount)}
        </p>

        {pix.copy_paste_code && (
          <>
            <p className="mt-5 label">Código PIX copia e cola</p>
            <div className="mt-2 w-full">
              <div className="flex items-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 border-white/[0.14] bg-white/[0.08]">
                <p className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed text-white/60 text-white/70">
                  {pix.copy_paste_code}
                </p>
                <button
                  onClick={copy}
                  aria-label="Copiar código PIX"
                  className="shrink-0 rounded-lg bg-white p-2 text-white/50 shadow-sm transition-colors hover:text-brand-600 bg-white/[0.2] text-white/70"
                >
                  {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={copy} disabled={!pix.copy_paste_code} variant="outline" size="sm">
            <Copy className="h-4 w-4" />
            Copiar código
          </Button>
          <Button onClick={download} variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Baixar QR Code
          </Button>
          <Button onClick={share} variant="outline" size="sm">
            <Share className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>

        <dl className="mt-6 grid w-full grid-cols-2 gap-3 border-t border-white/[0.06] pt-5 border-white/[0.08]">
          <div>
            <dt className="label">Identificador</dt>
            <dd className="mt-1 truncate font-mono text-xs text-white/70 text-white/80">
              {pix.provider_request_id ?? 'Aguardando provedor'}
            </dd>
          </div>
          <div>
            <dt className="label">Criada em</dt>
            <dd className="mt-1 text-xs text-white/70 text-white/80">
              {formatDateTime(pix.created_at)}
            </dd>
          </div>
        </dl>

        <button
          onClick={onDismiss}
          className="mt-4 text-xs font-medium text-white/50 transition-colors hover:text-white/80 hover:text-white/80"
        >
          Gerar outra cobrança
        </button>
      </div>
    </div>
  )
}

function PixHistory({ items }: { items: PixTransaction[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [checking, setChecking] = React.useState<string | null>(null)

  const refreshStatus = async (pix: PixTransaction) => {
    setChecking(pix.id)
    const response = await fetch('/api/pix/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pixId: pix.id }),
    }).catch(() => null)

    setChecking(null)

    if (response?.ok) {
      const body = await response.json().catch(() => null)
      if (body?.checked) {
        router.refresh()
        return
      }

      // checked:false = não deu para consultar. Dizer o motivo específico
      // importa: "não sei" e "não tenho provedor" levam a ações diferentes.
      const REASONS: Record<string, string> = {
        'sem-id-do-provedor':
          'Esta cobrança foi criada antes da integração com a Pushin Pay. Gere uma nova.',
        'provedor-nao-configurado':
          'PUSHINPAY_API_TOKEN não está configurado no servidor. Sem token não há consulta.',
        'consulta-falhou':
          body?.detail ?? 'A Pushin Pay não respondeu. Tente de novo em instantes.',
      }

      toast({
        title: 'Status não atualizado',
        description: REASONS[body?.reason] ?? 'Não foi possível consultar a Pushin Pay.',
        tone: 'info',
      })
    }
  }

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-5 pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white text-white">
            PIX gerados
          </h2>
          <p className="mt-1 text-sm text-white/50 text-white/50">
            Histórico das suas cobranças
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="Nenhuma cobrança PIX ainda"
          description="Gere sua primeira cobrança PIX para vê-la aqui."
        />
      ) : (
        <ul className="divide-y divide-white/[0.06] divide-white/[0.06]">
          {items.map((pix) => (
            <li key={pix.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="font-semibold tabular-nums text-white text-white">
                  {formatCurrency(pix.amount)}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/50 text-white/50">
                  {formatDateTime(pix.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {pix.provider_request_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={checking === pix.id}
                    onClick={() => refreshStatus(pix)}
                  >
                    Atualizar
                  </Button>
                )}
                <StatusBadge status={pix.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}