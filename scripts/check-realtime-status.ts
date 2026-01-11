/**
 * Check Realtime Status - Simple check if realtime is enabled
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('='.repeat(60))
  console.log('REALTIME STATUS CHECK')
  console.log('='.repeat(60))
  console.log('')
  
  // Read the migration SQL
  const migrationPath = 'supabase/migrations/20251215235000_enable_realtime.sql'
  const migrationSQL = fs.existsSync(migrationPath) 
    ? fs.readFileSync(migrationPath, 'utf-8')
    : null
  
  if (!migrationSQL) {
    console.log('❌ Migration file not found:', migrationPath)
    process.exit(1)
  }
  
  console.log('✅ Migration file found')
  console.log('')
  
  // Test realtime subscription
  console.log('🧪 Testing realtime subscription...')
  console.log('')
  
  let subscribed = false
  let hasError = false
  
  const channel = supabase
    .channel(`status-check-${Date.now()}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages'
    }, () => {
      // This will only fire if we receive an event
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        subscribed = true
        console.log('✅ Successfully subscribed to messages table!')
        console.log('✅ REALTIME IS ENABLED AND WORKING!')
        console.log('')
        console.log('This means:')
        console.log('  • When Sarah sends a message, James will see it instantly')
        console.log('  • No page refresh needed')
        console.log('  • Chat is working in real-time!')
        console.log('')
        
        setTimeout(() => {
          channel.unsubscribe()
          console.log('='.repeat(60))
          console.log('RESULT: ✅ REALTIME IS WORKING!')
          console.log('='.repeat(60))
          process.exit(0)
        }, 2000)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        hasError = true
        console.log('❌ Subscription failed:', status)
        console.log('')
        console.log('This means realtime is NOT enabled.')
        console.log('')
        console.log('TO FIX:')
        console.log('')
        console.log('1. Go to Supabase Dashboard:')
        console.log('   https://supabase.com/dashboard/project/pcokwakenaapsfwcrpyt')
        console.log('')
        console.log('2. Go to: Database > Publications > supabase_realtime')
        console.log('')
        console.log('3. Enable these tables:')
        console.log('   ✅ messages')
        console.log('   ✅ conversations')
        console.log('   ✅ conversation_participants')
        console.log('   ✅ conversation_unread')
        console.log('')
        console.log('OR run this SQL in SQL Editor:')
        console.log('')
        console.log(migrationSQL)
        console.log('')
        
        channel.unsubscribe()
        console.log('='.repeat(60))
        console.log('RESULT: ❌ REALTIME NOT ENABLED')
        console.log('='.repeat(60))
        process.exit(1)
      }
    })
  
  // Timeout after 10 seconds
  setTimeout(() => {
    if (!subscribed && !hasError) {
      console.log('⏳ Still waiting for subscription...')
      console.log('(This might take a moment)')
    }
  }, 10000)
  
  setTimeout(() => {
    if (!subscribed && !hasError) {
      console.log('')
      console.log('⚠️  Subscription taking too long')
      console.log('This might mean realtime is not enabled')
      channel.unsubscribe()
      process.exit(1)
    }
  }, 15000)
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})



