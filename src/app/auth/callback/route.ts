import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Type for profile query result
interface ProfileResult {
  user_id: string
  full_name: string | null
  organization_id: string | null
  bio: string | null
  approval_status: string | null
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // IMPORTANT: Use production URL for redirects to prevent localhost issues
  // The request origin might be localhost:8080 due to Railway/Supabase routing issues
  const PRODUCTION_URL = 'https://stmartinsapp-production.up.railway.app'
  const requestOrigin = requestUrl.origin

  // Only use localhost origin for local development (port 3000)
  // Any other localhost port (like 8080) or production should use PRODUCTION_URL
  const isLocalDev = requestOrigin === 'http://localhost:3000' || requestOrigin === 'http://127.0.0.1:3000'
  const origin = isLocalDev ? requestOrigin : PRODUCTION_URL

  // Debug logging - remove after fixing
  console.log('=== AUTH CALLBACK DEBUG ===')
  console.log('Full URL:', request.url)
  console.log('Request Origin:', requestOrigin)
  console.log('Using Origin:', origin)
  console.log('Code present:', !!code)
  console.log('===========================')


  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      // Check if profile exists and is complete
      const { data: profile } = await (supabase
        .from('user_profiles')
        .select('user_id, full_name, organization_id, bio, approval_status')
        .eq('user_id', session.user.id)
        .single() as unknown as Promise<{ data: ProfileResult | null; error: unknown }>)

      // New user or incomplete profile -> redirect to onboarding
      if (!profile || !profile.organization_id || !profile.full_name) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // User pending approval -> redirect to pending page
      if (profile.approval_status !== 'approved') {
        return NextResponse.redirect(`${origin}/pending-approval`)
      }
    }
  }

  // Existing user with complete profile and approved -> dashboard
  return NextResponse.redirect(`${origin}/dashboard`)
}
