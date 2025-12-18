/**
 * Show current RLS policies on notifications table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function showRLSPolicies() {
  console.log('Querying current RLS policies on notifications table...\n')

  // Query the pg_policies view to see current policies
  const { data, error } = await (supabaseAdmin as any)
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'notifications')

  if (error) {
    console.log('Could not query pg_policies:', error.message)
    console.log('\nTrying alternative method...\n')

    // Alternative: Check if RLS is enabled
    const { data: tableInfo } = await (supabaseAdmin as any)
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'notifications')
      .single()

    if (tableInfo) {
      console.log('Table exists:', tableInfo.tablename)
      console.log('Schema:', tableInfo.schemaname)
    }

    return
  }

  if (!data || data.length === 0) {
    console.log('❌ NO RLS POLICIES FOUND on notifications table!')
    console.log('\nThis means:')
    console.log('- If RLS is ENABLED: Nobody can access the table (default deny)')
    console.log('- If RLS is DISABLED: Everyone can access (not secure)')
    console.log('\nYou MUST add RLS policies using the SQL from:')
    console.log('  supabase/migrations/20251212_fix_notifications_rls.sql')
    return
  }

  console.log(`✓ Found ${data.length} RLS policies:\n`)

  data.forEach((policy: any, idx: number) => {
    console.log(`Policy ${idx + 1}: ${policy.policyname}`)
    console.log(`  Command: ${policy.cmd}`)
    console.log(`  Roles: ${policy.roles}`)
    console.log(`  Using (SELECT): ${policy.qual || 'N/A'}`)
    console.log(`  With Check (INSERT/UPDATE): ${policy.with_check || 'N/A'}`)
    console.log('')
  })

  // Check if there's an INSERT policy for authenticated users
  const hasInsertPolicy = data.some((p: any) =>
    p.cmd === 'INSERT' && p.roles && p.roles.includes('authenticated')
  )

  if (hasInsertPolicy) {
    console.log('✓ INSERT policy exists for authenticated users')
    console.log('  Notifications should be working')
  } else {
    console.log('❌ NO INSERT policy for authenticated users!')
    console.log('  This is why notifications are failing')
    console.log('\n  Apply the fix migration:')
    console.log('  supabase/migrations/20251212_fix_notifications_rls.sql')
  }
}

showRLSPolicies().catch(console.error)
