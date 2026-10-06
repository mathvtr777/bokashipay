import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { BankAccountsManager } from '@/components/contas/bank-accounts-manager'
import { getBankAccounts } from '@/lib/queries'

export const metadata: Metadata = { title: 'Contas bancárias' }

export default async function BankAccountsPage() {
  const accounts = await getBankAccounts()
  return (
    <div>
      <PageHeader
        title="Contas bancárias"
        description="Cadastre as contas para receber seus repasses."
      />
      <BankAccountsManager initialAccounts={accounts} />
    </div>
  )
}