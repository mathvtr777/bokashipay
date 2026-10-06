import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { clientIp, registerLimiter } from '@/lib/security/rate-limit'

/**
 * Register server-side.
 *
 * O `supabase.auth.signUp()` original ia direto do browser pra Supabase
 * Auth API, bypassando qualquer rate limit do servidor. Esta rota existe
 * pra que o rate limit tenha efeito.
 *
 * Comportamento idêntico ao fluxo anterior: cria usuário, dispara o trigger
 * `handle_new_user()` que cria o profile, e grava os cookies de sessão
 * na response.
 */

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 dias (mesma duração do login "lembrar")

export async function POST(request: NextRequest) {
  // 1. Rate limit por IP.
  const ip = clientIp(request)
  const verdict = registerLimiter.hit(ip)
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns instantes.' },
      { status: 429, headers: { 'Retry-After': String(verdict.retryAfterSeconds) } },
    )
  }

  // 2. Parse do body.
  let payload: { email?: string; password?: string; fullName?: string; phone?: string }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const email = payload.email?.trim()
  const password = payload.password
  const fullName = payload.fullName?.trim()
  const phone = payload.phone?.trim() || null

  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
  }
  if (!fullName) {
    return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 })
  }

  // 3. Cria o usuário via admin API (server-side).
  //    Mantemos `email_confirm: true` por compatibilidade com o estado atual
  //    do projeto (mailer_autoconfirm). Quando você configurar SMTP + Confirm
  //    email no painel Supabase, troque pra `email_confirm: false`.
  const collected: { name: string; value: string; options: Record<string, unknown> }[] = []
  const cookieStore = request.cookies

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
              options: {
                ...options,
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                maxAge: MAX_AGE_SECONDS,
              },
            })
          }
        },
      },
    },
  )

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  })

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? 'Não foi possível criar a conta.' },
      { status: 400 },
    )
  }

  // 4. Loga o usuário recém-criado (gera cookies de sessão).
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    // Conta criada mas não consegui logar — usuário pode tentar de novo.
    return NextResponse.json(
      { error: 'Conta criada. Faça login para continuar.' },
      { status: 201 },
    )
  }

  const response = NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
  })
  for (const cookie of collected) {
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  }
  return response
}