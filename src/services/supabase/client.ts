import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './types'

let client: SupabaseClient<Database> | undefined

export function getSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
    )
  }

  client ??= createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })

  return client
}
