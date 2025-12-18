#!/usr/bin/env tsx
/**
 * Check the current RLS policies on post_reactions table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkRLS() {
  console.log('=== Checking post_reactions RLS Policies ===\n')

  // Query the pg_policies system catalog
  const { data: policies, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'post_reactions'
      ORDER BY policyname;
    `
  })

  if (error) {
    // If exec_sql function doesn't exist, try direct query
    console.log('Trying alternative method...\n')

    const query = `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles::text[],
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'post_reactions'
      ORDER BY policyname;
    `

    const { data: altPolicies, error: altError } = await supabase
      .from('pg_policies' as any)
      .select('*')

    if (altError) {
      console.log('❌ Could not query policies:', altError.message)
      console.log('\nChecking if table exists and has RLS enabled...')

      // Check if table exists
      const { data: tables } = await supabase
        .from('post_reactions')
        .select('id')
        .limit(1)

      console.log('✓ post_reactions table exists and is accessible')
      return
    }
  }

  if (!policies || policies.length === 0) {
    console.log('⚠️  No RLS policies found on post_reactions table')
    return
  }

  console.log(`Found ${policies.length} RLS policies:\n`)

  for (const policy of policies) {
    console.log(`Policy: ${policy.policyname}`)
    console.log(`  Command: ${policy.cmd}`)
    console.log(`  Roles: ${policy.roles}`)
    if (policy.qual) {
      console.log(`  USING: ${policy.qual}`)
    }
    if (policy.with_check) {
      console.log(`  WITH CHECK: ${policy.with_check}`)
    }

    // Check if it references user_memberships
    const qualStr = policy.qual?.toString() || ''
    const checkStr = policy.with_check?.toString() || ''

    if (qualStr.includes('user_memberships') || checkStr.includes('user_memberships')) {
      console.log('  ⚠️  REFERENCES user_memberships!')
    } else {
      console.log('  ✓ No user_memberships reference')
    }
    console.log()
  }
}

checkRLS()
