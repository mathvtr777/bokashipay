import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

/**
 * Cliente Supabase para Server Components e Route Handlers.
 *
 * Depende dos cookies da requisição para saber quem está logado — inclusive
 * dentro do RLS, já que o access token viaja no cookie de sessão.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Components não podem escrever cookies. O proxy.ts trata o
            // refresh de sessão, então ignorar aqui é o comportamento esperado.
          }
        },
      },
    },
  )
}