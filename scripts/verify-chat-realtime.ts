#!/usr/bin/env tsx

/**
 * Verify Chat Realtime Configuration
 *
 * This script checks if the chat tables are properly configured for Supabase Realtime:
 * 1. Verifies supabase_realtime role has SELECT permissions
 * 2. Checks if tables are added to supabase_realtime publication
 * 3. Validates RLS policies are in place
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const CHAT_TABLES = ['conversations', 'messages', 'conversation_unread']

async function checkPublicationStatus() {
  console.log('\n📡 Checking Realtime Publication Status...\n')

  try {
    // Check which tables are in the supabase_realtime publication
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename IN ('conversations', 'messages', 'conversation_unread')
        ORDER BY tablename;
      `
    })

    if (error) {
      // Try alternative method if RPC doesn't exist
      console.log('   Using alternative query method...')

      const { data: altData, error: altError } = await supabase
        .from('pg_publication_tables' as any)
        .select('tablename')
        .eq('pubname', 'supabase_realtime')
        .eq('schemaname', 'public')
        .in('tablename', CHAT_TABLES)

      if (altError) {
        console.error('   ⚠️  Cannot verify publication (requires DB admin access)')
        console.error('   Please check manually in Supabase Dashboard > Database > Publications')
        return false
      }

      const publishedTables = altData?.map((row: any) => row.tablename) || []
      return checkTableList(publishedTables)
    }

    const publishedTables = data?.map((row: any) => row.tablename) || []
    return checkTableList(publishedTables)

  } catch (err) {
    console.error('   ⚠️  Error checking publication:', err)
    return false
  }
}

function checkTableList(publishedTables: string[]): boolean {
  let allPresent = true

  for (const table of CHAT_TABLES) {
    if (publishedTables.includes(table)) {
      console.log(`   ✅ ${table} - in publication`)
    } else {
      console.log(`   ❌ ${table} - NOT in publication`)
      allPresent = false
    }
  }

  return allPresent
}

async function checkRLSPolicies() {
  console.log('\n🔒 Checking RLS Policies...\n')

  try {
    const { data, error } = await supabase
      .from('pg_policies' as any)
      .select('tablename, policyname, cmd')
      .eq('schemaname', 'public')
      .in('tablename', CHAT_TABLES)

    if (error) {
      console.error('   ⚠️  Cannot verify RLS policies (requires DB admin access)')
      return
    }

    const policiesByTable = CHAT_TABLES.reduce((acc, table) => {
      acc[table] = data?.filter((p: any) => p.tablename === table) || []
      return acc
    }, {} as Record<string, any[]>)

    for (const table of CHAT_TABLES) {
      const policies = policiesByTable[table]
      if (policies.length > 0) {
        console.log(`   ✅ ${table} - ${policies.length} policies`)
        policies.forEach((p: any) => {
          console.log(`      • ${p.policyname} (${p.cmd})`)
        })
      } else {
        console.log(`   ⚠️  ${table} - No policies found`)
      }
    }
  } catch (err) {
    console.error('   ⚠️  Error checking RLS policies:', err)
  }
}

async function checkTableAccess() {
  console.log('\n🔍 Checking Table Access...\n')

  for (const table of CHAT_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table as any)
        .select('count')
        .limit(1)

      if (error) {
        console.log(`   ❌ ${table} - Access error: ${error.message}`)
      } else {
        console.log(`   ✅ ${table} - Accessible`)
      }
    } catch (err) {
      console.log(`   ❌ ${table} - Error: ${err}`)
    }
  }
}

async function testRealtimeConnection() {
  console.log('\n🔌 Testing Realtime Connection...\n')

  return new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      console.log('   ⚠️  Realtime connection timeout (this is normal if no messages are being sent)')
      channel.unsubscribe()
      resolve(false)
    }, 5000)

    const channel = supabase
      .channel('test-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('   ✅ Realtime is working! Received event:', payload.eventType)
          clearTimeout(timeout)
          channel.unsubscribe()
          resolve(true)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('   ✅ Successfully subscribed to messages table')
          console.log('   ⏳ Waiting for events (send a message to test)...')
        } else if (status === 'CHANNEL_ERROR') {
          console.log('   ❌ Channel subscription error')
          clearTimeout(timeout)
          channel.unsubscribe()
          resolve(false)
        } else if (status === 'TIMED_OUT') {
          console.log('   ❌ Subscription timed out')
          clearTimeout(timeout)
          channel.unsubscribe()
          resolve(false)
        }
      })
  })
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('         Chat Realtime Configuration Verification           ')
  console.log('═══════════════════════════════════════════════════════════')

  const publicationOk = await checkPublicationStatus()
  await checkRLSPolicies()
  await checkTableAccess()
  await testRealtimeConnection()

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('                     Summary                                ')
  console.log('═══════════════════════════════════════════════════════════\n')

  if (publicationOk) {
    console.log('✅ All chat tables are in the supabase_realtime publication')
    console.log('✅ Real-time should be working for chat messages\n')
    console.log('Next steps:')
    console.log('  1. Test by sending a message in the chat')
    console.log('  2. Message should appear immediately (optimistic update)')
    console.log('  3. Message should sync to other users in real-time\n')
  } else {
    console.log('❌ Some tables are missing from supabase_realtime publication\n')
    console.log('To fix:')
    console.log('  1. Run the migration: 20251215220000_enable_chat_realtime.sql')
    console.log('  2. Or manually in Supabase Dashboard:')
    console.log('     - Go to Database > Publications > supabase_realtime')
    console.log('     - Toggle ON: conversations, messages, conversation_unread\n')
  }

  console.log('For more details, see: CHAT_REALTIME_FIX.md\n')
}

main().catch(console.error)
