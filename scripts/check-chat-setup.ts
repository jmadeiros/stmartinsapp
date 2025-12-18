#!/usr/bin/env tsx

/**
 * Check if chat tables exist and if user profiles are present
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🔍 Chat Setup Check\n')

  // Check if tables exist
  console.log('📊 Checking if chat tables exist...\n')

  const tables = ['conversations', 'messages', 'conversation_participants', 'message_reactions', 'conversation_unread']

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${table}: Does NOT exist or cannot access`)
      console.log(`   Error: ${error.message}`)
    } else {
      console.log(`✅ ${table}: Exists`)
    }
  }

  // Check user_profiles
  console.log('\n📊 Checking user_profiles table...\n')

  const { data: profiles, error: profileError, count: profileCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })

  if (profileError) {
    console.log(`❌ user_profiles: ${profileError.message}`)
  } else {
    console.log(`✅ user_profiles: Found ${profileCount} profile(s)`)
    if (profiles && profiles.length > 0) {
      console.log('\nProfiles:')
      profiles.forEach((p: any, i: number) => {
        console.log(`  ${i + 1}. ${p.full_name} (${p.user_id})`)
      })
    }
  }

  // Check auth.users
  console.log('\n📊 Checking auth.users...\n')

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.log(`❌ auth.users: ${authError.message}`)
  } else {
    console.log(`✅ auth.users: Found ${authUsers.users.length} user(s)`)
    if (authUsers.users.length > 0) {
      console.log('\nAuth users:')
      authUsers.users.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} (${u.id})`)
      })
    }
  }

  // Check organizations
  console.log('\n📊 Checking organizations...\n')

  const { data: orgs, error: orgError, count: orgCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact' })

  if (orgError) {
    console.log(`❌ organizations: ${orgError.message}`)
  } else {
    console.log(`✅ organizations: Found ${orgCount} organization(s)`)
    if (orgs && orgs.length > 0) {
      console.log('\nOrganizations:')
      orgs.forEach((o: any, i: number) => {
        console.log(`  ${i + 1}. ${o.name} (${o.id})`)
      })
    }
  }
}

main().catch(console.error)
