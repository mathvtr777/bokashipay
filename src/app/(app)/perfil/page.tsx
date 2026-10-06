import * as React from 'react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { ProfileForm } from '@/components/perfil/profile-form'
import { SecuritySection } from '@/components/perfil/security-section'
import { getProfile } from '@/lib/queries'
import { requireUser } from '@/lib/queries'

export const metadata: Metadata = { title: 'Perfil' }

export default async function ProfilePage() {
  const user = await requireUser()
  const profile = await getProfile()

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Seus dados e a segurança da conta." />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ProfileForm
            profile={profile}
            email={user.email ?? ''}
            createdAt={user.created_at}
          />
        </div>
        <div className="xl:col-span-2">
          <SecuritySection />
        </div>
      </div>
    </div>
  )
}