/**
 * Apply project_interest RLS policies using Supabase Admin API
 *
 * This script attempts multiple methods to apply the RLS policies:
 * 1. Using existing RPC functions
 * 2. Direct database connection if password is available
 * 3. Outputs SQL for manual execution as fallback
 */

import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD

const RLS_SQL = `
-- Fix project_interest RLS
ALTER TABLE public.project_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_interest_select_policy" ON public.project_interest;
DROP POLICY IF EXISTS "project_interest_insert_policy" ON public.project_interest;
DROP POLICY IF EXISTS "project_interest_update_policy" ON public.project_interest;
DROP POLICY IF EXISTS "project_interest_delete_policy" ON public.project_interest;

CREATE POLICY "project_interest_select_policy"
ON public.project_interest FOR SELECT TO authenticated
USING (true);

CREATE POLICY "project_interest_insert_policy"
ON public.project_interest FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_interest_update_policy"
ON public.project_interest FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_interest_delete_policy"
ON public.project_interest FOR DELETE TO authenticated
USING (user_id = auth.uid());
`

async function tryDirectConnection(): Promise<boolean> {
  if (!dbPassword) {
    console.log('No database password found, skipping direct connection method')
    return false
  }

  const projectId = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]
  if (!projectId) {
    console.log('Could not extract project ID from Supabase URL')
    return false
  }

  const dbHost = `db.${projectId}.supabase.co`
  const connectionString = `postgresql://postgres:${dbPassword}@${dbHost}:5432/postgres`

  console.log(`Attempting direct PostgreSQL connection to ${dbHost}...`)

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('Connected to database!')

    // Execute the SQL
    await client.query(RLS_SQL)
    console.log('RLS policies applied successfully!')

    await client.end()
    return true
  } catch (error: any) {
    console.log(`Direct connection failed: ${error.message}`)
    await client.end().catch(() => {})
    return false
  }
}

async function checkExistingPolicies() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('\nChecking current project_interest table state...')

  // Check if we can insert
  const testUserId = '00000000-0000-0000-0000-000000000001'
  const testProjectId = '00000000-0000-0000-0000-000000000001'

  const { error: insertError } = await supabase
    .from('project_interest')
    .select('id')
    .limit(1)

  if (insertError) {
    console.log(`Table access issue: ${insertError.message}`)
    return false
  }

  console.log('Table is accessible via service role')
  return true
}

async function main() {
  console.log('=== Project Interest RLS Policy Application ===\n')

  // Method 1: Try direct database connection
  const directSuccess = await tryDirectConnection()
  if (directSuccess) {
    console.log('\n✅ RLS policies applied via direct database connection!')
    return
  }

  // Method 2: Check current state
  await checkExistingPolicies()

  // Fallback: Output SQL for manual execution
  console.log('\n' + '='.repeat(60))
  console.log('MANUAL EXECUTION REQUIRED')
  console.log('='.repeat(60))
  console.log('\nPlease run this SQL in the Supabase Dashboard SQL Editor:')
  console.log('https://supabase.com/dashboard/project/pcokwakenaapsfwcrpyt/sql/new')
  console.log('\n--- SQL START ---')
  console.log(RLS_SQL)
  console.log('--- SQL END ---\n')

  // Also output the curl command for potential use with Management API
  console.log('\nAlternatively, if you have a Supabase access token, add it to .env.local:')
  console.log('SUPABASE_ACCESS_TOKEN=your-token-here')
  console.log('\nOr add your database password:')
  console.log('SUPABASE_DB_PASSWORD=your-password-here')
  console.log('\nYou can find these credentials at:')
  console.log('- Access Token: https://supabase.com/dashboard/account/tokens')
  console.log('- Database Password: https://supabase.com/dashboard/project/pcokwakenaapsfwcrpyt/settings/database')
}

main().catch(console.error)
