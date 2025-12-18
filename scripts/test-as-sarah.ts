import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Using anon key, not service role
)

async function test() {
  console.log('Testing as authenticated user Sarah...\n')

  // Sign in as Sarah
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@stmartins.dev',
    password: 'dev-admin-123'
  })

  if (authError) {
    console.log('❌ Login failed:', authError.message)
    return
  }

  console.log('✅ Logged in as:', authData.user?.email)
  console.log('User ID:', authData.user?.id)
  console.log('')

  // Test 1: Can Sarah see her conversation_participants?
  console.log('--- Test 1: conversation_participants ---')
  const { data: participants, error: partError } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('user_id', authData.user!.id)

  if (partError) {
    console.log('❌ ERROR:', partError.message)
  } else {
    console.log('✅ Found', participants?.length, 'participant records for Sarah')
    participants?.forEach(p => {
      console.log('  - conversation_id:', p.conversation_id)
    })
  }
  console.log('')

  // Test 2: Can Sarah see conversations?
  console.log('--- Test 2: conversations ---')
  const { data: convos, error: convoError } = await supabase
    .from('conversations')
    .select('*')

  if (convoError) {
    console.log('❌ ERROR:', convoError.message)
  } else {
    console.log('✅ Found', convos?.length, 'conversations')
    convos?.forEach(c => {
      console.log('  - id:', c.id, '| name:', c.name || '(DM)')
    })
  }
  console.log('')

  // Test 3: Can Sarah see messages?
  console.log('--- Test 3: messages (simple query) ---')
  const { data: msgs, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .limit(5)

  if (msgError) {
    console.log('❌ ERROR:', msgError.message)
  } else {
    console.log('✅ Found', msgs?.length, 'messages')
    msgs?.forEach(m => {
      console.log('  -', m.content?.substring(0, 40), '...')
    })
  }
  console.log('')

  // Test 4: The exact query from getConversationMessages
  console.log('--- Test 4: messages with sender join (exact UI query) ---')
  const { data: fullMsgs, error: fullError } = await supabase
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
    .eq('conversation_id', 'c28457cd-46f1-4f22-b80c-a2dc2c3a1681')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(50)

  if (fullError) {
    console.log('❌ ERROR:', fullError.message)
    console.log('Details:', JSON.stringify(fullError, null, 2))
  } else {
    console.log('✅ Found', fullMsgs?.length, 'messages with sender info')
    fullMsgs?.slice(-3).forEach((m: any) => {
      console.log('  -', m.content?.substring(0, 30), '... by', m.sender?.full_name || 'UNKNOWN')
    })
  }
}

test()
