'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { Product, ProductCheckoutSettings } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { CheckCircle, Copy, Edit, Plus, Sales, Trash } from '@/components/ui/icons'

/**
 * Lista de produtos do merchant.
 *
 * Fase 1: criar / editar / excluir / alternar status. Checkout público
 * (`/checkout/[slug]`) e webhook de saída são fases seguintes.
 */
export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [editing, setEditing] = React.useState<Product | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [deleting, setDeleting] = React.useState<Product | null>(null)
  const [busy, setBusy] = React.useState(false)

  const onSaved = () => {
    setEditing(null)
    setCreating(false)
    router.refresh()
  }

  const onConfirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    const res = await fetch(`/api/products?id=${deleting.id}`, { method: 'DELETE' })
    setBusy(false)
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      toast({ title: 'Não foi possível excluir', description: body.error, tone: 'error' })
      return
    }
    toast({ title: 'Produto excluído' })
    setDeleting(null)
    router.refresh()
  }

  const onToggleStatus = async (p: Product) => {
    const next = p.status === 'active' ? 'archived' : 'active'
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, status: next }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      toast({ title: 'Falha ao atualizar', description: body.error, tone: 'error' })
      return
    }
    router.refresh()
  }

  const onCopyLink = async (slug: string) => {
    const url = `${window.location.origin}/checkout/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copiado', description: url })
    } catch {
      toast({ title: 'Não foi possível copiar', description: url, tone: 'error' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo produto
        </Button>
      </div>

      <div className="surface overflow-hidden">
        {products.length === 0 ? (
          <EmptyState
            icon={<Sales />}
            title="Nenhum produto cadastrado"
            description="Crie seu primeiro produto para começar a vender com checkout próprio."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Criar primeiro produto
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Slug</th>
                  <th className="text-right">Preço</th>
                  <th>Status</th>
                  <th className="w-1" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <ProductThumb product={p} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white text-white">
                            {p.name}
                          </p>
                          {p.description && (
                            <p className="line-clamp-1 text-xs text-white/50 text-white/50">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-xs text-white/70 bg-white/[0.08] text-white/70">
                        /{p.slug}
                      </code>
                    </td>
                    <td className="text-right tabular-nums">
                      {formatCurrency(p.price_cents / 100)}
                    </td>
                    <td>
                      <ProductStatusBadge status={p.status} />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onCopyLink(p.slug)}
                          aria-label="Copiar link de checkout"
                          title="Copiar link de checkout"
                          disabled={p.status !== 'active'}
                          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 hover:bg-white/[0.08] hover:text-white"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(p)}
                          aria-label={
                            p.status === 'active' ? 'Arquivar produto' : 'Ativar produto'
                          }
                          title={
                            p.status === 'active' ? 'Arquivar' : 'Ativar'
                          }
                          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white hover:bg-white/[0.08] hover:text-white"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditing(p)}
                          aria-label="Editar produto"
                          title="Editar"
                          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white hover:bg-white/[0.08] hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
                          aria-label="Excluir produto"
                          title="Excluir"
                          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-red-50 hover:text-red-600 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <ProductFormModal
          onClose={() => setCreating(false)}
          onSaved={onSaved}
        />
      )}
      {editing && (
        <ProductFormModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
      {deleting && (
        <ConfirmDialog
          open
          onClose={() => !busy && setDeleting(null)}
          onConfirm={onConfirmDelete}
          loading={busy}
          title="Excluir produto"
          description={`Esta ação não pode ser desfeita. O produto "${deleting.name}" será removido.`}
          confirmLabel="Excluir"
          tone="danger"
        />
      )}
    </div>
  )
}

function ProductStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: string }> = {
    active: { label: 'Ativo', tone: 'bg-white/[0.05] text-white bg-white/[0.08]/10 text-emerald-300' },
    draft: { label: 'Rascunho', tone: 'bg-white/[0.04] text-white/70 bg-white/[0.08] text-white/70' },
    archived: { label: 'Arquivado', tone: 'bg-white/[0.05] text-white/70 bg-white/[0.10]/10 text-amber-300' },
  }
  const item = map[status] ?? { label: status, tone: 'bg-white/[0.04] text-white/70' }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', item.tone)}>
      {item.label}
    </span>
  )
}

function ProductThumb({ product }: { product: Product }) {
  if (product.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={product.image_url}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
      />
    )
  }
  const initials = product.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0] ?? '')
    .join('')
    .toUpperCase() || 'P'
  return (
    <span className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white">
      {initials}
    </span>
  )
}

// =============================================================================
// Formulário (criar / editar)
// =============================================================================

function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product?: Product
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const isEdit = Boolean(product)
  const initialSettings = (product?.checkout_settings ?? {}) as ProductCheckoutSettings
  const [name, setName] = React.useState(product?.name ?? '')
  const [slug, setSlug] = React.useState(product?.slug ?? '')
  const [slugTouched, setSlugTouched] = React.useState(Boolean(product))
  const [description, setDescription] = React.useState(product?.description ?? '')
  const [priceText, setPriceText] = React.useState(
    product ? (product.price_cents / 100).toFixed(2).replace('.', ',') : '',
  )
  const [imageUrl, setImageUrl] = React.useState(product?.image_url ?? '')
  const [status, setStatus] = React.useState<string>(product?.status ?? 'draft')
  const [model, setModel] = React.useState<string>(product?.model ?? 'one_time')
  // Personalização do checkout
  const [primaryColor, setPrimaryColor] = React.useState(initialSettings.primaryColor ?? '#8b5cf6')
  const [bannerUrl, setBannerUrl] = React.useState(initialSettings.bannerUrl ?? '')
  const [successMessage, setSuccessMessage] = React.useState(
    initialSettings.successMessage ?? '',
  )
  const [requirePhone, setRequirePhone] = React.useState(Boolean(initialSettings.requirePhone))
  const [requireDocument, setRequireDocument] = React.useState(Boolean(initialSettings.requireDocument))
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Slug automático a partir do nome (só quando o usuário não editou o slug).
  React.useEffect(() => {
    if (slugTouched) return
    setSlug(slugify(name))
  }, [name, slugTouched])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)

    const priceCents = parseBrlToCents(priceText)
    if (priceCents === null) {
      setError('Preço inválido.')
      setBusy(false)
      return
    }

    const checkoutSettings: ProductCheckoutSettings = {
      primaryColor: primaryColor || undefined,
      bannerUrl: bannerUrl.trim() || undefined,
      successMessage: successMessage.trim() || undefined,
      requirePhone,
      requireDocument,
    }
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      price_cents: priceCents,
      image_url: imageUrl.trim() || null,
      status,
      model,
      checkout_settings: checkoutSettings,
    }

    const res = await fetch('/api/products', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { id: product!.id, ...payload } : payload),
    })
    setBusy(false)

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setError(body.error ?? 'Erro ao salvar.')
      return
    }
    toast({ title: isEdit ? 'Produto atualizado' : 'Produto criado' })
    onSaved()
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={isEdit ? 'Editar produto' : 'Novo produto'}
      description="Defina nome, preço e slug. O slug vira a URL do checkout público."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={busy} type="submit" form="product-form">
            Salvar
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
              Nome
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Curso de Marketing"
              maxLength={100}
              required
            />
          </div>
          <div>
            <label htmlFor="slug" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
              Slug
            </label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugTouched(true)
              }}
              placeholder="curso-de-marketing"
              maxLength={60}
              required
            />
            <p className="mt-1 text-[11px] text-white/50 text-white/50">
              letras minúsculas, números e hífens. Vira a URL do checkout.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
            Descrição
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que o cliente recebe ao comprar."
            rows={3}
            maxLength={2000}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
              Preço
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/50">
                R$
              </span>
              <input
                id="price"
                value={priceText}
                onChange={(e) => setPriceText(e.target.value)}
                placeholder="99,90"
                inputMode="decimal"
                className="h-9 w-full rounded-xl border border-white/[0.08] bg-white pl-10 pr-3 text-sm tabular-nums text-white transition-all placeholder:text-white/50 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12 border-white/[0.14] bg-ink-900 text-white"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
              Status
            </label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'draft', label: 'Rascunho' },
                { value: 'active', label: 'Ativo' },
                { value: 'archived', label: 'Arquivado' },
              ]}
            />
          </div>
        </div>

        <div>
          <label htmlFor="image" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
            URL da imagem de capa
          </label>
          <Input
            id="image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            type="url"
          />
          <p className="mt-1 text-[11px] text-white/50 text-white/50">
            Cole um link. Upload de imagem direto pra cá vem em fase seguinte.
          </p>
        </div>

        {/* Modelo de cobrança */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
            Modelo de cobrança
          </label>
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] bg-white px-3 py-2.5 text-sm border-white/[0.14] bg-ink-900">
              <input
                type="radio"
                name="model"
                value="one_time"
                checked={model === 'one_time'}
                onChange={() => setModel('one_time')}
                className="accent-brand-500"
              />
              <div>
                <p className="font-medium text-white text-white">Venda única</p>
                <p className="text-[11px] text-white/50 text-white/50">
                  Cobrança PIX avulsa
                </p>
              </div>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] bg-white px-3 py-2.5 text-sm border-white/[0.14] bg-ink-900">
              <input
                type="radio"
                name="model"
                value="subscription"
                checked={model === 'subscription'}
                onChange={() => setModel('subscription')}
                className="accent-brand-500"
              />
              <div>
                <p className="font-medium text-white text-white">Assinatura</p>
                <p className="text-[11px] text-white/50 text-white/50">
                  Recorrência (em breve)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Personalização do checkout */}
        <fieldset className="space-y-3 rounded-xl border border-white/[0.08] p-4 border-white/[0.14]">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-white/50 text-white/50">
            Personalização do checkout
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="primaryColor" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
                Cor primária
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-white/[0.08] bg-white border-white/[0.14] bg-ink-900"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  maxLength={9}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bannerUrl" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
                Banner (URL)
              </label>
              <Input
                id="bannerUrl"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>

          <div>
            <label htmlFor="successMessage" className="mb-1.5 block text-xs font-medium text-white/70 text-white/80">
              Mensagem de sucesso
            </label>
            <Textarea
              id="successMessage"
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              placeholder="Pagamento confirmado! Em breve você recebe o produto por e-mail."
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2 text-xs text-white/70 text-white/80">
              <input
                type="checkbox"
                checked={requirePhone}
                onChange={(e) => setRequirePhone(e.target.checked)}
                className="h-4 w-4 accent-brand-500"
              />
              Pedir telefone
            </label>
            <label className="flex items-center gap-2 text-xs text-white/70 text-white/80">
              <input
                type="checkbox"
                checked={requireDocument}
                onChange={(e) => setRequireDocument(e.target.checked)}
                className="h-4 w-4 accent-brand-500"
              />
              Pedir CPF
            </label>
          </div>
        </fieldset>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 border-red-500/30 bg-red-500/10 text-red-300">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

// =============================================================================
// Helpers
// =============================================================================

/** "99,90" ou "99.90" ou "99" → 9990 centavos. Devolve null se inválido. */
function parseBrlToCents(text: string): number | null {
  const normalized = text.replace(/\./g, '').replace(',', '.').trim()
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100)
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}