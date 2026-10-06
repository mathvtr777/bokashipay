import { cn } from '@/lib/utils'
import * as Icons from './icons'

/**
 * Marca do BokashiPay. Um losango (o "b" da Bokashi) com gradiente da marca —
 * geometria própria, sem imitar identidade de terceiros.
 */
export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn('brand-gradient flex shrink-0 items-center justify-center rounded-xl shadow-sm', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.58, height: size * 0.58 }}>
        <path
          d="M12 2.6 21.4 12 12 21.4 2.6 12Z"
          stroke="white"
          strokeWidth="1.7"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <path
          d="M9.6 15.4V8.6h2.9a2.05 2.05 0 0 1 1.32 3.63A2.15 2.15 0 0 1 12.7 15.4Z"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-[15px] font-semibold tracking-tight text-ink-900 dark:text-white', className)}>
      Bokashi<span className="text-brand-600 dark:text-brand-400">Pay</span>
    </span>
  )
}

export function LogoLockup({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size} />
      <Wordmark />
    </div>
  )
}