import { notFound } from 'next/navigation'
import { getProductBySlug, getCheckoutSocialProof } from '@/lib/queries'
import { CheckoutForm } from './checkout-form'
import type { ProductCheckoutSettings } from '@/lib/types'

/**
 * Página pública de checkout. Acessível sem login.
 *
 * Rota na raiz (não em `(app)/`) justamente porque o `(app)/layout.tsx`
 * exige sessão ativa e bloqueia. Aqui é a única exceção: visitantes
 * anônimos precisam conseguir acessar.
 */

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product || product.status !== 'active') {
    notFound()
  }

  const settings = (product.checkout_settings ?? {}) as ProductCheckoutSettings
  const socialProof = await getCheckoutSocialProof(product.id)

  return (
    <div
      className="min-h-screen bg-white/[0.04] bg-ink-950"
      style={
        settings.primaryColor
          ? ({ '--brand': settings.primaryColor } as React.CSSProperties)
          : undefined
      }
    >
      <CheckoutForm
        slug={slug}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          priceCents: product.price_cents,
          imageUrl: product.image_url,
          model: product.model,
        }}
        settings={settings}
        socialProof={socialProof}
      />

      <footer className="mx-auto max-w-md px-4 pb-8 pt-4 text-center text-[11px] text-white/50 text-white/50">
        Pagamento processado pela BokashiPay · A PUSHIN PAY atua exclusivamente como processadora de pagamentos.
      </footer>
    </div>
  )
}