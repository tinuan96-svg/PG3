import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// For client-side, we use createBrowserClient from @supabase/ssr to handle PKCE and cookies correctly.
// For server-side (node/edge), we use the standard createClient.
export const supabase = typeof window !== 'undefined'
  ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  : createClient<Database>(supabaseUrl, supabaseAnonKey)
