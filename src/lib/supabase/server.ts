import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { shouldUseMockSupabase, supabaseEnv } from '@/lib/supabase/env'
import { createMockSupabaseClient } from '@/lib/supabase/mock'

export async function createClient(): Promise<SupabaseClient<Database>> {
  if (shouldUseMockSupabase) {
    return createMockSupabaseClient() as SupabaseClient<Database>
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseEnv.url!,
    supabaseEnv.anonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
