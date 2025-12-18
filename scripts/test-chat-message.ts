#!/usr/bin/env tsx

/**
 * Test script to investigate chat message persistence bug
 *
 * This script:
 * 1. Connects to Supabase with service role key (bypasses RLS)
 * 2. Lists all conversations
 * 3. Lists recent messages
 * 4. Attempts to insert a test message into an existing conversation
 * 5. Reports any errors
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🔍 Chat Message Persistence Test\n')
  console.log('=' .repeat(60))

  // ============================================================================
  // 1. CHECK CONVERSATIONS TABLE
  // ============================================================================
  console.log('\n📊 Step 1: Checking conversations table...')

  const { data: conversations, error: convError, count: convCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10)

  if (convError) {
    console.error('❌ Error fetching conversations:', convError)
  } else {
    console.log(`✓ Found ${convCount} conversation(s)`)
    if (conversations && conversations.length > 0) {
      console.log('\nRecent conversations:')
      conversations.forEach((conv, i) => {
        console.log(`  ${i + 1}. ${conv.name || 'Unnamed DM'} (ID: ${conv.id})`)
        console.log(`     - Type: ${conv.is_group ? 'Group' : 'DM'}`)
        console.log(`     - Created: ${conv.created_at}`)
        console.log(`     - Updated: ${conv.updated_at}`)
      })
    }
  }

  // ============================================================================
  // 2. CHECK MESSAGES TABLE
  // ============================================================================
  console.log('\n📊 Step 2: Checking messages table...')

  const { data: messages, error: msgError, count: msgCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10)

  if (msgError) {
    console.error('❌ Error fetching messages:', msgError)
  } else {
    console.log(`✓ Found ${msgCount} message(s)`)
    if (messages && messages.length > 0) {
      console.log('\nRecent messages:')
      messages.forEach((msg, i) => {
        console.log(`  ${i + 1}. "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`)
        console.log(`     - Conversation ID: ${msg.conversation_id}`)
        console.log(`     - Sender ID: ${msg.sender_id}`)
        console.log(`     - Created: ${msg.created_at}`)
        console.log(`     - Deleted: ${msg.deleted_at ? 'Yes' : 'No'}`)
      })
    } else {
      console.log('  (No messages found)')
    }
  }

  // ============================================================================
  // 3. CHECK CONVERSATION_PARTICIPANTS TABLE
  // ============================================================================
  console.log('\n📊 Step 3: Checking conversation_participants table...')

  const { data: participants, error: partError, count: partCount } = await supabase
    .from('conversation_participants')
    .select('*', { count: 'exact' })
    .limit(10)

  if (partError) {
    console.error('❌ Error fetching participants:', partError)
  } else {
    console.log(`✓ Found ${partCount} participant record(s)`)
  }

  // ============================================================================
  // 4. TEST MESSAGE INSERT
  // ============================================================================
  console.log('\n📊 Step 4: Testing message insert...')

  if (!conversations || conversations.length === 0) {
    console.log('⚠️  No conversations found - cannot test message insert')
    console.log('   You need to create a conversation first via the chat UI')
  } else {
    const testConversation = conversations[0]
    console.log(`\nUsing conversation: ${testConversation.name || 'Unnamed'} (${testConversation.id})`)

    // Get a participant to use as sender
    const { data: convParticipants, error: convPartError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', testConversation.id)
      .limit(1)

    if (convPartError) {
      console.error('❌ Error fetching conversation participants:', convPartError)
    } else if (!convParticipants || convParticipants.length === 0) {
      console.log('⚠️  No participants found for this conversation')
    } else {
      const senderId = convParticipants[0].user_id
      console.log(`Using sender ID: ${senderId}`)

      // Try to insert a test message
      const testMessage = {
        conversation_id: testConversation.id,
        sender_id: senderId,
        content: `[TEST] Message sent at ${new Date().toISOString()}`,
        attachments: [],
      }

      console.log('\nAttempting to insert test message...')
      const { data: insertedMsg, error: insertError } = await supabase
        .from('messages')
        .insert(testMessage)
        .select()
        .single()

      if (insertError) {
        console.error('❌ FAILED to insert message!')
        console.error('   Error details:', insertError)
        console.error('   Error code:', insertError.code)
        console.error('   Error message:', insertError.message)
        console.error('   Error hint:', insertError.hint)
      } else {
        console.log('✅ SUCCESS! Message inserted:')
        console.log('   Message ID:', insertedMsg.id)
        console.log('   Content:', insertedMsg.content)
        console.log('   Created at:', insertedMsg.created_at)

        // Verify the message persists by fetching it back
        console.log('\nVerifying message persistence...')
        const { data: fetchedMsg, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('id', insertedMsg.id)
          .single()

        if (fetchError) {
          console.error('❌ Failed to fetch message back:', fetchError)
        } else if (!fetchedMsg) {
          console.error('❌ Message not found after insert!')
        } else {
          console.log('✅ Message successfully persisted and retrieved')
        }
      }
    }
  }

  // ============================================================================
  // 5. CHECK RLS POLICIES
  // ============================================================================
  console.log('\n📊 Step 5: Checking RLS policies on messages table...')

  const { data: policies, error: policyError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'messages')

  if (policyError) {
    console.error('❌ Error fetching RLS policies:', policyError)
  } else if (!policies || policies.length === 0) {
    console.log('⚠️  No RLS policies found for messages table')
  } else {
    console.log(`✓ Found ${policies.length} RLS policy/policies:`)
    policies.forEach((policy: any) => {
      console.log(`  - ${policy.policyname} (${policy.cmd})`)
      if (policy.qual) {
        console.log(`    USING: ${policy.qual}`)
      }
      if (policy.with_check) {
        console.log(`    WITH CHECK: ${policy.with_check}`)
      }
    })
  }

  // ============================================================================
  // 6. CHECK IF RLS IS ENABLED
  // ============================================================================
  console.log('\n📊 Step 6: Checking if RLS is enabled on messages table...')

  const { data: tableInfo, error: tableError } = await supabase
    .rpc('pg_tables')
    .select('*')
    .eq('tablename', 'messages')

  // Alternative way to check RLS
  const { data: rlsCheck, error: rlsError } = await supabase
    .from('pg_class')
    .select('relname, relrowsecurity')
    .eq('relname', 'messages')
    .single()

  if (rlsError) {
    console.log('⚠️  Could not check RLS status via pg_class')
  } else {
    console.log(`✓ RLS enabled: ${rlsCheck?.relrowsecurity ? 'YES' : 'NO'}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Investigation complete!\n')
}

main().catch(console.error)
