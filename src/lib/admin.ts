import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * Autorização de administrador.
 *
 * A lista de administradores vem de `ADMIN_USER_EMAILS` no servidor. É uma
 * escolha deliberada em vez de uma coluna `role` no banco: mantém a lista fora
 * do alcance do cliente e permite revogar acesso editando uma variável, sem
 * migration. O custo é que exige reiniciar o servidor para adicionar alguém.
 *
 * A checagem é por e-mail porque é o que o usuário conhece; a comparação é
 * normalizada para minúsculas porque e-mail é case-insensitive.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_USER_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

/** O usuário atual é administrador? */
export async function isAdmin(): Promise<boolean> {
  const allowed = adminEmails()
  if (allowed.length === 0) return false

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return Boolean(user?.email && allowed.includes(user.email.toLowerCase()))
}

/** Lança 403 se o usuário não for administrador. */
export async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new AdminRequiredError()
  }
}

export class AdminRequiredError extends Error {
  constructor() {
    super('Acesso restrito a administradores.')
    this.name = 'AdminRequiredError'
  }
}