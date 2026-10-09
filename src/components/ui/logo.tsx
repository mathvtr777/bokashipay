import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Logo da BokashiPay.
 *
 * Renderiza o lockup oficial (`/public/logo.png`, proporção ~3:1) sem
 * distorcer. Em containers pequenos (sidebar, auth) a imagem é
 * `object-left` para enquadrar o ícone "B"; o wordmark só cabe em
 * containers largos, que não usamos hoje — na landing a logo é servida
 * direto de `/landing/logo.png` via `next/image`.
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
        width={size * 3}
        height={size}
        priority={priority}
        className="h-full w-auto max-w-none object-left object-contain"
      />
    </span>
  )
}

/**
 * Lockup: símbolo sozinho, no tamanho pedido.
 * Mantido por retrocompatibilidade — `LogoLockup` ainda é importado em
 * `auth-forms.tsx` (tela de login/cadastro).
 */
export function LogoLockup({ size = 32 }: { size?: number }) {
  return <Logo size={size} priority />
}