'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Banner } from '@/lib/types'
import { ChevronLeft, ChevronRight } from '@/components/ui/icons'

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
      <div className="relative aspect-[3/1] min-h-[120px] w-full">
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
  const isExternal = /^https?:\/\//i.test(banner.cta_href ?? '')
  const ctaHref = banner.cta_href ?? ''

  // O slide é apenas a imagem: sem pill, título, subtítulo, véu ou decorações.
  // Banners com link externo abrem em nova aba ao clicar na imagem; sem link,
  // ficam como decoração.
  const image = banner.image_url ? (
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
  )

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-950">
      {isExternal ? (
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={banner.title}
          className="absolute inset-0 block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {image}
        </a>
      ) : (
        image
      )}
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