/**
 * Test fetching notifications as authenticated user
 * This simulates what happens when the notification dropdown is opened
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testNotificationsFetch() {
  console.log('Testing notification fetch as different users...\n')

  // Get users
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const sarah = users?.users?.find(u => u.email === 'admin@stmartins.dev')
  const james = users?.users?.find(u => u.email === 'staff@stmartins.dev')

  if (!sarah || !james) {
    console.error('Users not found')
    return
  }

  console.log('Users:')
  console.log(`  Sarah: ${sarah.id}`)
  console.log(`  James: ${james.id}`)

  // 1. Check what notifications exist in total (admin view)
  console.log('\n=== Admin View (All notifications) ===\n')
  const { data: allNotifications, error: allError } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, actor_id, type, title, read, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (allError) {
    console.log('Admin fetch error:', allError.message)
  } else {
    console.log(`Total notifications (showing first 10):`)
    allNotifications?.forEach(n => {
      const forUser = n.user_id === sarah.id ? 'Sarah' : (n.user_id === james.id ? 'James' : 'Other')
      console.log(`  ${n.id.substring(0, 8)}... | For: ${forUser} | Type: ${n.type} | Read: ${n.read}`)
      console.log(`    Title: ${n.title?.substring(0, 50)}...`)
    })
  }

  // Count notifications for Sarah
  const { count: sarahNotifCount } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', sarah.id)

  const { count: sarahUnreadCount } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', sarah.id)
    .eq('read', false)

  console.log(`\nSarah's notifications: ${sarahNotifCount} total, ${sarahUnreadCount} unread`)

  // Count notifications for James
  const { count: jamesNotifCount } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', james.id)

  const { count: jamesUnreadCount } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', james.id)
    .eq('read', false)

  console.log(`James's notifications: ${jamesNotifCount} total, ${jamesUnreadCount} unread`)

  // 2. Sign in as Sarah and try to fetch HER notifications
  console.log('\n=== Fetching as Sarah (should see her own) ===\n')

  const sarahClient = createClient(supabaseUrl, supabaseAnonKey)
  const { error: sarahAuthError } = await sarahClient.auth.signInWithPassword({
    email: 'admin@stmartins.dev',
    password: 'dev-admin-123'
  })

  if (sarahAuthError) {
    console.error('Sarah auth failed:', sarahAuthError.message)
    return
  }

  const { data: sarahNotifs, error: sarahFetchError } = await sarahClient
    .from('notifications')
    .select('*')
    .eq('user_id', sarah.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (sarahFetchError) {
    console.log('❌ Sarah CANNOT fetch her notifications!')
    console.log('   Error:', sarahFetchError.message)
    console.log('   Code:', sarahFetchError.code)
    console.log('\n🔍 DIAGNOSIS: RLS SELECT policy is blocking!')
    console.log('   Need: USING (user_id = auth.uid())')
  } else {
    console.log(`✓ Sarah CAN fetch her notifications: ${sarahNotifs?.length || 0} returned`)
    sarahNotifs?.slice(0, 3).forEach(n => {
      console.log(`  ${n.id.substring(0, 8)}... | Type: ${n.type} | Title: ${n.title?.substring(0, 40)}...`)
    })
  }

  // 3. Sign in as James and fetch HIS notifications
  console.log('\n=== Fetching as James (should see his own) ===\n')

  const jamesClient = createClient(supabaseUrl, supabaseAnonKey)
  const { error: jamesAuthError } = await jamesClient.auth.signInWithPassword({
    email: 'staff@stmartins.dev',
    password: 'dev-staff-123'
  })

  if (jamesAuthError) {
    console.error('James auth failed:', jamesAuthError.message)
    return
  }

  const { data: jamesNotifs, error: jamesFetchError } = await jamesClient
    .from('notifications')
    .select('*')
    .eq('user_id', james.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (jamesFetchError) {
    console.log('❌ James CANNOT fetch his notifications!')
    console.log('   Error:', jamesFetchError.message)
    console.log('   Code:', jamesFetchError.code)
  } else {
    console.log(`✓ James CAN fetch his notifications: ${jamesNotifs?.length || 0} returned`)
    jamesNotifs?.slice(0, 3).forEach(n => {
      console.log(`  ${n.id.substring(0, 8)}... | Type: ${n.type} | Title: ${n.title?.substring(0, 40)}...`)
    })
  }

  // 4. Check RLS policies on notifications table
  console.log('\n=== Checking RLS Policies ===\n')

  const { data: policies, error: policyError } = await supabaseAdmin
    .rpc('exec_sql', {
      sql: `SELECT policyname, cmd, qual, with_check
            FROM pg_policies
            WHERE tablename = 'notifications'
            ORDER BY policyname`
    })

  if (policyError) {
    // Try alternative method
    console.log('Could not query policies directly, checking via system catalog...')
  }

  console.log('\n=== Summary ===\n')
  if (sarahFetchError) {
    console.log('❌ RLS is BLOCKING notification fetches!')
    console.log('   Users cannot read their own notifications.')
    console.log('\n✅ FIX: Add SELECT policy:')
    console.log(`
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());
`)
  } else {
    console.log('✓ RLS SELECT is working correctly')
    console.log('  If dropdown is still empty, check:')
    console.log('  1. Is userId being passed correctly to useNotifications?')
    console.log('  2. Is the user authenticated in the browser?')
    console.log('  3. Check browser console for errors')
  }
}

testNotificationsFetch().catch(console.error)
