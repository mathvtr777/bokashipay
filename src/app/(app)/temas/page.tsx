import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { BioLinksEditor } from '@/components/temas/bio-links-editor'
import { getBioPage, countBioPages } from '@/lib/queries'

export const metadata: Metadata = { title: 'Temas' }

/** Domínio público do sistema — fixo, conforme combinado com o usuário. */
const PUBLIC_DOMAIN = 'pagueaqui.xyz'
const PUBLIC_BASE = `https://${PUBLIC_DOMAIN}/u/`

export default async function TemasPage() {
  // Server-side: carrega a página existente (se houver) e a contagem
  // para o card "Suas páginas (X/10)". Se a tabela não existe ainda
  // (migration não rodada), os dois retornam null/0 e o editor abre
  // com valores vazios.
  const [page, count] = await Promise.all([getBioPage(), countBioPages()])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Links"
        description="Bio pública e links privados de checkout."
      />
      <BioLinksEditor
        publicBase={PUBLIC_BASE}
        initial={{
          slug: page?.slug ?? '',
          displayName: page?.display_name ?? '',
          bio: page?.bio ?? '',
          avatarUrl: page?.avatar_url ?? null,
        }}
        count={count}
        max={10}
      />
    </div>
  )
}