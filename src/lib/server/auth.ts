import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import type { CookieOptions } from '@supabase/ssr'

/**
 * Server-side Supabase client with cookie bridging.
 *
 * Important: don't throw at module load time (build/dev can run without env).
 */
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_KEY

  if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL')
  if (!supabaseKey) throw new Error('Missing VITE_SUPABASE_KEY')

  return createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
    },
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      setAll(cookies: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookies.forEach((cookie) => {
          setCookie(cookie.name, cookie.value, {
            path: '/',
            sameSite: 'lax',
            ...cookie.options,
          })
        })
      },
    },
  })
}

export const auth = {
  signIn: async (email: string, password: string) => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signUp: async (email: string, password: string) => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getSession: async () => {
    const supabase = getSupabaseServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  getUser: async () => {
    const supabase = getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }
}
