import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { CustomersTable } from '@/components/clientes/customers-table'
import { getCustomersWithStats } from '@/lib/queries'

export const metadata: Metadata = { title: 'Clientes' }

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>
}) {
  const { busca } = await searchParams
  const customers = await getCustomersWithStats(busca ?? '')

  return (
    <div>
      <PageHeader title="Clientes" description="Quem comprou com você." />
      <CustomersTable customers={customers} />
    </div>
  )
}