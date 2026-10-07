'use client'

import * as React from 'react'
import { Link2, Link as LinkIcon, User, Plus, UploadCloud } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

/**
 * Editor de "Meus Links" — duas abas (Bio Link / Link Privado) com
 * preview ao vivo de celular à direita. Sem persistência: o botão
 * "Criar Bio Link" chama a API `/api/bio-pages` que grava na tabela
 * `bio_pages` (migration 0008).
 */
type Tab = 'bio' | 'private'

const SLUG_RE = /^[a-z0-9_-]{3,52}$/

export function BioLinksEditor({
  publicBase,
  initial,
  count,
  max,
}: {
  publicBase: string
  initial: { slug: string; displayName: string; bio: string; avatarUrl: string | null }
  count: number
  max: number
}) {
  const [tab, setTab] = React.useState<Tab>('bio')
  const [slug, setSlug] = React.useState(initial.slug)
  const [displayName, setDisplayName] = React.useState(initial.displayName)
  const [bio, setBio] = React.useState(initial.bio)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(initial.avatarUrl)
  const [saving, setSaving] = React.useState(false)
  const { toast } = useToast()

  // Slug limpo (sem caracteres inválidos) para o preview e a validação.
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 52)
  const slugValid = cleanSlug.length >= 3
  const bioCount = bio.length
  const bioOver = bioCount > 280

  // Iniciais para o preview (e fallback do avatar).
  const initials = (displayName || cleanSlug || 'S')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'JPG ou PNG até 8MB.', tone: 'error' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarUrl(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!slugValid) {
      toast({ title: 'Slug inválido', description: 'Use 3-52 letras minúsculas, números, _ ou -.', tone: 'error' })
      return
    }
    if (bioOver) {
      toast({ title: 'Bio muito longa', description: `Limite de 280 caracteres (você tem ${bioCount}).`, tone: 'error' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/bio-pages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: cleanSlug,
          displayName: displayName.trim(),
          bio: bio,
          avatarUrl,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Erro ${res.status}`)
      }
      toast({ title: 'Bio salva', description: `${publicBase}${cleanSlug}` })
    } catch (err) {
      toast({
        title: 'Não foi possível salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1">
        <button
          type="button"
          onClick={() => setTab('bio')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
            tab === 'bio' ? 'brand-gradient text-white shadow-sm' : 'text-white/60 hover:text-white',
          )}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Bio Link
        </button>
        <button
          type="button"
          onClick={() => setTab('private')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
            tab === 'private' ? 'brand-gradient text-white shadow-sm' : 'text-white/60 hover:text-white',
          )}
        >
          <Link2 className="h-3.5 w-3.5" />
          Link Privado
          <span className="ml-1 rounded-full bg-brand-500/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-200">
            Novo
          </span>
        </button>
      </div>

      {tab === 'bio' ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <p className="text-sm text-white/50">
              Crie sua página pública estilo Linktree e venda direto pelo Telegram, Instagram ou onde quiser
            </p>

            {/* Suas páginas */}
            <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
                  <LinkIcon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Suas páginas</p>
                  <p className="text-xs text-white/40">
                    Você pode ter até {max} páginas (uma por nicho, marca ou campanha).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/60">
                  {count}/{max}
                </span>
                <button
                  type="button"
                  onClick={() => toast({ title: 'Em breve', description: 'Múltiplas páginas em breve.' })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nova Bio Link
                </button>
              </div>
            </div>

            {/* Endereço da página */}
            <Card
              icon={<Link2 className="h-4 w-4" />}
              title="Escolha o endereço da sua página"
              hint="Esse é o link que você vai compartilhar (no bio do Instagram, TikTok, etc.)."
            >
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  URL pública
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 flex-1 items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white/60">
                    {publicBase}
                  </div>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="seuusuario"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className={cn(
                      'h-10 w-44 rounded-xl border bg-white/[0.04] px-3 text-sm text-white transition-colors',
                      'placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-brand-500/15',
                      slugValid || slug === ''
                        ? 'border-white/[0.08] focus:border-brand-500'
                        : 'border-red-500/60 focus:border-red-500',
                    )}
                  />
                </div>
                <p className="text-[11px] text-white/40">
                  3-52 caracteres: letras minúsculas, números, _ e -
                </p>
              </div>
            </Card>

            {/* Identidade */}
            <Card
              icon={<User className="h-4 w-4" />}
              title="Personalize a sua identidade"
              hint="Foto, nome, bio e — o que o visitante vê no topo da página."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Nome de exibição
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome ou marca"
                      className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white transition-colors placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Foto / Avatar
                    </label>
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white transition-colors hover:bg-white/[0.08]">
                      <UploadCloud className="h-4 w-4" />
                      Enviar foto
                      <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={onPickFile} />
                    </label>
                  </div>
                </div>
                <p className="text-[11px] text-white/40">JPG ou PNG até 8MB</p>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 280))}
                    placeholder="Uma descrição curta sobre você ou seu negócio"
                    rows={3}
                    className={cn(
                      'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white transition-colors placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15',
                      bioOver && 'border-red-500/60',
                    )}
                  />
                  <p className={cn('text-[11px]', bioOver ? 'text-red-400' : 'text-white/40')}>
                    {bioCount}/280
                  </p>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <div className="surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Pronto para criar sua página?</p>
                <p className="text-xs text-white/50">Depois de criar, você poderá adicionar botões.</p>
              </div>
              <button
                type="button"
                onClick={save}
                disabled={saving || !slugValid || bioOver}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all',
                  'hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
                )}
              >
                <LinkIcon className="h-4 w-4" />
                {saving ? 'Salvando…' : 'Criar Bio Link'}
              </button>
            </div>
          </div>

          {/* Pré-visualização */}
          <div className="hidden xl:block">
            <Preview
              publicBase={publicBase}
              slug={cleanSlug}
              displayName={displayName}
              avatarUrl={avatarUrl}
              initials={initials}
            />
          </div>
        </div>
      ) : (
        <div className="surface p-8 text-center">
          <p className="text-sm font-semibold text-white">Link Privado</p>
          <p className="mt-2 text-xs text-white/50">
            Em breve. Cobre checkout individual sem expor a lista de produtos da sua loja.
          </p>
        </div>
      )}
    </div>
  )
}

function Card({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="surface p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {hint && <p className="text-xs text-white/40">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Preview({
  publicBase,
  slug,
  displayName,
  avatarUrl,
  initials,
}: {
  publicBase: string
  slug: string
  displayName: string
  avatarUrl: string | null
  initials: string
}) {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
        Pré-visualização
      </p>
      {/* Mock de celular */}
      <div className="relative w-[280px] rounded-[36px] border border-white/[0.10] bg-ink-950 p-3 shadow-2xl">
        {/* Notch */}
        <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-white/[0.08]" />
        {/* Tela */}
        <div
          className="relative overflow-hidden rounded-[24px] border border-white/[0.08]"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(217,119,6,0.55), rgba(120,53,15,0.65) 40%, rgba(0,0,0,0.95) 100%)',
          }}
        >
          <div className="flex min-h-[440px] flex-col items-center justify-center gap-2 p-8 text-center">
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 text-2xl font-semibold text-white shadow-xl ring-2 ring-white/40">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                initials || 'S'
              )}
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-orange-700" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">
              {displayName || slug || 'seuusuário'}
            </p>
            <p className="text-xs text-white/60">@{slug || 'seuusuário'}</p>
            <p className="mt-12 text-xs text-white/50">Sem links por aqui ainda.</p>
          </div>
        </div>
        {/* URL pública embaixo */}
        <p className="mt-3 truncate text-center text-[10px] text-white/40">
          {publicBase}{slug || 'seuusuario'}
        </p>
      </div>
    </div>
  )
}