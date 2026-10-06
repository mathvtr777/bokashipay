import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin'
import { getUtmfyClient } from '@/services/utmfy'

/**
 * Connect / test / disconnect da UTMFY.
 *
 * O token é gravado pelo cliente admin (service role) porque é credencial —
 * mas o `user_id` continua vindo do JWT da sessão, então um usuário nunca
 * consegue gravar credencial na conta de outro. E o token nunca volta para o
 * navegador: quem lê é a view `integrations_safe`.
 */

const Schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('connect'),
    apiToken: z.string().trim().min(8, 'Token inválido.').max(400),
    externalId: z.string().trim().max(120).optional(),
  }),
  z.object({ action: z.literal('test') }),
  z.object({ action: z.literal('disconnect') }),
])

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'SUPABASE_SECRET_KEY não configurada no servidor.' },
      { status: 500 },
    )
  }

  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  // Identidade do usuário vem do cookie de sessão, do corpo não.
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const admin = createAdminClient()
  const client = getUtmfyClient()

  switch (parsed.data.action) {
    case 'connect': {
      // Testa antes de gravar: conectar com token inválido deixaria a conta
      // marcada como conectada sem funcionar.
      const result = await client.testConnection(parsed.data.apiToken)

      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      const { error } = await admin.from('integrations').upsert(
        {
          user_id: user.id,
          provider: 'utmfy',
          api_token: parsed.data.apiToken,
          external_id: parsed.data.externalId ?? result.accountName ?? null,
          connected: true,
          last_tested_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      )

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ ok: true, accountName: result.accountName })
    }

    case 'test': {
      const { data } = await admin
        .from('integrations')
        .select('api_token')
        .eq('user_id', user.id)
        .eq('provider', 'utmfy')
        .maybeSingle()

      const token = data?.api_token
      if (!token) {
        return NextResponse.json({ error: 'Nenhum token configurado.' }, { status: 400 })
      }

      const result = await client.testConnection(token)

      await admin
        .from('integrations')
        .update({ last_tested_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('provider', 'utmfy')

      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    case 'disconnect': {
      // Remove a credencial, não apenas a flag — um token orfão não deve ficar
      // no banco depois que o usuário desconectou.
      const { error } = await admin
        .from('integrations')
        .update({ connected: false, api_token: null })
        .eq('user_id', user.id)
        .eq('provider', 'utmfy')

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ ok: true })
    }
  }
}