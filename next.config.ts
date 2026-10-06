import type { NextConfig } from 'next'

/**
 * Cabeçalhos de segurança.
 *
 * `frame-ancestors 'none'` é o mais importante aqui: sem ele, alguém pode
 * Embedder a página de aprovação de saque num site dele e coletar o clique em
 * "Aprovar" — clickjacking num painel que mexe com dinheiro.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    // Só HTTPS depois do primeiro acesso. Incluir desde já quebraria o
    // ambiente local, que ainda é http.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const csp = [
  "default-src 'self'",
  // Next injeta scripts inline no hydration; 'unsafe-inline' é necessário sem
  // nonces, e o nonce por requisição custa complexidade que não se paga aqui.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // API da Pushin Pay é chamada só do servidor, mas o webhook e o front
  // conversam com Supabase direto.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        // O webhook nunca é renderizado; não vale a pena cachear.
        source: '/api/webhooks/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
}

export default nextConfig