'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelative } from '@/lib/format'
import type { IntegrationEvent, IntegrationSafe } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { AlertTriangle, Check, Copy, Inbox, Link as LinkIcon, Send, Unlink } from '@/components/ui/icons'
import { EmptyState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'

/**
 * Painel da integração UTMFY.
 *
 * O token do usuário nunca é lido de volta: a tela consulta a view
 * `integrations_safe`, que não expõe `api_token`. Guardar e testar acontecem
 * no servidor, via rota de API — assim a credencial não passa pelo bundle.
 */
export function UtmfyIntegration({
  integration,
  events,
  webhookUrl,
  serverConfigured,
}: {
  integration: IntegrationSafe | null
  events: IntegrationEvent[]
  webhookUrl: string
  serverConfigured: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [token, setToken] = React.useState('')
  const [externalId, setExternalId] = React.useState(integration?.external_id ?? '')
  const [connecting, setConnecting] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [disconnecting, setDisconnecting] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const connected = integration?.connected ?? false

  const call = async (body: unknown, action: 'connect' | 'test' | 'disconnect') => {
    const response = await fetch('/api/integrations/utmfy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return { response, body: await response.json().catch(() => null) }
  }

  const connect = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!token.trim()) {
      toast({ title: 'Informe o API key', tone: 'error' })
      return
    }

    setConnecting(true)
    const { response, body } = await call(
      { action: 'connect', apiToken: token.trim(), externalId: externalId || undefined },
      'connect',
    )

    if (!response.ok) {
      toast({
        title: 'Não foi possível conectar',
        description: body?.error ?? 'Verifique as credenciais.',
        tone: 'error',
      })
    } else {
      toast({ title: 'Integração conectada' })
      setToken('')
    }

    setConnecting(false)
    router.refresh()
  }

  const test = async () => {
    setTesting(true)
    const { response, body } = await call({ action: 'test' }, 'test')

    if (!response.ok || !body?.ok) {
      toast({
        title: 'Teste falhou',
        description: body?.message ?? 'Não foi possível falar com a UTMFY.',
        tone: 'error',
      })
    } else {
      toast({
        title: 'Conexão confirmada',
        description: body.accountName ? `Conta: ${body.accountName}` : body.message,
      })
    }

    setTesting(false)
    router.refresh()
  }

  const disconnect = async () => {
    setDisconnecting(true)
    const { response } = await call({ action: 'disconnect' }, 'disconnect')

    if (response.ok) {
      toast({ title: 'Integração desconectada' })
    } else {
      toast({ title: 'Não foi possível desconectar', tone: 'error' })
    }

    setDisconnecting(false)
    router.refresh()
  }

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: 'URL do webhook copiada' })
    } catch {
      toast({ title: 'Não foi possível copiar', tone: 'error' })
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <div className="space-y-6 xl:col-span-2">
        {/* Cartão da integração */}
        <div className="surface p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="brand-gradient flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white">
                U
              </span>
              <div>
                <h2 className="text-base font-semibold text-white text-white">UTMFY</h2>
                <p className="text-xs text-white/50 text-white/50">
                  Rastreamento e atribuição de vendas
                </p>
              </div>
            </div>
            <Badge tone={connected ? 'positive' : 'neutral'} dot>
              {connected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>

          {!serverConfigured && (
            <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-white/[0.05] p-3.5 border-amber-500/25 bg-white/[0.10]/10">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-white/70 text-white/70" />
              <p className="text-sm text-amber-800 text-amber-300">
                Integração não configurada no servidor. Defina{' '}
                <code className="font-mono text-xs">UTMFY_API_URL</code> para habilitar o teste de
                conexão.
              </p>
            </div>
          )}

          {connected ? (
            <div className="mt-6 space-y-4">
              {integration?.external_id && (
                <Field label="Identificador da integração" value={integration.external_id} />
              )}
              {integration?.last_tested_at && (
                <Field
                  label="Último teste"
                  value={`${formatDateTime(integration.last_tested_at)} (${formatRelative(integration.last_tested_at)})`}
                />
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" onClick={test} loading={testing}>
                  <Send className="h-4 w-4" />
                  Testar conexão
                </Button>
                <Button
                  variant="outline"
                  onClick={disconnect}
                  loading={disconnecting}
                  className="text-red-600 hover:bg-red-50 text-red-400 hover:bg-red-500/10"
                >
                  <Unlink className="h-4 w-4" />
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={connect} className="mt-6 space-y-4">
              <Input
                label="API Key / Token"
                type="password"
                placeholder="Cole o token da sua conta UTMFY"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                icon={<LinkIcon />}
                hint="Armazenado de forma restrita e nunca devolvido ao navegador."
              />

              <Input
                label="Identificador da integração"
                placeholder="Opcional — identificador da conta"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                hint="Se sua conta UTMFY tiver um ID próprio, informe aqui."
              />

              <Button type="submit" loading={connecting} className="w-full">
                Conectar
              </Button>
            </form>
          )}
        </div>

        {/* Webhook */}
        <div className="surface p-6">
          <h2 className="text-base font-semibold text-white text-white">Webhook</h2>
          <p className="mt-1.5 text-sm text-white/50 text-white/50">
            Cadastre esta URL na UTMFY para receber eventos de venda.
          </p>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 border-white/[0.14] bg-white/[0.08]">
            <p className="min-w-0 flex-1 break-all font-mono text-[11px] text-white/60 text-white/70">
              {webhookUrl}
            </p>
            <button
              onClick={copyWebhook}
              aria-label="Copiar URL do webhook"
              className="shrink-0 rounded-lg bg-white p-2 text-white/50 shadow-sm transition-colors hover:text-brand-600 bg-white/[0.2] text-white/70"
            >
              {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <p className="mt-3 text-xs text-white/50 text-white/50">
            Se você definir <code className="font-mono">UTMFY_WEBHOOK_SECRET</code>, as requisições
            serão validadas por assinatura HMAC.
          </p>
        </div>
      </div>

      {/* Eventos recebidos */}
      <div className="xl:col-span-3">
        <div className="surface overflow-hidden">
          <div className="p-5 pb-4">
            <h2 className="text-base font-semibold tracking-tight text-white text-white">
              Eventos recebidos
            </h2>
            <p className="mt-1 text-sm text-white/50 text-white/50">
              Tudo que chegou pelos webhooks
            </p>
          </div>

          {events.length === 0 ? (
            <EmptyState
              icon={<Inbox />}
              title="Nenhum evento recebido"
              description="Conecte a integração e cadastre o webhook para começar a receber eventos."
            />
          ) : (
            <ul className="divide-y divide-white/[0.06] divide-white/[0.06]">
              {events.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white text-white">
                      {event.event}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50 text-white/50">
                      {formatDateTime(event.created_at)} · {formatRelative(event.created_at)}
                    </p>
                    {event.error_message && (
                      <p className="mt-1 text-xs text-red-600 text-red-400">
                        {event.error_message}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden font-mono text-[10px] text-white/50 sm:block">
                      {event.id.slice(0, 8)}
                    </span>
                    <StatusBadge status={event.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="mt-1 text-sm font-medium text-white text-white">{value}</p>
    </div>
  )
}