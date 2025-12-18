/**
 * Directly fix RLS policies on notifications table using admin client
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
})

async function fixRLS() {
  console.log('Fixing RLS policies for notifications table...\n')

  // We can't execute raw DDL through the Supabase JS client
  // We need to provide manual instructions

  console.log('📝 INSTRUCTIONS:')
  console.log('The Supabase JS client cannot execute DDL statements.')
  console.log('Please apply the RLS fix manually using one of these methods:\n')

  console.log('METHOD 1: Supabase Dashboard SQL Editor')
  console.log('1. Go to https://supabase.com/dashboard/project/pcokwakenaapsfwcrpyt/sql/new')
  console.log('2. Paste the SQL below')
  console.log('3. Click "Run"\n')

  console.log('METHOD 2: psql CLI')
  console.log('Use the connection string from your Supabase project settings\n')

  console.log('=' .repeat(80))
  console.log('SQL TO RUN:')
  console.log('='.repeat(80))
  console.log(`
-- Fix RLS policy to allow authenticated users to create notifications
-- This is required because server actions run as authenticated users, not as service role

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can create notifications for others" ON notifications;

-- Allow authenticated users to create notifications where they are the actor
CREATE POLICY "Users can create notifications for their actions"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- Allow users to read their own notifications
CREATE POLICY IF NOT EXISTS "Users can read their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update (mark as read) their own notifications
CREATE POLICY IF NOT EXISTS "Users can update their own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own notifications (if needed)
CREATE POLICY IF NOT EXISTS "Users can delete their own notifications"
ON notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
`)
  console.log('='.repeat(80))

  console.log('\n✅ After running the SQL, comment notifications will work!')
  console.log('The policy allows authenticated users to create notifications where they are the actor.')
  console.log('\nYou can verify it works by running:')
  console.log('  npx tsx scripts/check-notifications-rls.ts')
}

fixRLS().catch(console.error)
