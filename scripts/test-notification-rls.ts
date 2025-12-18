/**
 * Test if RLS policies are blocking notification creation
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create both admin and anon clients
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

async function testNotificationRLS() {
  console.log('Testing notification RLS policies...\n')

  // Get users
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const sarah = users?.users?.find(u => u.email === 'admin@stmartins.dev')
  const james = users?.users?.find(u => u.email === 'staff@stmartins.dev')

  if (!sarah || !james) {
    console.error('Users not found')
    return
  }

  console.log('Users found:')
  console.log('  - Sarah:', sarah.id)
  console.log('  - James:', james.id)

  // Test 1: Create notification as ADMIN (service role)
  console.log('\n--- Test 1: Create notification using admin/service role ---')
  const adminNotif = {
    user_id: sarah.id,
    actor_id: james.id,
    type: 'comment',
    title: 'Test notification from admin',
    reference_type: 'post',
    reference_id: '00000000-0000-0000-0000-000000000001',
    link: '/posts/test',
    action_data: { test: true },
    read: false
  }

  const { data: adminResult, error: adminError } = await supabaseAdmin
    .from('notifications')
    .insert(adminNotif)
    .select()
    .single()

  if (adminError) {
    console.log('❌ Admin insert FAILED:', adminError.message)
  } else {
    console.log('✓ Admin insert SUCCESS:', adminResult.id)
  }

  // Test 2: Try to create notification as ANON user (no auth)
  console.log('\n--- Test 2: Create notification using anon key (no auth) ---')
  const anonNotif = {
    user_id: sarah.id,
    actor_id: james.id,
    type: 'comment',
    title: 'Test notification from anon',
    reference_type: 'post',
    reference_id: '00000000-0000-0000-0000-000000000002',
    link: '/posts/test2',
    action_data: { test: true },
    read: false
  }

  const { data: anonResult, error: anonError } = await supabaseAnon
    .from('notifications')
    .insert(anonNotif)
    .select()
    .single()

  if (anonError) {
    console.log('❌ Anon insert FAILED:', anonError.message)
    console.log('   Error code:', anonError.code)
    console.log('   This is expected if RLS requires authentication')
  } else {
    console.log('✓ Anon insert SUCCESS:', anonResult.id)
  }

  // Test 3: Sign in as James and try to create notification
  console.log('\n--- Test 3: Create notification as authenticated user (James) ---')
  const { data: authData } = await supabaseAnon.auth.signInWithPassword({
    email: james.email!,
    password: 'dev-password-123' // Assuming dev login password
  })

  if (authData.user) {
    console.log('✓ Signed in as James')

    const userNotif = {
      user_id: sarah.id,
      actor_id: james.id,
      type: 'comment',
      title: 'Test notification from authenticated James',
      reference_type: 'post',
      reference_id: '00000000-0000-0000-0000-000000000003',
      link: '/posts/test3',
      action_data: { test: true },
      read: false
    }

    const { data: userResult, error: userError } = await supabaseAnon
      .from('notifications')
      .insert(userNotif)
      .select()
      .single()

    if (userError) {
      console.log('❌ Authenticated user insert FAILED:', userError.message)
      console.log('   Error code:', userError.code)
      console.log('   Error hint:', userError.hint)
      console.log('\n⚠️  THIS IS THE PROBLEM!')
      console.log('   RLS policies are blocking notification creation from authenticated users.')
      console.log('   The addComment server action runs as the authenticated user, not admin.')
      console.log('   Solution: Update RLS policy to allow users to insert notifications.')
    } else {
      console.log('✓ Authenticated user insert SUCCESS:', userResult.id)
    }
  } else {
    console.log('❌ Could not sign in as James')
  }

  console.log('\n=== Summary ===')
  console.log('If Test 1 succeeded but Test 3 failed, the issue is RLS policies.')
  console.log('Server actions run as authenticated users, not with service role key.')
  console.log('You need to allow INSERT on notifications for authenticated users.')
}

testNotificationRLS().catch(console.error)
