import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Proteção de rotas e refresh de sessão.
 *
 * Duas funções:
 *  1. Renovar o access token a partir do refresh token, escrevendo o cookie
 *     novo. Só um Server Component/Route Handler pode fazer isso, então é
 *     exatamente por isso que o arquivo existe.
 *  2. Bloquear /dashboard e demais páginas privadas quando não há sessão,
 *     redirecionando para /login. Isso é UX, não segurança: a segurança real
 *     está no RLS, que vale mesmo se alguém forçar a URL.
 */

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth']

const PROTECTED_PREFIXES = [
  '/dashboard', '/vendas', '/pix', '/financeiro', '/clientes',
  '/contas-bancarias', '/saques', '/integracoes', '/configuracoes', '/perfil',
  '/ajuda', '/admin',
]

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          // É aqui que o access token renovado é persistido. Uma página
          // (Server Component) não tem como escrever cookies, então o refresh
          // de sessão precisa acontecer neste arquivo.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'lax',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
            })
          })
        },
      },
    },
  )

  // getUser() valida o JWT contra o servidor de auth; getSession() apenas lê o
  // cookie. Só o primeiro é confiável para decidir autorização.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = pathname === '/dashboard' ? '' : `?redirectTo=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(url)
  }

  // Já autenticado não precisa ver login/cadastro.
  if (user && PUBLIC_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}