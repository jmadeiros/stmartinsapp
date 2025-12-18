#!/usr/bin/env tsx

/**
 * Comprehensive diagnostic script for chat messaging issues
 *
 * This script:
 * 1. Lists all conversations
 * 2. Lists Sarah Mitchell's participations
 * 3. Checks if #general channel exists and Sarah is in it
 * 4. Attempts to send a test message and reports success/failure
 * 5. Checks RLS policies on messages table
 * 6. Validates conversation participants
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ConversationInfo {
  id: string
  name: string | null
  is_group: boolean
  org_id: string | null
  created_by: string
  created_at: string
  archived: boolean
}

interface ParticipantInfo {
  conversation_id: string
  user_id: string
  org_id: string
  joined_at: string
  last_read_at: string | null
  muted: boolean
}

interface MessageInfo {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

async function main() {
  console.log('🔍 CHAT DIAGNOSTIC REPORT')
  console.log('=' .repeat(60))
  console.log()

  // Find Sarah Mitchell
  const { data: sarah, error: sarahError } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, organization_id, organization:organizations!user_profiles_organization_id_fkey(id, name)')
    .eq('full_name', 'Sarah Mitchell')
    .single()

  if (sarahError || !sarah) {
    console.error('❌ Could not find Sarah Mitchell:', sarahError?.message)
    process.exit(1)
  }

  console.log('✅ Found Sarah Mitchell')
  console.log(`   User ID: ${sarah.user_id}`)
  console.log(`   Org ID: ${sarah.organization_id}`)
  console.log(`   Org Name: ${(sarah.organization as any)?.name}`)
  console.log()

  const sarahUserId = sarah.user_id
  const sarahOrgId = sarah.organization_id

  // 1. List all conversations in the organization
  console.log('📋 STEP 1: All Conversations in Organization')
  console.log('-'.repeat(60))

  const { data: allConversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('org_id', sarahOrgId)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (convError) {
    console.error('❌ Error fetching conversations:', convError.message)
  } else if (!allConversations || allConversations.length === 0) {
    console.log('⚠️  No conversations found in this organization')
  } else {
    console.log(`Found ${allConversations.length} conversation(s):`)
    allConversations.forEach((conv: any) => {
      console.log(`   - ID: ${conv.id}`)
      console.log(`     Name: ${conv.name || '(unnamed)'}`)
      console.log(`     Type: ${conv.is_group ? 'Group/Channel' : 'DM'}`)
      console.log(`     Created: ${conv.created_at}`)
    })
  }
  console.log()

  // Find the #general channel
  const generalChannel = allConversations?.find((c: any) => c.name === 'general')

  if (!generalChannel) {
    console.log('⚠️  No #general channel found')
  } else {
    console.log('✅ #general channel found')
    console.log(`   ID: ${generalChannel.id}`)
  }
  console.log()

  // 2. List Sarah's participations
  console.log('👥 STEP 2: Sarah\'s Conversation Participations')
  console.log('-'.repeat(60))

  const { data: sarahParticipations, error: partError } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('user_id', sarahUserId)
    .eq('org_id', sarahOrgId)

  if (partError) {
    console.error('❌ Error fetching participations:', partError.message)
  } else if (!sarahParticipations || sarahParticipations.length === 0) {
    console.log('⚠️  Sarah is not a participant in any conversations!')
  } else {
    console.log(`Sarah is a participant in ${sarahParticipations.length} conversation(s):`)
    for (const part of sarahParticipations) {
      const conv = allConversations?.find((c: any) => c.id === part.conversation_id)
      console.log(`   - Conversation: ${conv?.name || conv?.id || part.conversation_id}`)
      console.log(`     Joined: ${part.joined_at}`)
      console.log(`     Last Read: ${part.last_read_at || 'Never'}`)
      console.log(`     Muted: ${part.muted}`)
    }
  }
  console.log()

  // 3. Check if Sarah is in #general
  console.log('🔎 STEP 3: Sarah in #general Channel?')
  console.log('-'.repeat(60))

  if (!generalChannel) {
    console.log('❌ Cannot check - no #general channel exists')
  } else {
    const isInGeneral = sarahParticipations?.some(p => p.conversation_id === generalChannel.id)
    if (isInGeneral) {
      console.log('✅ Sarah IS a participant in #general')
    } else {
      console.log('❌ Sarah IS NOT a participant in #general')
      console.log('   This is likely the problem - users must be participants to send messages')
    }
  }
  console.log()

  // 4. Check RLS policies on messages table
  console.log('🔒 STEP 4: RLS Policies on Messages Table')
  console.log('-'.repeat(60))

  try {
    const { data: rlsPolicies, error: rlsError } = await supabase.rpc('get_rls_policies', {
      table_name: 'messages'
    })

    if (rlsError) {
      console.log('⚠️  Could not fetch RLS policies via RPC, trying direct query...')

      const { data: policies, error: pgError } = await supabase
        .from('pg_policies' as any)
        .select('*')
        .eq('tablename', 'messages')

      if (pgError) {
        console.log('⚠️  Could not fetch RLS policies:', pgError.message)
      } else if (policies && policies.length > 0) {
        console.log(`Found ${policies.length} RLS policy/policies:`)
        policies.forEach((policy: any) => {
          console.log(`   - ${policy.policyname || policy.name}`)
          console.log(`     Command: ${policy.cmd || policy.command}`)
        })
      } else {
        console.log('⚠️  No RLS policies found on messages table')
      }
    } else if (rlsPolicies && rlsPolicies.length > 0) {
      console.log(`Found ${rlsPolicies.length} RLS policy/policies:`)
      rlsPolicies.forEach((policy: any) => {
        console.log(`   - ${policy.policyname || policy.name}`)
        console.log(`     Command: ${policy.cmd || policy.command}`)
        console.log(`     Using: ${policy.qual || policy.using || '(none)'}`)
        console.log(`     With Check: ${policy.with_check || '(none)'}`)
      })
    } else {
      console.log('⚠️  No RLS policies found on messages table')
    }
  } catch (err) {
    console.log('⚠️  Error checking RLS policies:', err instanceof Error ? err.message : String(err))
  }
  console.log()

  // 5. Attempt to send a test message
  console.log('📨 STEP 5: Attempt to Send Test Message')
  console.log('-'.repeat(60))

  if (!generalChannel) {
    console.log('❌ Cannot send test message - no #general channel')
  } else {
    const isInGeneral = sarahParticipations?.some(p => p.conversation_id === generalChannel.id)

    if (!isInGeneral) {
      console.log('⚠️  Sarah is not in #general, attempting to add her first...')

      const { error: joinError } = await supabase
        .from('conversation_participants')
        .upsert({
          conversation_id: generalChannel.id,
          user_id: sarahUserId,
          org_id: sarahOrgId,
          joined_at: new Date().toISOString(),
          muted: false
        })

      if (joinError) {
        console.error('❌ Failed to add Sarah to #general:', joinError.message)
      } else {
        console.log('✅ Successfully added Sarah to #general')
      }
    }

    console.log('Attempting to insert test message...')
    const testMessage = {
      conversation_id: generalChannel.id,
      sender_id: sarahUserId,
      content: `[DIAGNOSTIC TEST ${new Date().toISOString()}] This is a test message from the diagnostic script.`,
      attachments: []
    }

    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()
      .single()

    if (insertError) {
      console.error('❌ FAILED to insert message:', insertError.message)
      console.error('   Code:', insertError.code)
      console.error('   Details:', insertError.details)
      console.error('   Hint:', insertError.hint)
    } else {
      console.log('✅ Successfully inserted message!')
      console.log(`   Message ID: ${insertedMessage.id}`)
      console.log(`   Content: ${insertedMessage.content}`)
      console.log(`   Created: ${insertedMessage.created_at}`)

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', generalChannel.id)
    }
  }
  console.log()

  // 6. Check messages count in #general
  console.log('💬 STEP 6: Messages in #general')
  console.log('-'.repeat(60))

  if (!generalChannel) {
    console.log('❌ Cannot check - no #general channel')
  } else {
    const { data: messages, error: msgError, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', generalChannel.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)

    if (msgError) {
      console.error('❌ Error fetching messages:', msgError.message)
    } else {
      console.log(`Total messages: ${count}`)
      if (messages && messages.length > 0) {
        console.log('Recent messages:')
        messages.forEach((msg: any) => {
          console.log(`   - [${msg.created_at}] ${msg.sender_id}: ${msg.content.substring(0, 50)}...`)
        })
      } else {
        console.log('No messages in conversation')
      }
    }
  }
  console.log()

  // 7. Summary and Recommendations
  console.log('📊 SUMMARY & RECOMMENDATIONS')
  console.log('='.repeat(60))

  const issues: string[] = []
  const fixes: string[] = []

  if (!generalChannel) {
    issues.push('No #general channel exists')
    fixes.push('Create #general channel for the organization')
  }

  if (generalChannel && sarahParticipations && !sarahParticipations.some(p => p.conversation_id === generalChannel.id)) {
    issues.push('Sarah is not a participant in #general')
    fixes.push('Add Sarah to #general channel participants')
  }

  if (!sarahParticipations || sarahParticipations.length === 0) {
    issues.push('Sarah has no conversation participations')
    fixes.push('Ensure initializeChat() is called when user logs in')
  }

  if (issues.length === 0) {
    console.log('✅ No major issues detected!')
    console.log('   All checks passed. The problem might be in the UI layer.')
    console.log('   Check browser console for JavaScript errors.')
  } else {
    console.log(`⚠️  Found ${issues.length} issue(s):`)
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`)
    })
    console.log()
    console.log('💡 Recommended fixes:')
    fixes.forEach((fix, i) => {
      console.log(`   ${i + 1}. ${fix}`)
    })
  }

  console.log()
  console.log('=' .repeat(60))
  console.log('Diagnostic complete!')
}

main().catch(console.error)
