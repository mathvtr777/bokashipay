import * as React from 'react'
import type { Metadata } from 'next'
import { PixGenerator } from '@/components/pix/pix-generator'
import { getPixTransactions } from '@/lib/queries'

export const metadata: Metadata = { title: 'Gerar PIX' }

export default async function PixPage() {
  const pixTransactions = await getPixTransactions(50)

  // O status de "provedor configurado" é lido no servidor e passado ao cliente,
  // para o estado correto já vir na primeira renderização (sem flash de UI).
  const { getPixProvider } = await import('@/services/pix')
  const providerConfigured = getPixProvider().isConfigured()

  return (
    <PixGenerator initialItems={pixTransactions} providerConfigured={providerConfigured} />
  )
}