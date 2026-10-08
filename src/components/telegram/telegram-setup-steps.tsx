'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp, Info } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

/**
 * Card colapsável "Como configurar em 4 passos" — quatro passos
 * numerados, começa colapsado. Clique em "Mostrar" expande.
 */
const STEPS = [
  {
    title: 'Crie o bot no Telegram',
    body: 'Fale com o @BotFather, envie /newbot e siga as instruções. Anote o token que ele te der.',
  },
  {
    title: 'Cole o token aqui na BokashiPay',
    body: 'No botão "Conectar Bot" desta página, cole o token. A BokashiPay valida o token chamando o getMe do Telegram.',
  },
  {
    title: 'Configure o webhook',
    body: 'A BokashiPay gera uma URL de webhook automaticamente. Configure-a no @BotFather com /setwebhook.',
  },
  {
    title: 'Defina os fluxos e ative',
    body: 'Em "Fluxos", monte os gatilhos (ex.: /pix 100) e as respostas automáticas. Ative o bot para começar a receber mensagens.',
  },
]

export function TelegramSetupSteps() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="surface flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
          <Info className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Como configurar em 4 passos</p>
          <p className="text-xs text-white/50">Leia uns 2 minutos. Sem código.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/[0.08]',
        )}
      >
        {open ? 'Ocultar' : 'Mostrar'}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <ol className="mt-3 flex w-full flex-col gap-3 sm:col-span-2 sm:mt-0 sm:flex-row sm:gap-2 sm:pl-12">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-1 flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-semibold text-brand-300">
                  {i + 1}
                </span>
                <p className="text-xs font-semibold text-white">{step.title}</p>
              </div>
              <p className="text-[11px] leading-relaxed text-white/50">{step.body}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}