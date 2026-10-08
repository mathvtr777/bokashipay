'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { TelegramTabs } from './telegram-tabs'

/**
 * Wrapper client para as tabs da página /telegram. Escreve `?aba=...`
 * no querystring quando o user troca. A Server Component lê e renderiza
 * o conteúdo certo.
 */
export function TelegramTabsClient({ initial }: { initial: 'robos' | 'fluxos' }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [active, setActive] = React.useState<'robos' | 'fluxos'>(initial)

  // Sincroniza com a URL se o user usar back/forward do navegador.
  React.useEffect(() => {
    const next = (searchParams.get('aba') === 'fluxos' ? 'fluxos' : 'robos') as
      | 'robos'
      | 'fluxos'
    setActive(next)
  }, [searchParams])

  return (
    <TelegramTabs
      value={active}
      onChange={(next) => {
        setActive(next)
        const params = new URLSearchParams(searchParams.toString())
        if (next === 'robos') params.delete('aba')
        else params.set('aba', next)
        const qs = params.toString()
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`)
      }}
    />
  )
}