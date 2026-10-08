'use client'

import * as React from 'react'
import { Bot } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

/**
 * Card grande com empty state "Nenhum bot configurado" + ícone do bot em
 * cinza grande + texto explicativo + botão CTA "Conectar Bot do Telegram".
 */
export function TelegramEmptyState() {
  const { toast } = useToast()
  return (
    <div className="surface flex flex-col items-center justify-center gap-3 p-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-white/40">
        <Bot className="h-7 w-7" />
      </span>
      <h3 className="text-base font-semibold text-white">Nenhum bot configurado</h3>
      <p className="max-w-sm text-sm text-white/50">
        Conecte seu primeiro bot do Telegram para começar a automatizar suas vendas e capturar leads.
      </p>
      <button
        type="button"
        onClick={() =>
          toast({
            title: 'Em breve',
            description: 'A conexão com bots do Telegram será habilitada em breve.',
          })
        }
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
      >
        <Bot className="h-4 w-4" />
        Conectar Bot do Telegram
      </button>
    </div>
  )
}