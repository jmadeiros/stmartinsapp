#!/usr/bin/env tsx

/**
 * Simple check - try the exact query that's failing
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

async function test() {
  console.log('🧪 Testing Different Query Approaches')
  console.log('='.repeat(60))
  console.log()

  // Get #general
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('name', 'general')
    .single()

  if (!conv) {
    console.error('No conversation found')
    return
  }

  console.log('Conversation ID:', conv.id)
  console.log()

  // Approach 1: Direct join without hint
  console.log('1️⃣ Trying without foreign key hint...')
  const { data: attempt1, error: error1 } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles (
        user_id,
        full_name,
        avatar_url,
        job_title
      )
    `)
    .eq('conversation_id', conv.id)
    .limit(1)

  if (error1) {
    console.error('❌ Error:', error1.message)
  } else {
    console.log('✅ Success! Got', attempt1?.length, 'messages')
    if (attempt1 && attempt1.length > 0) {
      console.log('Sample:', JSON.stringify(attempt1[0], null, 2))
    }
  }
  console.log()

  // Approach 2: With the FK hint that was failing
  console.log('2️⃣ Trying with FK hint (messages_sender_id_fkey)...')
  const { data: attempt2, error: error2 } = await supabase
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
    .eq('conversation_id', conv.id)
    .limit(1)

  if (error2) {
    console.error('❌ Error:', error2.message)
  } else {
    console.log('✅ Success! Got', attempt2?.length, 'messages')
    if (attempt2 && attempt2.length > 0) {
      console.log('Sample:', JSON.stringify(attempt2[0], null, 2))
    }
  }
  console.log()

  // Approach 3: Using column specification
  console.log('3️⃣ Trying with column specification...')
  const { data: attempt3, error: error3 } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles!sender_id (
        user_id,
        full_name,
        avatar_url,
        job_title
      )
    `)
    .eq('conversation_id', conv.id)
    .limit(1)

  if (error3) {
    console.error('❌ Error:', error3.message)
  } else {
    console.log('✅ Success! Got', attempt3?.length, 'messages')
    if (attempt3 && attempt3.length > 0) {
      console.log('Sample:', JSON.stringify(attempt3[0], null, 2))
    }
  }
  console.log()

  console.log('='.repeat(60))
}

test().catch(console.error)
