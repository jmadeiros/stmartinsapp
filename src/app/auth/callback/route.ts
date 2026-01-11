import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Type for profile query result
interface ProfileResult {
  user_id: string
  full_name: string | null
  organization_id: string | null
  bio: string | null
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      // Check if profile exists and is complete
      const { data: profile } = await (supabase
        .from('user_profiles')
        .select('user_id, full_name, organization_id, bio')
        .eq('user_id', session.user.id)
        .single() as unknown as Promise<{ data: ProfileResult | null; error: unknown }>)

      // New user or incomplete profile -> redirect to onboarding
      if (!profile || !profile.organization_id || !profile.full_name) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  // Existing user with complete profile -> dashboard
  return NextResponse.redirect(`${origin}/dashboard`)
}
