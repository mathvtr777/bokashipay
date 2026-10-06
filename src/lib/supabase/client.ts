import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

/**
 * Cliente Supabase para o navegador.
 *
 * Usa apenas a publishable key — que é pública por design no modelo do Supabase.
 * Nenhuma secret key pode aparecer aqui: as operações sensíveis (emitir PIX de
 * verdade, executar saque, gravar token de integração) acontecem em rotas de API
 * do servidor.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}