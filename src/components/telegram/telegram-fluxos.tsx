'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Plus, Workflow, Trash, Edit } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'
import { NewFlowModal } from './new-flow-modal'
import type { TelegramFlow } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface TelegramFluxosProps {
  flows?: TelegramFlow[]
  bots?: { id: string; name: string }[]
}

export function TelegramFluxos({ flows = [], bots = [] }: TelegramFluxosProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = React.useState(false)
  const [selectedBot, setSelectedBot] = React.useState<string | null>(null)

  const openModal = () => setModalOpen(true)
  const closeModal = () => setModalOpen(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/50">Automatize conversas do Telegram com fluxos</p>
        <Button
          onClick={openModal}
          className="inline-flex items-center gap-1.5 bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white shadow-glow hover:brightness-110 active:scale-[0.98]"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Criar Fluxo
        </Button>
      </div>

      {/* Lista de fluxos ou empty state */}
      {flows.length > 0 ? (
        <FlowsList flows={flows} bots={bots} />
      ) : (
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
      )}

      {/* Modelos */}
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
                onClick={() => setSelectedBot(t.template_id ?? null)}
                className="shrink-0 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.08]"
              >
                Usar modelo
              </button>
            </li>
          ))}
        </ul>
      </div>

      <NewFlowModal
        open={modalOpen}
        onClose={closeModal}
        bots={bots}
        selectedBotId={selectedBot}
      />
    </div>
  )
}

function FlowsList({ flows, bots }: { flows: TelegramFlow[]; bots: { id: string; name: string }[] }) {
  const router = useRouter()
  const { toast } = useToast()

  const toggleFlow = async (flow: TelegramFlow) => {
    const res = await fetch(`/api/telegram/flows/${flow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !flow.active }),
    })
    if (res.ok) {
      toast({ title: flow.active ? 'Fluxo desativado' : 'Fluxo ativado' })
      router.refresh()
    } else {
      const data = await res.json()
      toast({ title: 'Erro', description: data.error, tone: 'error' })
    }
  }

  const deleteFlow = async (flow: TelegramFlow) => {
    if (!confirm(`Remover o fluxo "${flow.name}"?`)) return
    const res = await fetch(`/api/telegram/flows/${flow.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Fluxo removido' })
      router.refresh()
    } else {
      const data = await res.json()
      toast({ title: 'Erro', description: data.error, tone: 'error' })
    }
  }

  const getBotName = (botId: string | null) => {
    if (!botId) return null
    return bots.find((b) => b.id === botId)?.name ?? null
  }

  return (
    <div className="surface space-y-3 p-0">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Fluxos ({flows.length})
        </p>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {flows.map((flow) => {
          const botName = getBotName(flow.bot_id)
          return (
            <div
              key={flow.id}
              className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{flow.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {flow.description ? (
                    <p className="truncate text-xs text-white/40">{flow.description}</p>
                  ) : null}
                  {botName && (
                    <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/40">
                      {botName}
                    </span>
                  )}
                  {flow.trigger_value ? (
                    <span className="shrink-0 rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[10px] text-brand-400">
                      /{flow.trigger_value}
                    </span>
                  ) : null}
                  {flow.runs_count > 0 && (
                    <span className="shrink-0 text-[10px] text-white/30">
                      {flow.runs_count}x executado
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3">
                <button
                  type="button"
                  onClick={() => toggleFlow(flow)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                    flow.active
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-white/[0.04] text-white/30 hover:text-white/60 hover:bg-white/[0.08]',
                  )}
                  title={flow.active ? 'Desativar fluxo' : 'Ativar fluxo'}
                >
                  {flow.active ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
                      <circle cx="12" cy="12" r="5" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => deleteFlow(flow)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Remover fluxo"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const TEMPLATES = [
  {
    title: 'Pix sob demanda',
    description: 'Receba /pix <valor> e gere QR Code + código copia-e-cola.',
    template_id: 'pix_demand',
    steps: [{ type: 'send_message', text: 'Gerando QR Code PIX...' }],
  },
  {
    title: 'Confirmação de pagamento',
    description: 'Avisa automaticamente quando o PIX é confirmado.',
    template_id: 'payment_confirm',
    steps: [{ type: 'send_message', text: '✅ Pagamento confirmado! Seu pedido está sendo processado.' }],
  },
  {
    title: 'Captura de leads',
    description: 'Coleta nome e e-mail do cliente automaticamente.',
    template_id: 'lead_capture',
    steps: [{ type: 'send_message', text: 'Olá! Para continuar, informe seu nome e e-mail.' }],
  },
  {
    title: 'Suporte / dúvidas',
    description: 'Encaminha para humano após 2 mensagens do cliente.',
    template_id: 'support',
    steps: [{ type: 'send_message', text: 'Um de nossos atendentes vai te ajudar em breve!' }],
  },
]
