#!/usr/bin/env tsx

/**
 * Test sending a chat message as an authenticated user (not service role)
 * This will test if RLS policies are working correctly
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

// Service role client (for setup)
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Anon client (for testing as user)
const anonSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🔍 Testing Chat Message as Authenticated User\n')
  console.log('=' .repeat(60))

  // ============================================================================
  // 1. GET SARAH'S USER DATA
  // ============================================================================
  console.log('\n📊 Step 1: Getting Sarah\'s user data...')

  const sarahEmail = 'admin@stmartins.dev'
  const sarahUserId = '643bf6ba-0eb2-4bc0-a31e-2479cdbc3f0f'

  const { data: sarahProfile } = await serviceSupabase
    .from('user_profiles')
    .select('*, organization:organizations!user_profiles_organization_id_fkey(*)')
    .eq('user_id', sarahUserId)
    .single()

  if (!sarahProfile) {
    console.error('❌ Could not find Sarah\'s profile')
    return
  }

  console.log(`✓ Found Sarah: ${sarahProfile.full_name}`)
  console.log(`  Org: ${sarahProfile.organization?.name}`)
  console.log(`  Org ID: ${sarahProfile.organization_id}`)

  // ============================================================================
  // 2. ENSURE #GENERAL CONVERSATION EXISTS
  // ============================================================================
  console.log('\n📊 Step 2: Ensuring #general conversation exists...')

  let { data: generalConv, error: findConvError } = await serviceSupabase
    .from('conversations')
    .select('*')
    .eq('name', 'general')
    .eq('org_id', sarahProfile.organization_id)
    .eq('archived', false)
    .maybeSingle()

  if (findConvError) {
    console.error('❌ Error finding general conversation:', findConvError)
    return
  }

  if (!generalConv) {
    console.log('Creating #general conversation...')
    const { data: newConv, error: createError } = await serviceSupabase
      .from('conversations')
      .insert({
        name: 'general',
        is_group: true,
        org_id: sarahProfile.organization_id,
        created_by: sarahUserId,
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating conversation:', createError)
      return
    }

    generalConv = newConv
    console.log('✓ Created #general conversation')
  } else {
    console.log('✓ #general conversation already exists')
  }

  console.log(`  Conversation ID: ${generalConv.id}`)

  // ============================================================================
  // 3. ENSURE SARAH IS A PARTICIPANT
  // ============================================================================
  console.log('\n📊 Step 3: Ensuring Sarah is a participant...')

  const { error: partError } = await serviceSupabase
    .from('conversation_participants')
    .upsert({
      conversation_id: generalConv.id,
      user_id: sarahUserId,
      org_id: sarahProfile.organization_id,
    }, {
      onConflict: 'conversation_id,user_id'
    })

  if (partError) {
    console.error('❌ Error adding participant:', partError)
  } else {
    console.log('✓ Sarah is now a participant')
  }

  // ============================================================================
  // 4. SIGN IN AS SARAH
  // ============================================================================
  console.log('\n📊 Step 4: Signing in as Sarah...')

  // First, get or set Sarah's password using service role
  const testPassword = 'dev-password-123'

  // Update Sarah's password using service role
  const { error: passwordError } = await serviceSupabase.auth.admin.updateUserById(
    sarahUserId,
    { password: testPassword }
  )

  if (passwordError) {
    console.error('❌ Error setting password:', passwordError)
  } else {
    console.log('✓ Password set for Sarah')
  }

  // Sign in as Sarah using anon client
  const { data: authData, error: signInError } = await anonSupabase.auth.signInWithPassword({
    email: sarahEmail,
    password: testPassword,
  })

  if (signInError) {
    console.error('❌ Error signing in:', signInError)
    return
  }

  console.log('✓ Signed in as Sarah')
  console.log(`  Session token: ${authData.session?.access_token?.substring(0, 20)}...`)

  // ============================================================================
  // 5. TRY TO INSERT MESSAGE AS SARAH (USING ANON CLIENT)
  // ============================================================================
  console.log('\n📊 Step 5: Attempting to insert message as Sarah (via anon client)...')

  const testMessage = {
    conversation_id: generalConv.id,
    sender_id: sarahUserId,
    content: `[TEST] Message from Sarah at ${new Date().toISOString()}`,
    attachments: [],
  }

  console.log('Message data:', JSON.stringify(testMessage, null, 2))

  const { data: insertedMsg, error: insertError } = await anonSupabase
    .from('messages')
    .insert(testMessage)
    .select()
    .single()

  if (insertError) {
    console.error('❌ FAILED to insert message as authenticated user!')
    console.error('   Error code:', insertError.code)
    console.error('   Error message:', insertError.message)
    console.error('   Error details:', insertError.details)
    console.error('   Error hint:', insertError.hint)

    // Try to diagnose the issue
    console.log('\n🔍 Diagnosing the issue...')

    // Check if user is authenticated
    const { data: { user } } = await anonSupabase.auth.getUser()
    if (!user) {
      console.error('   ❌ User is not authenticated!')
    } else {
      console.log('   ✓ User is authenticated:', user.id)
    }

    // Check if participant record exists
    const { data: partCheck } = await anonSupabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', generalConv.id)
      .eq('user_id', sarahUserId)
      .single()

    if (!partCheck) {
      console.error('   ❌ User is NOT a participant in the conversation (or cannot see the record due to RLS)')
    } else {
      console.log('   ✓ User IS a participant in the conversation')
    }

  } else {
    console.log('✅ SUCCESS! Message inserted as authenticated user:')
    console.log('   Message ID:', insertedMsg.id)
    console.log('   Content:', insertedMsg.content)
    console.log('   Created at:', insertedMsg.created_at)

    // Verify persistence
    console.log('\n📊 Step 6: Verifying message persistence...')

    const { data: fetchedMsg, error: fetchError } = await anonSupabase
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

    // Try fetching all messages in the conversation
    console.log('\n📊 Step 7: Fetching all messages in conversation...')

    const { data: allMessages, error: allMsgError } = await anonSupabase
      .from('messages')
      .select('*')
      .eq('conversation_id', generalConv.id)
      .order('created_at', { ascending: true })

    if (allMsgError) {
      console.error('❌ Error fetching all messages:', allMsgError)
    } else {
      console.log(`✓ Found ${allMessages?.length || 0} message(s) in conversation`)
      if (allMessages && allMessages.length > 0) {
        allMessages.forEach((msg: any, i: number) => {
          console.log(`  ${i + 1}. "${msg.content.substring(0, 50)}..."`)
        })
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Test complete!\n')
}

main().catch(console.error)
