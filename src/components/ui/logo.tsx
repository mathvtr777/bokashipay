import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Logo da BokashiPay.
 *
 * Renderiza o símbolo "B" roxo/branco/preto (`/public/logo.png`) — sem
 * wordmark. O PNG já vem com fundo transparente (processado em
 * `scripts/process-logo.cjs`). Usamos `priority` apenas no lockup principal do
 * shell para evitar flash no primeiro paint; nas outras instâncias fica sem
 * priority para não pesar o LCP.
 */
export function Logo({
  className,
  size = 32,
  priority = false,
}: {
  className?: string
  size?: number
  priority?: boolean
}) {
  return (
    <span
      className={cn('relative inline-block shrink-0', className)}
      style={{ width: size, height: size }}
      aria-label="BokashiPay"
    >
      <Image
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        priority={priority}
        className="object-contain"
      />
    </span>
  )
}

/**
 * Lockup: símbolo sozinho, no tamanho pedido.
 * Mantido por retrocompatibilidade — `LogoLockup` ainda é importado em
 * `app-shell.tsx` e na landing.
 */
export function LogoLockup({ size = 32 }: { size?: number }) {
  return <Logo size={size} priority />
}