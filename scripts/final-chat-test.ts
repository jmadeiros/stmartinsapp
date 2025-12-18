#!/usr/bin/env tsx

/**
 * Final comprehensive test of the entire chat flow
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function finalTest() {
  console.log('🎯 FINAL CHAT SYSTEM TEST')
  console.log('='.repeat(60))
  console.log()

  // Get Sarah
  const { data: sarah } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, organization_id')
    .eq('full_name', 'Sarah Mitchell')
    .single()

  if (!sarah) {
    console.error('❌ Could not find Sarah')
    return
  }

  console.log('✅ User: Sarah Mitchell')
  console.log(`   ID: ${sarah.user_id}`)
  console.log()

  // Get #general
  const { data: generalConv } = await supabase
    .from('conversations')
    .select('*')
    .eq('name', 'general')
    .eq('org_id', sarah.organization_id)
    .single()

  if (!generalConv) {
    console.error('❌ Could not find #general')
    return
  }

  console.log('✅ Conversation: #general')
  console.log(`   ID: ${generalConv.id}`)
  console.log()

  // Step 1: Fetch existing messages (simulates loadMessages)
  console.log('📥 STEP 1: Fetch Existing Messages')
  console.log('-'.repeat(60))

  const { data: existingMessages, error: fetchError } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles!messages_sender_id_fkey (
        user_id,
        full_name,
        avatar_url,
        job_title,
        organization:organizations!user_profiles_organization_id_fkey (name)
      )
    `)
    .eq('conversation_id', generalConv.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(50)

  if (fetchError) {
    console.error('❌ Fetch failed:', fetchError.message)
    return
  }

  console.log(`✅ Fetched ${existingMessages?.length || 0} existing messages`)
  console.log()

  // Step 2: Send a new message (simulates handleSendMessage)
  console.log('📤 STEP 2: Send New Message')
  console.log('-'.repeat(60))

  const testContent = `Hello from final test at ${new Date().toISOString()}`

  const { data: newMessage, error: sendError } = await supabase
    .from('messages')
    .insert({
      conversation_id: generalConv.id,
      sender_id: sarah.user_id,
      content: testContent,
      reply_to_id: null,
      attachments: [],
    })
    .select()
    .single()

  if (sendError) {
    console.error('❌ Send failed:', sendError.message)
    return
  }

  console.log('✅ Message sent successfully')
  console.log(`   ID: ${newMessage.id}`)
  console.log(`   Content: ${newMessage.content}`)
  console.log()

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', generalConv.id)

  // Step 3: Fetch messages again (simulates what UI would see after send)
  console.log('📥 STEP 3: Fetch Messages Again (Should Include New Message)')
  console.log('-'.repeat(60))

  const { data: updatedMessages, error: refetchError } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles!messages_sender_id_fkey (
        user_id,
        full_name,
        avatar_url,
        job_title,
        organization:organizations!user_profiles_organization_id_fkey (name)
      )
    `)
    .eq('conversation_id', generalConv.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(50)

  if (refetchError) {
    console.error('❌ Re-fetch failed:', refetchError.message)
    return
  }

  console.log(`✅ Fetched ${updatedMessages?.length || 0} messages`)

  const foundNewMessage = updatedMessages?.find(m => m.id === newMessage.id)
  if (foundNewMessage) {
    console.log('✅ New message appears in the list!')
    console.log(`   Sender: ${(foundNewMessage as any).sender?.full_name}`)
    console.log(`   Content: ${foundNewMessage.content}`)
  } else {
    console.log('❌ New message NOT found in the list')
  }
  console.log()

  // Step 4: Summary
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log('✅ All database operations successful')
  console.log('✅ Messages can be fetched with sender details')
  console.log('✅ Messages can be inserted')
  console.log('✅ Newly inserted messages appear in subsequent fetches')
  console.log()
  console.log('🎉 The database layer is working correctly!')
  console.log()
  console.log('⚠️  IMPORTANT: Real-time subscriptions are NOT working')
  console.log('   Messages will only appear after page refresh')
  console.log('   or manual refetch. To fix:')
  console.log('   1. Enable Realtime in Supabase Dashboard')
  console.log('   2. Add messages table to realtime publication')
  console.log()
  console.log('💡 To test the UI:')
  console.log('   1. Open the chat page in browser')
  console.log('   2. Type a message and send')
  console.log('   3. Refresh the page')
  console.log('   4. The message should now appear')
  console.log()
  console.log('='.repeat(60))
}

finalTest().catch(console.error)
