import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type UserRole = 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'

interface TestUser {
  email: string
  password: string
  displayName: string
  role: UserRole
}

// Test organizations (partner charities housed in The Village at St Martins)
const TEST_ORGS = {
  oasis: '00000000-0000-0000-0000-000000000001',              // Oasis - owns St Martins / The Village
  bristolYouthSupport: '00000000-0000-0000-0000-000000000002', // Partner charity for Emma
  communityFoodBank: '00000000-0000-0000-0000-000000000003',   // Partner charity for Marcus
}

interface TestUserWithOrg extends TestUser {
  orgId: string
}

// Test users for each role - each in their respective organization
const TEST_USERS: TestUserWithOrg[] = [
  { email: 'admin@stmartins.dev', password: 'dev-admin-123', displayName: 'Sarah Mitchell', role: 'admin', orgId: TEST_ORGS.oasis },
  { email: 'staff@stmartins.dev', password: 'dev-staff-123', displayName: 'James Chen', role: 'st_martins_staff', orgId: TEST_ORGS.oasis },
  { email: 'partner@stmartins.dev', password: 'dev-partner-123', displayName: 'Emma Wilson', role: 'partner_staff', orgId: TEST_ORGS.bristolYouthSupport },
  { email: 'volunteer@stmartins.dev', password: 'dev-volunteer-123', displayName: 'Marcus Johnson', role: 'volunteer', orgId: TEST_ORGS.communityFoodBank },
]

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // Check request body for options
  let requestedRole: UserRole | undefined
  let testOnboarding = false
  try {
    const body = await request.json().catch(() => ({}))
    requestedRole = body.role as UserRole | undefined
    testOnboarding = body.testOnboarding === true
  } catch {
    // No body, use default (admin)
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

    // Create test organizations if they don't exist
    console.log('[DEV-LOGIN] Ensuring test organizations exist...')

    const orgsToCreate = [
      {
        id: TEST_ORGS.oasis,
        name: 'Oasis',
        slug: 'oasis',
        description: 'Oasis charity - owns The Village at St Martins',
        is_active: true,
      },
      {
        id: TEST_ORGS.bristolYouthSupport,
        name: 'Bristol Youth Support',
        slug: 'bristol-youth-support',
        description: 'Partner charity supporting young people in Bristol',
        is_active: true,
      },
      {
        id: TEST_ORGS.communityFoodBank,
        name: 'Community Food Bank',
        slug: 'community-food-bank',
        description: 'Partner charity providing food assistance',
        is_active: true,
      },
    ]

    for (const org of orgsToCreate) {
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('id', org.id)
        .single()

      if (!existingOrg) {
        const { error: orgError } = await supabaseAdmin
          .from('organizations')
          .insert(org as any)

        if (orgError) {
          console.error(`[DEV-LOGIN] Error creating org ${org.name}:`, orgError)
        } else {
          console.log(`[DEV-LOGIN] Created organization: ${org.name}`)
        }
      }
    }

    // Get existing auth users
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingEmails = new Set(existingAuthUsers?.users?.map(u => u.email) || [])

    const createdUsers: Array<{ email: string; password: string; role: UserRole; userId: string; orgId: string }> = []

    // Create all test users
    for (const testUser of TEST_USERS) {
      console.log(`[DEV-LOGIN] Processing user: ${testUser.email}`)

      if (existingEmails.has(testUser.email)) {
        // User already exists, find their ID and ensure profile is up to date
        const existingUser = existingAuthUsers?.users?.find(u => u.email === testUser.email)
        if (existingUser) {
          // Update their profile to ensure org and role are set
          await supabaseAdmin
            .from('user_profiles')
            .upsert({
              user_id: existingUser.id,
              full_name: testUser.displayName,
              bio: `${testUser.role} test account`,
              contact_email: testUser.email,
              organization_id: testUser.orgId,
              role: testUser.role,
            } as any)

          createdUsers.push({
            email: testUser.email,
            password: testUser.password,
            role: testUser.role,
            userId: existingUser.id,
            orgId: testUser.orgId
          })
          console.log(`[DEV-LOGIN] User ${testUser.email} already exists, updated profile`)
        }
        continue
      }

      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          display_name: testUser.displayName,
        }
      })

      if (authError || !authUser.user) {
        console.error(`[DEV-LOGIN] Error creating auth user ${testUser.email}:`, authError)
        continue
      }

      const userId = authUser.user.id

      // Upsert user_profile with organization and role
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          user_id: userId,
          full_name: testUser.displayName,
          bio: `${testUser.role} test account`,
          contact_email: testUser.email,
          organization_id: testUser.orgId,
          role: testUser.role,
        } as any)

      if (profileError) {
        console.error(`[DEV-LOGIN] Error creating profile for ${testUser.email}:`, profileError)
      }

      // Note: user_profiles already has organization_id and role, no separate membership needed

      createdUsers.push({
        email: testUser.email,
        password: testUser.password,
        role: testUser.role,
        userId: userId,
        orgId: testUser.orgId
      })

      console.log(`[DEV-LOGIN] Created user: ${testUser.email} with role: ${testUser.role}`)
    }

    // Determine which user credentials to return
    const targetRole = requestedRole || 'admin'
    const targetUser = createdUsers.find(u => u.role === targetRole) || createdUsers[0]

    if (!targetUser) {
      return NextResponse.json({ error: 'No test users could be created' }, { status: 500 })
    }

    // If testing onboarding, clear the profile fields so user goes through wizard
    if (testOnboarding) {
      console.log(`[DEV-LOGIN] Clearing profile for onboarding test: ${targetUser.email}`)
      const { error: clearError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          organization_id: null,
          skills: null,
          interests: null,
          approval_status: 'approved',  // Reset so they can access onboarding
        } as any)
        .eq('user_id', targetUser.userId)

      if (clearError) {
        console.error('[DEV-LOGIN] Error clearing profile for onboarding:', clearError)
      } else {
        console.log('[DEV-LOGIN] Profile cleared for onboarding test')
      }
    }

    // Return credentials for client-side sign in
    return NextResponse.json({
      success: true,
      message: `Dev users ready. Returning ${targetUser.role} credentials.`,
      email: targetUser.email,
      password: targetUser.password,
      userId: targetUser.userId,
      orgId: targetUser.orgId,
      role: targetUser.role,
      allUsers: createdUsers.map(u => ({
        email: u.email,
        role: u.role,
        userId: u.userId,
        orgId: u.orgId
      }))
    })
  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
