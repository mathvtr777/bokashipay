import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { isAdmin } from '@/lib/admin'
import { isAdminConfigured } from '@/lib/supabase/admin'
import { AdminWithdrawals } from '@/components/admin/admin-withdrawals'

export const metadata: Metadata = { title: 'Admin · Saques' }

export default async function AdminWithdrawalsPage() {
  if (!(await isAdmin())) redirect('/dashboard')

  return (
    <AdminWithdrawals
      // O cliente busca as solicitações com o service role; sem ele, a fila
      // do admin ficaria silenciosamente vazia.
      adminConfigured={isAdminConfigured()}
    />
  )
}