/**
 * Verify RLS policies exist on notifications table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function verifyPolicies() {
  console.log('Checking RLS policies on notifications table...\n')

  // Use a raw SQL query to check policies
  // We'll select from pg_policies view
  const sqlQuery = `
    SELECT
      policyname,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename = 'notifications'
    ORDER BY policyname;
  `

  // Execute via a function or direct query
  // Since we can't execute raw SQL directly, let's try using the REST API
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sqlQuery })
  })

  if (!response.ok) {
    console.log('Could not query policies via API. Trying alternative method...\n')

    // Alternative: Test if policies work by trying to insert
    console.log('Testing if INSERT policy exists by attempting authenticated insert...')

    // Sign in as test user
    const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
      email: 'test@stmartins.dev',
      password: 'dev-password-123'
    })

    if (authError) {
      console.log('❌ Could not authenticate test user')
      return
    }

    const userId = authData.user.id
    console.log(`✓ Signed in as test user: ${userId}\n`)

    // Try to insert a notification where actor_id = authenticated user
    const testNotif = {
      user_id: '643bf6ba-0eb2-4bc0-a31e-2479cdbc3f0f', // Sarah's ID
      actor_id: userId, // Must match auth.uid()
      type: 'test',
      title: 'RLS policy test',
      reference_type: 'post',
      reference_id: '00000000-0000-0000-0000-000000000001',
      link: '/test',
      action_data: { test: true },
      read: false
    }

    // Note: We don't use .select() because the SELECT policy only allows
    // users to read their own notifications (where user_id = auth.uid())
    // When creating notifications for OTHER users, we can't select them back
    const { error: insertError } = await testClient
      .from('notifications')
      .insert(testNotif)

    if (insertError) {
      console.log('❌ INSERT FAILED')
      console.log(`   Error: ${insertError.message}`)
      console.log(`   Code: ${insertError.code}\n`)
      console.log('The RLS policy does NOT exist or is not working correctly.\n')
      console.log('Please run this SQL in Supabase Dashboard SQL Editor:')
      console.log('https://supabase.com/dashboard/project/pcokwakenaapsfwcrpyt/sql/new\n')
      console.log('CREATE POLICY "Users can create notifications for their actions"')
      console.log('ON notifications FOR INSERT TO authenticated')
      console.log('WITH CHECK (actor_id = auth.uid());')
      return
    }

    // Verify the notification was created using admin client
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', testNotif.user_id)
      .eq('actor_id', testNotif.actor_id)
      .eq('title', testNotif.title)
      .single()

    if (verifyError || !verifyData) {
      console.log('❌ INSERT appeared to succeed but notification was not created')
      return
    }

    console.log('✅ INSERT SUCCEEDED!')
    console.log(`   Notification ID: ${verifyData.id}\n`)
    console.log('✅ RLS FIX IS WORKING!')
    console.log('   The INSERT policy exists and is correctly configured.')
    console.log('   Users can create notifications for OTHER users (where actor_id = auth.uid()).')
    console.log('   Comment notifications should now work in your app!\n')

    // Clean up test notification
    await supabaseAdmin.from('notifications').delete().eq('id', verifyData.id)
    console.log('✓ Cleaned up test notification')

    return
  }

  const data = await response.json()
  console.log('Policies found:')
  console.log(JSON.stringify(data, null, 2))
}

verifyPolicies().catch(console.error)
