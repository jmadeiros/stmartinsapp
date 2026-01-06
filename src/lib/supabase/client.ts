import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'
import { shouldUseMockSupabase, supabaseEnv } from '@/lib/supabase/env'
import { createMockSupabaseClient } from '@/lib/supabase/mock'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (shouldUseMockSupabase) {
    return createMockSupabaseClient() as unknown as ReturnType<typeof createBrowserClient<Database>>
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      supabaseEnv.url!,
      supabaseEnv.anonKey!
    )
  }

  return browserClient
}
