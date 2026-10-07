'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { isValidDocument } from '@/lib/validators'
import { CheckCircle, Copy, Customers, Pix, Shield } from '@/components/ui/icons'
import type { ProductCheckoutSettings } from '@/lib/types'

interface CheckoutProduct {
  id: string
  name: string
  description: string | null
  priceCents: number
  imageUrl: string | null
  model: string
}

interface SocialProofBuyer {
  name: string
  minutesAgo: number
}

interface SocialProof {
  totalSold: number
  recent: SocialProofBuyer[]
  buyingNow: number
}

type Stage = 'idle' | 'submitting' | 'pix' | 'paid' | 'error'

const PIX_POLL_MS = 5_000
const PIX_POLL_TIMEOUT_MS = 10 * 60 * 1000

function relativeTime(min: number): string {
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return `há ${d} d`
}

export function CheckoutForm({
  slug,
  product,
  settings,
  socialProof,
}: {
  slug: string
  product: CheckoutProduct
  settings: ProductCheckoutSettings
  socialProof: SocialProof
}) {
  const [stage, setStage] = React.useState<Stage>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [pix, setPix] = React.useState<{
    transactionId: string
    qrCodeBase64: string | null
    copyPasteCode: string | null
    successMessage?: string
  } | null>(null)
  const [copied, setCopied] = React.useState(false)

  const requirePhone = Boolean(settings.requirePhone)
  const requireDocument = Boolean(settings.requireDocument)
  const isSubscription = product.model === 'subscription'

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    const payload = {
      customerName: String(formData.get('name') ?? '').trim(),
      customerEmail: String(formData.get('email') ?? '').trim(),
      customerPhone: String(formData.get('phone') ?? '').trim() || null,
      customerDocument: String(formData.get('document') ?? '').trim() || null,
    }

    if (requireDocument && payload.customerDocument && !isValidDocument(payload.customerDocument)) {
      setError('CPF/CNPJ inválido.')
      return
    }

    setStage('submitting')
    const res = await fetch(`/api/checkout/${encodeURIComponent(slug)}/charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = (await res.json().catch(() => ({}))) as {
      error?: string
      transactionId?: string
      qrCodeBase64?: string | null
      copyPasteCode?: string | null
      successMessage?: string
    }
    if (!res.ok) {
      setStage('error')
      setError(body.error ?? 'Erro ao gerar cobrança.')
      return
    }
    setPix({
      transactionId: body.transactionId!,
      qrCodeBase64: body.qrCodeBase64 ?? null,
      copyPasteCode: body.copyPasteCode ?? null,
      successMessage: body.successMessage,
    })
    setStage('pix')
  }

  // Polling: detecta pagamento confirmado e transiciona pra "paid".
  React.useEffect(() => {
    if (stage !== 'pix' || !pix) return
    const start = Date.now()
    const interval = setInterval(async () => {
      if (Date.now() - start > PIX_POLL_TIMEOUT_MS) {
        clearInterval(interval)
        return
      }
      const res = await fetch(
        `/api/checkout/${encodeURIComponent(slug)}/status?transactionId=${pix.transactionId}`,
      )
      if (!res.ok) return
      const body = (await res.json().catch(() => ({}))) as { paid?: boolean }
      if (body.paid) {
        clearInterval(interval)
        setStage('paid')
      }
    }, PIX_POLL_MS)
    return () => clearInterval(interval)
  }, [stage, pix, slug])

  const copy = async () => {
    if (!pix?.copyPasteCode) return
    try {
      await navigator.clipboard.writeText(pix.copyPasteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-10 pt-6 sm:pt-12">
      <header className="mb-4 flex items-center justify-center gap-2 text-xs text-white/50 text-white/50">
        <Shield className="h-3.5 w-3.5" />
        <span>Pagamento seguro via PIX</span>
      </header>

      <article className="surface overflow-hidden">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="aspect-[3/1] w-full object-cover"
          />
        ) : settings.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.bannerUrl}
            alt=""
            className="aspect-[3/1] w-full object-cover"
          />
        ) : (
          <div className="aspect-[3/1] w-full bg-gradient-to-br from-brand-500 to-brand-700" />
        )}

        <div className="space-y-5 p-6">
          {stage === 'paid' ? (
            <PaidPanel message={pix?.successMessage} productName={product.name} />
          ) : pix ? (
            <PixPanel
              pix={pix}
              copied={copied}
              onCopy={copy}
              isSubscription={isSubscription}
            />
          ) : (
            <>
              <header className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight text-white text-white">
                    {product.name}
                  </h1>
                  {isSubscription && (
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 bg-brand-500/10 text-brand-300">
                      Assinatura
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="text-sm leading-relaxed text-white/60 text-white/70">
                    {product.description}
                  </p>
                )}
                <p className="text-2xl font-bold tabular-nums text-white text-white">
                  {formatCurrency(product.priceCents / 100)}
                  {isSubscription && (
                    <span className="ml-1 text-sm font-normal text-white/50">/mês</span>
                  )}
                </p>
                {isSubscription && (
                  <p className="text-[11px] text-white/50 text-white/50">
                    Recorrência via Pix Automático disponível em breve. Por enquanto, esta é uma cobrança única.
                  </p>
                )}
              </header>

              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
                    Nome completo
                  </label>
                  <Input name="name" required maxLength={120} placeholder="Maria Silva" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
                    E-mail
                  </label>
                  <Input
                    name="email"
                    type="email"
                    required
                    maxLength={160}
                    placeholder="voce@email.com"
                  />
                </div>
                {requirePhone && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
                      Telefone
                    </label>
                    <Input name="phone" type="tel" maxLength={30} placeholder="(11) 99999-9999" />
                  </div>
                )}
                {requireDocument && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
                      CPF
                    </label>
                    <Input name="document" maxLength={20} placeholder="000.000.000-00" />
                  </div>
                )}

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 border-red-500/30 bg-red-500/10 text-red-300">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={stage === 'submitting'}
                >
                  <Pix className="mr-1.5 h-4 w-4" />
                  Pagar com PIX
                </Button>

                <p className="text-center text-[11px] text-white/50 text-white/50">
                  Ao continuar você concorda com os termos do produto.
                </p>
              </form>

              <SocialProofPanel socialProof={socialProof} />
            </>
          )}
        </div>
      </article>
    </main>
  )
}

function PixPanel({
  pix,
  copied,
  onCopy,
  isSubscription,
}: {
  pix: { qrCodeBase64: string | null; copyPasteCode: string | null }
  copied: boolean
  onCopy: () => void
  isSubscription: boolean
}) {
  return (
    <div className="space-y-4">
      <header className="space-y-1 text-center">
        <h2 className="text-base font-semibold text-white text-white">
          Escaneie o QR Code ou copie o código
        </h2>
        <p className="text-xs text-white/50 text-white/50">
          O pagamento é confirmado automaticamente. Esta tela atualiza sozinha.
        </p>
        {isSubscription && (
          <p className="text-[11px] text-white/70 text-amber-300">
            (Esta é uma cobrança avulsa — a recorrência será configurada em breve.)
          </p>
        )}
      </header>

      <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl border border-white/[0.08] bg-white p-3 border-white/[0.14] bg-white">
        {pix.qrCodeBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR Code para pagamento"
            className="h-full w-full"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/50">
            <span className="block h-6 w-6 animate-spin rounded-full border-2 border-white/[0.08] border-t-brand-500" />
            <span className="text-xs">aguardando…</span>
          </div>
        )}
      </div>

      {pix.copyPasteCode && (
        <button
          type="button"
          onClick={onCopy}
          className="group flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white px-3 py-2.5 text-left text-xs transition-colors hover:border-brand-300 hover:bg-brand-50/50 border-white/[0.14] bg-ink-900 hover:bg-white/[0.08]"
        >
          <code className="flex-1 truncate font-mono text-[11px] text-white/70 text-white/80">
            {pix.copyPasteCode}
          </code>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
              copied
                ? 'bg-white/[0.05] text-white bg-white/[0.08]/10 text-emerald-300'
                : 'bg-white/[0.04] text-white/70 bg-white/[0.08] text-white/80',
            )}
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copiado!' : 'Copiar'}
          </span>
        </button>
      )}

      <div className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-xs text-white/60 bg-ink-900 text-white/70">
        <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/[0.10] border-t-brand-500" />
        <span>Aguardando confirmação do pagamento…</span>
      </div>
    </div>
  )
}

function PaidPanel({
  message,
  productName,
}: {
  message: string | undefined
  productName: string
}) {
  return (
    <div className="space-y-3 py-2 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] text-white bg-white/[0.08]/10 text-emerald-300">
        <CheckCircle className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-white text-white">
        Pagamento confirmado
      </h2>
      <p className="text-sm text-white/60 text-white/70">
        {message ?? 'Obrigado por comprar ' + productName + '!'}
      </p>
    </div>
  )
}

function SocialProofPanel({ socialProof }: { socialProof: SocialProof }) {
  const { totalSold, recent, buyingNow } = socialProof
  if (totalSold === 0 && buyingNow === 0) {
    return null
  }
  return (
    <aside className="space-y-3 border-t border-white/[0.06] pt-4 border-white/[0.08]">
      {buyingNow > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2 text-xs text-amber-800 bg-white/[0.10]/10 text-amber-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white/[0.10]" />
          </span>
          <Customers className="h-3.5 w-3.5" />
          <span className="font-medium">
            {buyingNow} {buyingNow === 1 ? 'pessoa está comprando' : 'pessoas estão comprando'} agora
          </span>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50 text-white/50">
            Compradores recentes
          </p>
          <ul className="space-y-1.5">
            {recent.map((b, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-xs text-white/60 text-white/70"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-[10px] font-semibold text-white/70 bg-white/[0.08] text-white/80">
                  {b.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium text-white/80 text-white/90">
                  {b.name}
                </span>
                <span className="text-white/50 text-white/50">
                  {relativeTime(b.minutesAgo)}
                </span>
              </li>
            ))}
          </ul>
          {totalSold > recent.length && (
            <p className="mt-2 text-[11px] text-white/50 text-white/50">
              +{totalSold - recent.length} {totalSold - recent.length === 1 ? 'compra' : 'compras'} no total
            </p>
          )}
        </div>
      )}
    </aside>
  )
}