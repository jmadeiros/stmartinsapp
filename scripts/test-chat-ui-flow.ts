#!/usr/bin/env tsx

/**
 * Test the exact flow that the UI uses when sending a message
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

async function testChatUIFlow() {
  console.log('🧪 Testing Chat UI Message Send Flow')
  console.log('=' .repeat(60))
  console.log()

  // 1. Get Sarah
  const { data: sarah } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, organization_id')
    .eq('full_name', 'Sarah Mitchell')
    .single()

  if (!sarah) {
    console.error('❌ Could not find Sarah')
    return
  }

  console.log('✅ Sarah:', sarah.user_id)

  // 2. Get #general conversation
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

  console.log('✅ #general:', generalConv.id)
  console.log()

  // 3. Simulate the exact sendChatMessage action
  console.log('📨 Simulating sendChatMessage action...')

  const testContent = `[UI FLOW TEST ${new Date().toISOString()}] Testing exact UI flow`

  try {
    // This is exactly what /lib/actions/chat.ts does
    const { data: message, error: sendError } = await supabase
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
      console.error('❌ Insert error:', sendError)
      console.log('   Code:', sendError.code)
      console.log('   Message:', sendError.message)
      console.log('   Details:', sendError.details)
      console.log('   Hint:', sendError.hint)
      return
    }

    console.log('✅ Message inserted:', message.id)

    // Update conversation timestamp (like the action does)
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', generalConv.id)

    if (updateError) {
      console.error('⚠️  Could not update conversation timestamp:', updateError.message)
    }

    console.log()
    console.log('📡 Testing Real-time Subscription...')

    // 4. Set up a real-time subscription like the UI does
    let receivedMessage = false
    const channel = supabase
      .channel(`test-messages:${generalConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${generalConv.id}`,
        },
        async (payload: any) => {
          console.log('📬 Real-time message received!')
          console.log('   Payload:', JSON.stringify(payload.new, null, 2))
          receivedMessage = true

          // Fetch full message like the UI does
          const { data: fullMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:user_profiles!messages_sender_id_fkey (
                user_id,
                full_name,
                avatar_url,
                job_title
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (fullMessage) {
            console.log('✅ Full message fetched:')
            console.log('   ID:', fullMessage.id)
            console.log('   Sender:', (fullMessage as any).sender?.full_name)
            console.log('   Content:', fullMessage.content)
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
      })

    console.log('⏱️  Waiting 3 seconds for real-time event...')

    // Send another message after subscription is set up
    setTimeout(async () => {
      const { data: msg2 } = await supabase
        .from('messages')
        .insert({
          conversation_id: generalConv.id,
          sender_id: sarah.user_id,
          content: '[REALTIME TEST] This should trigger subscription',
          attachments: [],
        })
        .select()
        .single()

      console.log('📤 Sent second message:', msg2?.id)
    }, 1000)

    await new Promise(resolve => setTimeout(resolve, 3000))

    if (receivedMessage) {
      console.log()
      console.log('✅ Real-time subscription is working!')
    } else {
      console.log()
      console.log('⚠️  Real-time subscription did NOT receive the message')
      console.log('   This could indicate:')
      console.log('   1. Real-time is not enabled on the Supabase project')
      console.log('   2. The browser client is not properly subscribed')
      console.log('   3. There is a filtering issue')
    }

    await channel.unsubscribe()

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }

  console.log()
  console.log('=' .repeat(60))
  console.log('Test complete!')
}

testChatUIFlow().catch(console.error).finally(() => process.exit(0))
