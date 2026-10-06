import 'server-only'

/**
 * Criação de notificações.
 *
 * Usa o cliente admin porque notificações são geradas por eventos do backend
 * (pagamento aprovado, saque concluído) que não têm um JWT de usuário — mas o
 * `user_id` de destino é sempre explícito, nunca derivado do corpo da requisição.
 */
export async function createNotification(params: {
  userId: string
  title: string
  body?: string
  type?: 'info' | 'payment' | 'pix' | 'withdrawal' | 'sale' | 'error'
  link?: string
}): Promise<void> {
  const { createAdminClient, isAdminConfigured } = await import('@/lib/supabase/admin')

  if (!isAdminConfigured()) {
    console.warn('[notifications] SUPABASE_SECRET_KEY ausente — notificação não gravada.')
    return
  }

  const admin = createAdminClient()
  const { error } = await admin.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    body: params.body ?? null,
    type: params.type ?? 'info',
    link: params.link ?? null,
  })

  if (error) {
    console.error('[notifications] falha ao gravar:', error.message)
  }
}