'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Banner } from '@/lib/types'
import { ChevronLeft, ChevronRight, Zap } from '@/components/ui/icons'

/**
 * Carrossel de banners.
 *
 * Os banners vêm da tabela `banners` — nada de conteúdo fixo no código. Para
 * trocar os banners, o admin insere/atualiza linhas (ou envia imagens para o
 * Supabase Storage e aponta `image_url` para a URL pública).
 *
 * Autoplay pausa no hover e no foco, e nunca roda quando o usuário pediu menos
 * movimento no sistema.
 */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const total = banners.length
  const current = banners[index]

  const go = React.useCallback(
    (next: number) => setIndex(((next % total) + total) % total),
    [total],
  )

  // Autoplay a cada 6s.
  React.useEffect(() => {
    if (paused || total <= 1) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % total), 6000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused, total])

  if (!total || !current) return null

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="group relative overflow-hidden rounded-3xl"
    >
      <div className="relative min-h-[220px] sm:min-h-[264px]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${total}`}
            aria-hidden={i !== index}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 ease-premium',
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <BannerSlide banner={banner} />
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Banner anterior"
            className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white opacity-0 backdrop-blur-md transition-all duration-200 hover:bg-white/20 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Próximo banner"
            className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white opacity-0 backdrop-blur-md transition-all duration-200 hover:bg-white/20 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 right-5 flex items-center gap-1.5">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                onClick={() => go(i)}
                aria-label={`Ir para o banner ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function BannerSlide({ banner }: { banner: Banner }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-950">
      {/* Imagem do banner. Fallback: gradiente roxo da marca. */}
      {banner.image_url ? (
        <Image
          src={banner.image_url}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 900px"
          className="object-cover"
          priority={false}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(700px 400px at 78% 20%, #6d28d9 0%, transparent 62%), radial-gradient(600px 400px at 12% 88%, #2e1065 0%, transparent 58%)',
          }}
        />
      )}

      {/* Véu para garantir contraste do texto sobre qualquer imagem. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/92 via-ink-950/70 to-ink-950/25" />

      <div className="relative flex h-full flex-col justify-center p-7 sm:p-10">
        <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-md">
          <Zap className="h-3 w-3" />
          BokashiPay
        </span>

        <h2 className="max-w-lg text-xl font-semibold leading-tight tracking-tight text-white sm:text-[28px]">
          {banner.title}
        </h2>

        {banner.subtitle && (
          <p className="mt-2.5 max-w-md text-sm leading-relaxed text-white/70">{banner.subtitle}</p>
        )}

        {banner.cta_label && (
          <div className="mt-6">
            <Link
              href={banner.cta_href ?? '/vendas'}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 transition-all duration-200 hover:bg-brand-50 hover:shadow-lg"
            >
              {banner.cta_label}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Decoração geométrica discreta. */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-16 h-56 w-56 rounded-full border border-white/[0.07]"
        aria-hidden="true"
      />
    </div>
  )
}

/**
 * Banners padrão, usados só quando a tabela está vazia — assim a primeira
 * impressão não é uma área em branco. Não são hardcoded de forma que impeça
 * substituição: inserir linhas em `banners` faz o componente usá-las.
 */
export const FALLBACK_BANNERS: Banner[] = [
  {
    id: 'fallback-1',
    title: 'Venda mais com o BokashiPay',
    subtitle: 'Gere cobranças PIX em segundos e acompanhe cada venda em tempo real.',
    cta_label: 'Gerar PIX',
    cta_href: '/pix',
    image_url: null,
    active: true,
    sort_order: 0,
    created_at: new Date(0).toISOString(),
  },
  {
    id: 'fallback-2',
    title: 'Receba via PIX de forma rápida',
    subtitle: 'QR Code e código copia-e-cola na hora, com confirmação automática.',
    cta_label: 'Ver vendas',
    cta_href: '/vendas',
    image_url: null,
    active: true,
    sort_order: 1,
    created_at: new Date(0).toISOString(),
  },
  {
    id: 'fallback-3',
    title: 'Automatize suas vendas',
    subtitle: 'Conecte a UTMFY para rastrear conversões e não perder nenhum pedido.',
    cta_label: 'Configurar integração',
    cta_href: '/integracoes',
    image_url: null,
    active: true,
    sort_order: 2,
    created_at: new Date(0).toISOString(),
  },
]