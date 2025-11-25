import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  console.log('[DEV-LOGIN] Starting dev login process...')

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[DEV-LOGIN] Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json({ error: 'Missing Supabase URL' }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[DEV-LOGIN] Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Missing service role key' }, { status: 500 })
    }

    console.log('[DEV-LOGIN] Creating admin client...')
    // Use service role client to bypass RLS
    const supabaseAdmin = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const testEmail = 'test@stmartins.dev'
    const testPassword = 'dev-password-123' // Simple password for dev only
    const testOrgId = '00000000-0000-0000-0000-000000000001' // Default test org

    console.log('[DEV-LOGIN] Checking if auth user exists...')
    // Check if auth user exists
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === testEmail)

    let userId: string

    if (!existingAuthUser) {
      console.log('[DEV-LOGIN] User does not exist, creating...')
      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          display_name: 'Test User',
        }
      })

      if (authError || !authUser.user) {
        console.error('Error creating auth user:', authError)
        return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
      }

      userId = authUser.user.id

      // Create test organization if it doesn't exist
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('id', testOrgId)
        .single()

      if (!existingOrg) {
        const { error: orgError } = await supabaseAdmin
          .from('organizations')
          .insert({
            id: testOrgId,
            name: 'St Martins Village (Test)',
            slug: 'st-martins-test',
            description: 'Test organization for development',
            is_active: true,
          })

        if (orgError) {
          console.error('Error creating test org:', orgError)
        }
      }

      // Create profile with organization and role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          display_name: 'Test User',
          bio: 'Development test account',
          email: testEmail,
          organization_id: testOrgId,
          role: 'admin',
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
    } else {
      userId = existingAuthUser.id
    }

    // Return credentials for client-side sign in
    return NextResponse.json({
      success: true,
      message: 'Dev user ready',
      email: testEmail,
      password: testPassword,
      userId: userId,
      orgId: testOrgId
    })
  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
