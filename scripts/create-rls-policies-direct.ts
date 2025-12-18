/**
 * Create RLS policies directly using PostgreSQL client
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function createPolicies() {
  console.log('Creating RLS policies directly via PostgreSQL...\n')

  // Extract project ID from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]

  if (!projectId) {
    console.error('Could not extract project ID from Supabase URL')
    return
  }

  // Construct connection string
  // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
  const dbHost = `db.${projectId}.supabase.co`
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD

  if (!dbPassword) {
    console.error('❌ Database password not found in environment variables')
    console.error('Please set SUPABASE_DB_PASSWORD in your .env.local file')
    console.error('\nYou can find your database password in:')
    console.error(`https://supabase.com/dashboard/project/${projectId}/settings/database`)
    return
  }

  const connectionString = `postgresql://postgres:${dbPassword}@${dbHost}:5432/postgres`

  console.log(`Connecting to: ${dbHost}`)

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✓ Connected to database\n')

    // Execute each policy creation
    const policies = [
      {
        name: 'Users can create notifications for their actions',
        sql: `CREATE POLICY "Users can create notifications for their actions"
ON notifications FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());`
      },
      {
        name: 'Users can read their own notifications',
        sql: `CREATE POLICY "Users can read their own notifications"
ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());`
      },
      {
        name: 'Users can update their own notifications',
        sql: `CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());`
      },
      {
        name: 'Users can delete their own notifications',
        sql: `CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());`
      }
    ]

    // Drop existing policies first
    console.log('Dropping existing policies...')
    const dropPolicies = [
      'Users can create notifications for others',
      'Users can create notifications for their actions',
      'Users can read their own notifications',
      'Users can update their own notifications',
      'Users can delete their own notifications'
    ]

    for (const policyName of dropPolicies) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${policyName}" ON notifications;`)
        console.log(`  ✓ Dropped: ${policyName}`)
      } catch (error: any) {
        console.log(`  - ${policyName} (didn't exist)`)
      }
    }

    console.log('\nCreating new policies...')

    // Create new policies
    for (const policy of policies) {
      try {
        await client.query(policy.sql)
        console.log(`  ✓ Created: ${policy.name}`)
      } catch (error: any) {
        console.error(`  ❌ Failed to create ${policy.name}:`, error.message)
        throw error
      }
    }

    console.log('\n✅ All RLS policies created successfully!')
    console.log('\nComment notifications should now work in your app!')

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error('\nIf the connection failed, please:')
    console.error('1. Set SUPABASE_DB_PASSWORD in your .env.local')
    console.error('2. Or run the SQL manually in Supabase Dashboard')
  } finally {
    await client.end()
  }
}

createPolicies().catch(console.error)
