import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '~/lib/database.types'

if (!import.meta.env.VITE_SUPABASE_URL) throw new Error('Missing VITE_SUPABASE_URL')
if (!import.meta.env.VITE_SUPABASE_KEY) throw new Error('Missing VITE_SUPABASE_KEY')

const supabaseClient = createBrowserClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
  {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
    },
  },
)

export default supabaseClient
