import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  console.log('Testing the exact query from getConversationMessages...\n')

  // This is the exact query from getConversationMessages
  const { data, error } = await supabase
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

  if (error) {
    console.log('❌ ERROR:', error.message)
    console.log('Details:', JSON.stringify(error, null, 2))
  } else {
    console.log('✅ SUCCESS! Found', data?.length, 'messages')
    console.log('\nLast 5 messages:')
    data?.slice(-5).forEach((m: any) => {
      console.log(`- ${m.content.substring(0, 40)}... by ${m.sender?.full_name || 'UNKNOWN SENDER'}`)
    })
  }
}
test()
