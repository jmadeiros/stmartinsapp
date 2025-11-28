const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BYPASS_FLAG =
  process.env.BYPASS_SUPABASE === "true" ||
  process.env.NEXT_PUBLIC_BYPASS_SUPABASE === "true"

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
export const shouldUseMockSupabase = BYPASS_FLAG || !isSupabaseConfigured

export const supabaseEnv = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
}


