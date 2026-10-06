import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Cliente com privilégio total (service role). SÓ NO SERVIDOR.
 *
 * Importa 'server-only': qualquer tentativa de puxar este módulo para o bundle
 * do browser quebra o build, o que é a defesa contra vazamento acidental da
 * secret key.
 *
 * Use apenas onde o RLS do usuário não pode ser usado — tipicamente:
 *  - recepção de webhooks (a requisição não tem JWT de usuário);
 *  - processar filas que escrevem em nome de vários usuários;
 *  - gravação de segredos de integração, se decides que só o backend grava.
 *
 * Nunca devolva o resultado direto para o cliente sem filtrar campos sensíveis.
 */
export function createAdminClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secretKey) {
    throw new Error(
      'SUPABASE_SECRET_KEY não configurada. Definida apenas no servidor — nunca no frontend.',
    )
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}