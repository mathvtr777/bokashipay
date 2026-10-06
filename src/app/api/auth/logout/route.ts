import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Logout server-side.
 *
 * O `supabase.auth.signOut()` rodando só no cliente não basta: os cookies de
 * sessão são httpOnly e foram setados pelo proxy/rotas server-side. Limpar
 * a sessão localmente deixa o cookie "velho" válido até expirar, e o proxy
 * continua enxergando o usuário como logado.
 *
 * Esta rota usa `createServerClient` (igual à de login) pra que o `setAll`
 * receba os cookies de expiração e os propague na response — aí o navegador
 * realmente perde a sessão.
 */

export async function POST(request: NextRequest) {
  const cookieStore = request.cookies
  const collected: {
    name: string
    value: string
    options: Record<string, unknown>
  }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            collected.push({
              name,
              value,
              options: { ...options, path: '/' },
            })
          }
        },
      },
    },
  )

  await supabase.auth.signOut()

  const response = NextResponse.json({ ok: true })
  for (const cookie of collected) {
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  }
  return response
}