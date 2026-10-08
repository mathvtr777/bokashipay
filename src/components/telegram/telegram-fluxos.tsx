'use client'

import * as React from 'react'
import { Link2, Plus, Workflow } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'
import { NewFlowModal } from './new-flow-modal'

/**
 * Conteúdo da aba "Fluxos" — mostra o conjunto de fluxos automatizados
 * do merchant. Por enquanto é apenas a estrutura visual (sem dados
 * reais, sem persistência). O botão "Criar Fluxo" abre o modal de
 * criação; o editor visual será feito em outro passo.
 */
export function TelegramFluxos() {
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = React.useState(false)

  const openModal = () => setModalOpen(true)
  const closeModal = () => setModalOpen(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/50">Automatize conversas do Telegram com fluxos</p>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Criar Fluxo
        </button>
      </div>

      {/* Card grande com empty state de fluxos */}
      <div className="surface flex flex-col items-center justify-center gap-3 p-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-white/40">
          <Workflow className="h-7 w-7" />
        </span>
        <h3 className="text-base font-semibold text-white">Nenhum fluxo configurado</h3>
        <p className="max-w-sm text-sm text-white/50">
          Crie fluxos automatizados para responder clientes, capturar leads e processar
          pagamentos diretamente no Telegram.
        </p>
        <button
          type="button"
          onClick={openModal}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          <Link2 className="h-4 w-4" />
          Criar primeiro fluxo
        </button>
      </div>

      {/* Card com ideias de fluxos prontos */}
      <div className="surface p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Modelos prontos
        </p>
        <p className="mt-1 text-sm text-white/50">
          Comece com um destes fluxos populares e personalize depois.
        </p>
        <ul className="mt-4 space-y-2">
          {TEMPLATES.map((t) => (
            <li
              key={t.title}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{t.title}</p>
                <p className="truncate text-xs text-white/40">{t.description}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: 'Em breve',
                    description: 'Os modelos de fluxo serão habilitados em breve.',
                  })
                }
                className="shrink-0 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.08]"
              >
                Usar modelo
              </button>
            </li>
          ))}
        </ul>
      </div>

      <NewFlowModal open={modalOpen} onClose={closeModal} />
    </div>
  )
}

const TEMPLATES = [
  {
    title: 'Pix sob demanda',
    description: 'Receba /pix <valor> e gere QR Code + código copia-e-cola.',
  },
  {
    title: 'Carrinho abandonado',
    description: 'Detecta carrinho e envia mensagem 30min depois.',
  },
  {
    title: 'Confirmação de pagamento',
    description: 'Avisa automaticamente quando o PIX é confirmado.',
  },
  {
    title: 'Suporte / dúvidas',
    description: 'Encaminha para humano após 2 mensagens do cliente.',
  },
]