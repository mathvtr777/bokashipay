'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { CheckCircle, Info, X, AlertTriangle } from '@/components/ui/icons'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; tone?: ToastTone }) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return context
}

const TONE_STYLES: Record<ToastTone, { icon: React.ReactNode; accent: string }> = {
  success: { icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, accent: 'bg-emerald-500' },
  error: { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, accent: 'bg-red-500' },
  info: { icon: <Info className="h-4 w-4 text-brand-500" />, accent: 'bg-brand-500' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const [mounted, setMounted] = React.useState(false)
  const counter = React.useRef(0)

  React.useEffect(() => setMounted(true), [])

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    ({ title, description, tone = 'success' }: { title: string; description?: string; tone?: ToastTone }) => {
      const id = ++counter.current
      setToasts((current) => [...current, { id, title, description, tone }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="true"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end"
          >
            {toasts.map((item) => (
              <div
                key={item.id}
                role="status"
                className="pointer-events-auto relative flex w-full max-w-sm animate-slide-up items-start gap-3 overflow-hidden rounded-xl border border-ink-200 bg-white p-4 shadow-lg dark:border-ink-700 dark:bg-ink-800"
              >
                <span className="mt-0.5 shrink-0">{TONE_STYLES[item.tone].icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{item.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(item.id)}
                  aria-label="Fechar"
                  className="shrink-0 rounded p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {/* Barra de tempo restante: esvazia ao longo da duração do toast. */}
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-0.5 w-full origin-left',
                    TONE_STYLES[item.tone].accent,
                  )}
                  style={{ animation: 'toast-shrink 4.5s linear forwards' }}
                />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}