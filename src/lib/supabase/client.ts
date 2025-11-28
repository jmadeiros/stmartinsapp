import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { shouldUseMockSupabase, supabaseEnv } from '@/lib/supabase/env'
import { createMockSupabaseClient } from '@/lib/supabase/mock'

export function createClient(): SupabaseClient<Database> {
  if (shouldUseMockSupabase) {
    return createMockSupabaseClient() as SupabaseClient<Database>
  }

  return createBrowserClient<Database>(
    supabaseEnv.url!,
    supabaseEnv.anonKey!
  )
}
