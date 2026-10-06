'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { maskAccount, maskDocument } from '@/lib/format'
import type { BankAccount } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/feedback'
import { Bank, Edit, Plus, Star, Trash } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'
import { isValidDocument } from '@/lib/validators'

const FormSchema = z.object({
  bankCode: z.string().trim().min(1, 'Informe o código do banco.').max(8),
  bankName: z.string().trim().min(2, 'Informe o nome do banco.'),
  agency: z.string().trim().min(1, 'Informe a agência.').max(10),
  account: z.string().trim().min(1, 'Informe a conta.').max(20),
  accountDigit: z.string().trim().max(2).optional(),
  accountType: z.enum(['checking', 'savings']),
  holderName: z.string().trim().min(3, 'Informe o nome do titular.'),
  holderDocument: z
    .string()
    .trim()
    .refine(isValidDocument, 'CPF/CNPJ inválido.'),
  pixKey: z.string().trim().max(140).optional(),
})

type FormValues = z.infer<typeof FormSchema>

const EMPTY: FormValues = {
  bankCode: '',
  bankName: '',
  agency: '',
  account: '',
  accountDigit: '',
  accountType: 'checking',
  holderName: '',
  holderDocument: '',
  pixKey: '',
}

export function BankAccountsManager({ initialAccounts }: { initialAccounts: BankAccount[] }) {
  const router = useRouter()
  const { toast } = useToast()

  const [editing, setEditing] = React.useState<BankAccount | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [removing, setRemoving] = React.useState<BankAccount | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState<FormValues>(EMPTY)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const openCreate = () => {
    setForm(EMPTY)
    setErrors({})
    setCreating(true)
  }

  const openEdit = (account: BankAccount) => {
    setForm({
      bankCode: account.bank_code,
      bankName: account.bank_name,
      agency: account.agency,
      account: account.account,
      accountDigit: account.account_digit ?? '',
      accountType: account.account_type === 'savings' ? 'savings' : 'checking',
      holderName: account.holder_name,
      holderDocument: account.holder_document ?? '',
      pixKey: account.pix_key ?? '',
    })
    setErrors({})
    setEditing(account)
  }

  const close = () => {
    setCreating(false)
    setEditing(null)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    const parsed = FormSchema.safeParse(form)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        next[issue.path.join('.')] = issue.message
      }
      setErrors(next)
      return
    }

    setSaving(true)

    // A gravação passa pela rota de API: é lá que a validação acontece de novo
    // e onde o user_id é derivado do token, não do formulário.
    const request = editing
      ? fetch('/api/bank-accounts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...parsed.data }),
        })
      : fetch('/api/bank-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        })

    const response = await request.catch(() => null)

    if (!response) {
      toast({ title: 'Falha de conexão', description: 'Não foi possível falar com o servidor.', tone: 'error' })
    } else if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast({
        title: editing ? 'Não foi possível atualizar' : 'Não foi possível salvar',
        description: body?.error ?? 'Tente novamente.',
        tone: 'error',
      })
    } else {
      toast({ title: editing ? 'Conta atualizada' : 'Conta adicionada' })
      close()
    }

    setSaving(false)
    router.refresh()
  }

  const makePrimary = async (account: BankAccount) => {
    const supabase = createClient()

    // Duas chamadas porque o índice único permite só uma conta principal por
    // usuário — é preciso liberar a antiga antes de marcar a nova.
    const { error: releaseError } = await supabase
      .from('bank_accounts')
      .update({ is_primary: false })
      .eq('is_primary', true)

    if (releaseError) {
      toast({ title: 'Não foi possível alterar', description: releaseError.message, tone: 'error' })
      return
    }

    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_primary: true })
      .eq('id', account.id)

    if (error) {
      toast({ title: 'Não foi possível definir como principal', description: error.message, tone: 'error' })
      return
    }

    toast({ title: 'Conta definida como principal' })
    router.refresh()
  }

  const remove = async () => {
    if (!removing) return
    const supabase = createClient()

    const { error } = await supabase.from('bank_accounts').delete().eq('id', removing.id)

    if (error) {
      toast({ title: 'Não foi possível remover', description: error.message, tone: 'error' })
    } else {
      toast({ title: 'Conta removida' })
    }

    setRemoving(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Adicionar conta
        </Button>
      </div>

      {initialAccounts.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<Bank />}
            title="Nenhuma conta cadastrada"
            description="Cadastre sua conta bancária para vincular aos repasses."
            action={<Button onClick={openCreate}>Adicionar conta</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {initialAccounts.map((account) => (
            <div key={account.id} className="surface surface-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <Bank className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">
                      {account.bank_name}
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      Código {account.bank_code}
                    </p>
                  </div>
                </div>
                {account.is_primary && (
                  <Badge tone="brand">
                    <Star className="h-3 w-3" />
                    Principal
                  </Badge>
                )}
              </div>

              <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm dark:border-ink-800">
                <Row label="Agência" value={account.agency} />
                <Row
                  label="Conta"
                  value={`${maskAccount(account.account)}${
                    account.account_digit ? `-${account.account_digit}` : ''
                  }`}
                />
                <Row
                  label="Tipo"
                  value={account.account_type === 'savings' ? 'Poupança' : 'Corrente'}
                />
                <Row label="Titular" value={account.holder_name} />
                <Row label="CPF/CNPJ" value={maskDocument(account.holder_document)} />
                {account.pix_key && <Row label="Chave PIX" value={account.pix_key} />}
              </dl>

              <div className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
                <StatusBadge status={account.status} />
                <div className="ml-auto flex items-center gap-1">
                  {!account.is_primary && (
                    <Button variant="ghost" size="sm" onClick={() => makePrimary(account)}>
                      <Star className="h-3.5 w-3.5" />
                      Principal
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(account)} aria-label="Editar conta">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRemoving(account)}
                    aria-label="Remover conta"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário */}
      <Modal
        open={creating || editing !== null}
        onClose={close}
        title={editing ? 'Editar conta' : 'Adicionar conta bancária'}
        description="Os dados serão usados nos repasses."
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={saving}>
              Cancelar
            </Button>
            <Button form="bank-account-form" type="submit" loading={saving}>
              {editing ? 'Salvar alterações' : 'Adicionar conta'}
            </Button>
          </>
        }
      >
        <form id="bank-account-form" onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Código do banco"
              placeholder="001"
              value={form.bankCode}
              onChange={(e) => setForm({ ...form, bankCode: e.target.value })}
              error={errors.bankCode}
            />
            <Input
              label="Nome do banco"
              placeholder="Banco do Brasil"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              error={errors.bankName}
            />
            <Input
              label="Agência"
              placeholder="1234"
              value={form.agency}
              onChange={(e) => setForm({ ...form, agency: e.target.value })}
              error={errors.agency}
            />
            <Input
              label="Conta"
              placeholder="12345678"
              value={form.account}
              onChange={(e) => setForm({ ...form, account: e.target.value })}
              error={errors.account}
            />
            <Input
              label="Dígito"
              placeholder="5"
              value={form.accountDigit}
              onChange={(e) => setForm({ ...form, accountDigit: e.target.value })}
              error={errors.accountDigit}
            />
            <Select
              label="Tipo de conta"
              value={form.accountType}
              onChange={(e) => setForm({ ...form, accountType: e.target.value as 'checking' })}
              options={[
                { value: 'checking', label: 'Corrente' },
                { value: 'savings', label: 'Poupança' },
              ]}
            />
          </div>

          <Input
            label="Nome do titular"
            placeholder="Nome completo ou razão social"
            value={form.holderName}
            onChange={(e) => setForm({ ...form, holderName: e.target.value })}
            error={errors.holderName}
          />

          <Input
            label="CPF/CNPJ"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={form.holderDocument}
            onChange={(e) => setForm({ ...form, holderDocument: e.target.value })}
            error={errors.holderDocument}
            hint="Usado para validar a titularidade. Guardamos com criptografia."
          />

          <Input
            label="Chave PIX"
            placeholder="CPF, e-mail, telefone ou aleatória"
            value={form.pixKey}
            onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
            error={errors.pixKey}
            hint="Opcional. Facilita a identificação dos repasses."
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title="Remover esta conta?"
        description={
          removing
            ? `${removing.bank_name} · agência ${removing.agency} · conta ${maskAccount(removing.account)}`
            : ''
        }
        confirmLabel="Remover"
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-ink-500 dark:text-ink-400">{label}</dt>
      <dd className={cn('truncate text-right font-medium text-ink-900 dark:text-ink-50')}>{value}</dd>
    </div>
  )
}