import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/lib/database.types'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

export function getSupabaseAnonClient() {
  return createClient<Database>(requireEnv('VITE_SUPABASE_URL'), requireEnv('VITE_SUPABASE_KEY'))
}

export function getSupabaseServiceRoleClient() {
  return createClient<Database>(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}
