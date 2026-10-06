import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { ProductsTable } from '@/components/produtos/products-table'
import { getProducts } from '@/lib/queries'

export const metadata: Metadata = { title: 'Produtos' }

export default async function ProductsPage() {
  const products = await getProducts()
  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Catálogo do seu checkout. Crie produtos, defina preço e ative quando o link estiver pronto pra receber pagamentos."
      />
      <ProductsTable products={products} />
    </div>
  )
}