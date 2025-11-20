import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Use service role client to bypass RLS
    const supabaseAdmin = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Check if auth user exists
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === testEmail)

    let userId: string

    if (!existingAuthUser) {
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
        .schema('app')
        .from('organizations')
        .select('id')
        .eq('id', testOrgId)
        .single()

      if (!existingOrg) {
        const { error: orgError } = await supabaseAdmin
          .schema('app')
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

      // Create profile in app.profiles
      const { error: profileError } = await supabaseAdmin
        .schema('app')
        .from('profiles')
        .insert({
          id: userId,
          display_name: 'Test User',
          bio: 'Development test account',
          email: testEmail,
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      // Add user to organization as member
      const { error: memberError } = await supabaseAdmin
        .schema('app')
        .from('organization_members')
        .insert({
          org_id: testOrgId,
          user_id: userId,
          role: 'admin',
        })

      if (memberError) {
        console.error('Error creating org membership:', memberError)
        return NextResponse.json({ error: 'Failed to create org membership' }, { status: 500 })
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
