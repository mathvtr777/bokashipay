import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const c = createClient<Database>('u','k')
export const q = c.from('customers').select('*')
export const t = c.from('customers').update({ name: 'x' })
