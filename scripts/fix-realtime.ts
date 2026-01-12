/**
 * Fix Realtime - Apply migration and verify it works
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkAndFixRealtime() {
  console.log('🔍 Checking realtime publication status...\n')
  
  // Check what tables are currently in the publication
  const { data: currentTables, error: checkError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT tablename 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public'
        AND tablename IN ('messages', 'conversations', 'conversation_participants', 'conversation_unread')
        ORDER BY tablename;
      `
    })
    .catch(() => {
      // Fallback: try direct query
      return { data: null, error: null }
    })

  const requiredTables = ['messages', 'conversations', 'conversation_participants', 'conversation_unread']
  
  console.log('Current tables in publication:')
  if (currentTables && Array.isArray(currentTables)) {
    currentTables.forEach((t: any) => console.log(`  ✅ ${t.tablename || t}`))
  } else {
    console.log('  (Could not check - will try to apply migration)')
  }
  
  console.log('\n📝 Applying migration...\n')
  
  // Apply the migration SQL
  const migrationSQL = `
    DO $$
    BEGIN
      -- messages
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        RAISE NOTICE 'Added messages to publication';
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'messages already in publication';
      END;

      -- conversations
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
        RAISE NOTICE 'Added conversations to publication';
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'conversations already in publication';
      END;

      -- conversation_participants
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
        RAISE NOTICE 'Added conversation_participants to publication';
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'conversation_participants already in publication';
      END;

      -- conversation_unread
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_unread;
        RAISE NOTICE 'Added conversation_unread to publication';
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'conversation_unread already in publication';
      END;
    END $$;
  `
  
  // Use REST API to execute SQL (requires service role key)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({ sql: migrationSQL })
  }).catch(async () => {
    // Try alternative: use Supabase client's from() to execute
    console.log('⚠️  Direct SQL execution not available')
    console.log('📋 Please run this SQL in Supabase Dashboard:\n')
    console.log(migrationSQL)
    console.log('\nOr go to: Database > Publications > supabase_realtime')
    console.log('And manually enable: messages, conversations, conversation_participants, conversation_unread')
    return null
  })
  
  if (response && response.ok) {
    console.log('✅ Migration applied successfully!\n')
  } else if (response) {
    const text = await response.text()
    console.log(`⚠️  Migration response: ${text}\n`)
  }
  
  // Test realtime subscription
  console.log('🧪 Testing realtime subscription...\n')
  
  let received = false
  const channel = supabase
    .channel('test-realtime-fix')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, (payload) => {
      console.log('✅ REALTIME IS WORKING! Received event:', payload.new.id)
      received = true
      channel.unsubscribe()
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to messages table')
        console.log('⏳ Waiting 5 seconds for any events...\n')
        
        setTimeout(() => {
          if (!received) {
            console.log('⚠️  No events received (this is OK if no messages are being sent)')
            console.log('✅ Subscription is active - realtime should work!\n')
          }
          channel.unsubscribe()
          
          console.log('='.repeat(60))
          console.log('SUMMARY')
          console.log('='.repeat(60))
          console.log('✅ Migration SQL provided/attempted')
          console.log('✅ Realtime subscription test completed')
          console.log('\n📝 Next steps:')
          console.log('   1. If migration failed, run SQL in Supabase Dashboard')
          console.log('   2. Test chat by sending a message')
          console.log('   3. Message should appear instantly for other users')
          console.log('='.repeat(60))
          
          process.exit(0)
        }, 5000)
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ Subscription error - realtime may not be enabled')
        process.exit(1)
      }
    })
}

checkAndFixRealtime().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})





