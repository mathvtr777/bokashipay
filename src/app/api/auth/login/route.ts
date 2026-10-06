import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Login com controle de persistência da sessão.
 *
 * "Lembrar acesso" = cookie com maxAge (sobrevive ao fechar o navegador).
 * Sem marcar = cookie de sessão, que morre junto com o navegador.
 *
 * Isso precisa acontecer no servidor: o cookie de sessão do Supabase é
 * httpOnly e gravado pela resposta da rota, não pelo JavaScript do cliente.
 */

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 dias

export async function POST(request: NextRequest) {
  let payload: { email?: string; password?: string; remember?: boolean }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const { email, password, remember = true } = payload

  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
  }

  const cookieStore = request.cookies
  // Cookies são coletados durante o signIn e aplicados na resposta final —
  // no Next 16 eles só saem se forem anexados à Response devolvida.
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
            const base = {
              ...options,
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
            }
            // "Lembrar acesso" = cookie persistente. Sem marcar, cookie de
            // sessão, que morre junto com o navegador.
            collected.push({
              name,
              value,
              options: remember ? { ...base, maxAge: MAX_AGE_SECONDS } : base,
            })
          }
        },
      },
    },
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  // Resposta genérica: não confirma se o e-mail está cadastrado.
  if (error || !data.user) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
  }

  const response = NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
  })

  for (const cookie of collected) {
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  }

  return response
}
