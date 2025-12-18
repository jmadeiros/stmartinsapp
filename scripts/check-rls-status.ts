/**
 * Check if RLS is enabled and what policies exist
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkRLSStatus() {
  console.log('Checking RLS status on notifications table...\n')

  // Try to query if RLS is enabled
  // We'll do this by checking if we can select from pg_tables
  const query = `
    SELECT
      schemaname,
      tablename,
      rowsecurity as rls_enabled
    FROM pg_tables
    WHERE tablename = 'notifications';
  `

  const { data, error } = await (supabaseAdmin as any).rpc('exec_sql', {
    query: query
  })

  if (error) {
    console.log('Could not query pg_tables. Trying alternative method...\n')

    // Alternative: Just try to list policies
    console.log('Checking if we can query notification policies...')

    // Try creating a test notification as admin to see if the table is accessible
    const { data: testData, error: testError } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('❌ Cannot even read notifications table:', testError.message)
      console.log('This suggests a more serious problem with the table or permissions.')
    } else {
      console.log('✓ Can read from notifications table as admin')
      console.log(`  Found ${testData?.length || 0} notifications\n`)

      // Now try to check RLS by attempting an insert without auth
      console.log('Testing if RLS is blocking unauthenticated inserts...')

      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { error: anonError } = await anonClient
        .from('notifications')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000001',
          actor_id: '00000000-0000-0000-0000-000000000002',
          type: 'test',
          title: 'Test',
          link: '/test',
          read: false
        })

      if (anonError) {
        console.log('✓ RLS is ENABLED (unauthenticated insert blocked)')
        console.log(`  Error: ${anonError.message}`)
        console.log('\nThis means RLS is working, but authenticated users are also being blocked.')
        console.log('The policy might not have been created correctly.\n')

        console.log('To debug further, please check in Supabase Dashboard:')
        console.log('1. Go to: https://supabase.com/dashboard/project/pcokwakenaapsfwcrpyt/auth/policies')
        console.log('2. Look for the "notifications" table')
        console.log('3. Check if these policies exist:')
        console.log('   - "Users can create notifications for their actions" (INSERT)')
        console.log('   - "Users can read their own notifications" (SELECT)')
        console.log('   - "Users can update their own notifications" (UPDATE)')
        console.log('   - "Users can delete their own notifications" (DELETE)')
      } else {
        console.log('❌ RLS is DISABLED (unauthenticated insert succeeded)')
        console.log('This is a security risk but explains why nothing works.')
      }
    }
  } else {
    console.log('RLS query result:', data)
  }
}

checkRLSStatus().catch(console.error)
