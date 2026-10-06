'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { Transaction } from '@/lib/types'
import { SalesTable } from './sales-table'
import { SaleDetailsModal } from './sale-details-modal'

/**
 * Client component apenas para o modal: a lista vem pronta do servidor.
 * Assim a tabela renderiza no servidor e só o comportamento de abrir o detalhe
 * precisa de JS no cliente.
 */
export function RecentSalesCard({
  transactions,
  compact = false,
}: {
  transactions: (Transaction & { customer?: { name: string } | null })[]
  compact?: boolean
}) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<Transaction | null>(null)

  if (transactions.length === 0) {
    return (
      <SalesTable transactions={[]} onSelect={() => router.push('/pix')} />
    )
  }

  return (
    <>
      <SalesTable
        transactions={transactions}
        onSelect={setSelected}
        compact={compact}
        showFee
      />
      <SaleDetailsModal sale={selected} onClose={() => setSelected(null)} />
    </>
  )
}