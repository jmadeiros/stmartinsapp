import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Use service role client to bypass RLS
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const testEmail = 'test@villagehub.dev'
    const testPassword = 'dev-password-123' // Simple password for dev only

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
          full_name: 'Test User',
        }
      })

      if (authError || !authUser.user) {
        console.error('Error creating auth user:', authError)
        return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
      }

      userId = authUser.user.id

      // Create user in database
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: testEmail,
          full_name: 'Test User',
          role: 'admin',
          organization_id: '00000000-0000-0000-0000-000000000001',
          is_active: true,
        })

      if (insertError) {
        console.error('Error creating database user:', insertError)
        return NextResponse.json({ error: 'Failed to create database user' }, { status: 500 })
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
      userId: userId
    })
  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
