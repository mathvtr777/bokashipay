'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDateTime, parseCurrencyInput } from '@/lib/format'
import { classifyPixKey, pixKeyTypeLabel } from '@/lib/pix-key'
import type { WithdrawalRequest } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/feedback'
import { Inbox, Send } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'

/**
 * Solicitação de saque em reais.
 *
 * A tela deixa explícito o que acontece depois do envio: o pedido entra em
 * análise e **nada é pago automaticamente**. Isso evita que o usuário ache que
 * o dinheiro saiu quando na verdade só foi registrado um pedido.
 */
/** Vocabulário do saque — distinto do de vendas, apesar de compartilhar `approved`. */
const SAQUE_LABELS: Record<string, string> = {
  pending: 'Em análise',
  approved: 'Aprovado',
  completed: 'Pago',
  rejected: 'Recusado',
}

const SAQUE_TONES: Record<string, 'positive' | 'neutral' | 'muted' | 'brand'> = {
  pending: 'neutral',
  approved: 'brand',
  completed: 'positive',
  rejected: 'muted',
}

export function WithdrawalRequests({
  initialRequests,
  summary,
  availableBalance,
}: {
  initialRequests: WithdrawalRequest[]
  summary: { pending: number; approved: number; completed: number; rejected: number }
  availableBalance: number
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [amount, setAmount] = React.useState('')
  const [pixKey, setPixKey] = React.useState('')
  const [holderName, setHolderName] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const parsed = parseCurrencyInput(amount)
  const hasValue = parsed !== null && parsed > 0
  const withinBalance = hasValue && parsed! <= availableBalance
  const keyInfo = classifyPixKey(pixKey)
  const keyValid = pixKey.length === 0 || keyInfo.valid
  const nameValid = holderName.trim().length >= 3

  const canSubmit = hasValue && withinBalance && keyInfo.valid && nameValid

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!canSubmit) {
      toast({ title: 'Revise os campos do formulário', tone: 'error' })
      return
    }

    setLoading(true)
    const response = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountBRL: parsed,
        pixKey: pixKey.trim(),
        holderName: holderName.trim(),
      }),
    }).catch(() => null)

    if (!response) {
      toast({ title: 'Falha de conexão', tone: 'error' })
    } else if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast({
        title: 'Não foi possível solicitar',
        description: body?.error ?? 'Tente novamente.',
        tone: 'error',
      })
    } else {
      toast({
        title: 'Solicitação registrada',
        description: 'Seu pedido foi enviado para análise.',
      })
      setAmount('')
      setPixKey('')
      setHolderName('')
    }

    setLoading(false)
    router.refresh()
  }

  const cards = [
    { label: 'Disponível', value: availableBalance, hint: 'Pronto para solicitar' },
    { label: 'Em análise', value: summary.pending + summary.approved, hint: 'Aguardando decisão ou pagamento' },
    { label: 'Já sacado', value: summary.completed, hint: 'Pagamentos concluídos' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="surface p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-white/50 text-white/50">
              {card.label}
            </p>
            <p className="mt-2.5 text-2xl font-semibold tracking-tight text-white text-white">
              {formatCurrency(card.value)}
            </p>
            <p className="mt-1 text-xs text-white/50 text-white/50">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <div className="surface p-6">
            <h2 className="text-base font-semibold tracking-tight text-white text-white">
              Solicitar saque
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/50 text-white/50">
              Envie o pedido para análise. O pagamento é feito manualmente após a aprovação.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <Input
                label="Valor em BRL"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                suffix={<span className="text-sm font-medium">R$</span>}
                error={
                  hasValue && !withinBalance
                    ? `Acima do saldo disponível (${formatCurrency(availableBalance)}).`
                    : undefined
                }
                hint={availableBalance > 0 ? `Disponível: ${formatCurrency(availableBalance)}` : undefined}
              />

              <Input
                label="Chave PIX de destino"
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                error={!keyValid ? 'Chave PIX inválida.' : undefined}
                hint={
                  keyInfo.valid
                    ? `Chave ${pixKeyTypeLabel(keyInfo.type).toLowerCase()} válida.`
                    : undefined
                }
              />

              <Input
                label="Nome do titular"
                placeholder="Quem vai receber o valor"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                error={holderName.length > 0 && !nameValid ? 'Nome muito curto.' : undefined}
                hint="Deve corresponder ao titular da chave PIX."
              />

              <div className="rounded-xl bg-white/[0.04] p-3.5 text-sm bg-white/[0.08]/60">
                <p className="font-medium text-white/80 text-white/90">
                  O saque não é automático
                </p>
                <p className="mt-1 text-white/50 text-white/50">
                  Sua solicitação entra em análise. Nada é transferido antes da aprovação.
                </p>
              </div>

              <Button type="submit" size="lg" loading={loading} disabled={!canSubmit} className="w-full">
                <Send className="h-4 w-4" />
                Solicitar saque
              </Button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="surface overflow-hidden">
            <div className="p-5 pb-4">
              <h2 className="text-base font-semibold tracking-tight text-white text-white">
                Minhas solicitações
              </h2>
              <p className="mt-1 text-sm text-white/50 text-white/50">
                Acompanhe o andamento de cada pedido
              </p>
            </div>

            {initialRequests.length === 0 ? (
              <EmptyState
                icon={<Inbox />}
                title="Nenhuma solicitação por aqui"
                description="Quando você solicitar um saque, o histórico aparece nesta lista."
              />
            ) : (
              <ul className="divide-y divide-white/[0.06] divide-white/[0.06]">
                {initialRequests.map((request) => (
                  <li key={request.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold tabular-nums text-white text-white">
                          {formatCurrency(request.amount_brl)}
                        </p>
                        <p className="mt-0.5 text-xs text-white/50 text-white/50">
                          {formatDateTime(request.created_at)}
                        </p>
                      </div>
                      <Badge tone={SAQUE_TONES[request.status] ?? 'neutral'} dot>
                        {SAQUE_LABELS[request.status] ?? request.status}
                      </Badge>
                    </div>

                    <div className="mt-2.5 space-y-1 text-xs text-white/50 text-white/50">
                      <p>
                        Chave {pixKeyTypeLabel(request.pix_key_type).toLowerCase()}:{' '}
                        <span className="font-mono text-white/70 text-white/80">
                          {request.pix_key}
                        </span>
                      </p>
                      <p>Titular: {request.holder_name}</p>
                      {request.rejection_reason && (
                        <p className="text-red-600 text-red-400">
                          Motivo: {request.rejection_reason}
                        </p>
                      )}
                      {request.payout_reference && (
                        <p>Referência do pagamento: {request.payout_reference}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}