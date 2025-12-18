/**
 * Check RLS policies on notifications table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkRLS() {
  console.log('Checking RLS policies on notifications table...\n')

  // Try to determine RLS behavior by testing
  console.log('Testing RLS behavior empirically:\n')

  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const james = users?.users?.find(u => u.email === 'staff@stmartins.dev')
  const sarah = users?.users?.find(u => u.email === 'admin@stmartins.dev')

  if (!james || !sarah) {
    console.log('Could not find test users')
    return
  }

  // Sign in as James using the anon key
  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Try to get James's password to sign in
  // For dev users, password is 'dev-password-123'
  const signInResult = await anonClient.auth.signInWithPassword({
    email: 'staff@stmartins.dev',
    password: 'dev-password-123'
  })

  if (signInResult.error) {
    console.log('Could not sign in as James (staff). Trying test user...')

    const testSignIn = await anonClient.auth.signInWithPassword({
      email: 'test@stmartins.dev',
      password: 'dev-password-123'
    })

    if (testSignIn.error) {
      console.log('❌ Could not sign in:', testSignIn.error.message)
      console.log('\nCould not test RLS - unable to authenticate')
      return
    }

    // Get the signed-in user's ID
    const signedInUser = testSignIn.data.user!
    console.log(`✓ Signed in as test user`)

    // Test notification with actor_id matching the authenticated user
    const testNotif = {
      user_id: sarah.id,
      actor_id: signedInUser.id,  // MUST match auth.uid() for RLS policy
      type: 'comment',
      title: 'RLS test notification from test user',
      reference_type: 'post',
      reference_id: '00000000-0000-0000-0000-000000000001',
      link: '/test',
      action_data: { test: true },
      read: false
    }

    const { data: insertResult, error: insertError } = await anonClient
      .from('notifications')
      .insert(testNotif)
      .select()
      .single()

    if (insertError) {
      console.log('\n❌ INSERT FAILED:')
      console.log('   Error:', insertError.message)
      console.log('   Code:', insertError.code)
      console.log('\nRLS policy is still blocking. Check if migration was applied.')
    } else {
      console.log('\n✅ INSERT SUCCEEDED!')
      console.log('   Notification ID:', insertResult.id)
      console.log('\n✅ RLS FIX IS WORKING!')
      console.log('   Comment notifications should now work in the app!')
    }
    return
  }

  // Successfully signed in as James
  console.log('✓ Signed in as James (staff@stmartins.dev)')

  // Now try to create a notification where James is the actor
  const testNotif = {
    user_id: sarah.id,
    actor_id: james.id,  // James is the actor and James is signed in
    type: 'comment',
    title: 'RLS test notification from James',
    reference_type: 'post',
    reference_id: '00000000-0000-0000-0000-000000000001',
    link: '/test',
    action_data: { test: true },
    read: false
  }

  const { data: insertResult, error: insertError } = await anonClient
    .from('notifications')
    .insert(testNotif)
    .select()
    .single()

  if (insertError) {
    console.log('\n❌ INSERT FAILED as authenticated user:')
    console.log('   Error:', insertError.message)
    console.log('   Code:', insertError.code)
    console.log('\n🔍 DIAGNOSIS:')
    console.log('   RLS policies are blocking notification creation.')
    console.log('   Server actions run as authenticated users, so they cannot create notifications.')
    console.log('\n✅ SOLUTION:')
    console.log('   Add an RLS policy that allows authenticated users to INSERT into notifications:')
    console.log('')
    console.log('   CREATE POLICY "Users can create notifications for others"')
    console.log('   ON notifications FOR INSERT')
    console.log('   TO authenticated')
    console.log('   WITH CHECK (true);')
    console.log('')
    console.log('   Or more restrictive:')
    console.log('   WITH CHECK (actor_id = auth.uid());  -- Can only create notifications where they are the actor')
  } else {
    console.log('\n✓ INSERT SUCCEEDED as authenticated user')
    console.log('   Notification ID:', insertResult.id)
    console.log('\nRLS is NOT blocking authenticated users from creating notifications.')
    console.log('The problem must be elsewhere in the notification creation flow.')
  }
}

checkRLS().catch(console.error)
