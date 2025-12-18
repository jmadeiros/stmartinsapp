/**
 * Apply RLS fix for notifications table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function applyRLSFix() {
  console.log('Applying RLS fix for notifications table...\n')

  const sqlStatements = [
    // Drop existing restrictive policies if any
    `DROP POLICY IF EXISTS "Users can create notifications for others" ON notifications;`,

    // Allow authenticated users to create notifications where they are the actor
    `CREATE POLICY "Users can create notifications for their actions"
     ON notifications
     FOR INSERT
     TO authenticated
     WITH CHECK (actor_id = auth.uid());`,

    // Allow users to read their own notifications
    `CREATE POLICY IF NOT EXISTS "Users can read their own notifications"
     ON notifications
     FOR SELECT
     TO authenticated
     USING (user_id = auth.uid());`,

    // Allow users to update (mark as read) their own notifications
    `CREATE POLICY IF NOT EXISTS "Users can update their own notifications"
     ON notifications
     FOR UPDATE
     TO authenticated
     USING (user_id = auth.uid())
     WITH CHECK (user_id = auth.uid());`,

    // Allow users to delete their own notifications (if needed)
    `CREATE POLICY IF NOT EXISTS "Users can delete their own notifications"
     ON notifications
     FOR DELETE
     TO authenticated
     USING (user_id = auth.uid());`
  ]

  for (const sql of sqlStatements) {
    console.log('Executing:', sql.substring(0, 80) + '...')
    const { error } = await (supabaseAdmin as any).rpc('exec_sql', { sql })

    if (error) {
      // Try alternative method - using raw SQL query
      console.log('  RPC failed, trying direct query...')
      // Note: Supabase client doesn't support raw SQL execution
      // We'll need to execute this manually in Supabase SQL editor
      console.log('  ⚠️  Cannot execute SQL directly. Please run this in Supabase SQL editor:')
      console.log(sql)
      console.log('')
    } else {
      console.log('  ✓ Success')
    }
  }

  console.log('\n=== Manual SQL to Run ===')
  console.log('If the above failed, copy and paste this into Supabase SQL Editor:\n')
  console.log(sqlStatements.join('\n\n'))

  console.log('\n\nOr run the migration file:')
  console.log('supabase/migrations/20251212_fix_notifications_rls.sql')
}

applyRLSFix().catch(console.error)
