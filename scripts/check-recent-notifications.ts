/**
 * Check recent notifications to see which types are being created
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkRecentNotifications() {
  console.log('Checking recent notifications...\n')

  // Get all notifications from the last hour, grouped by type
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: notifications, error } = await supabaseAdmin
    .from('notifications')
    .select('id, type, title, created_at, actor_id, user_id')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    return
  }

  if (!notifications || notifications.length === 0) {
    console.log('No notifications created in the last hour.')
    console.log('\nThis suggests ALL notification types are blocked by RLS,')
    console.log('not just comment notifications.')
    return
  }

  console.log(`Found ${notifications.length} notifications in the last hour:\n`)

  // Group by type
  const byType: Record<string, typeof notifications> = {}
  notifications.forEach(notif => {
    if (!byType[notif.type]) {
      byType[notif.type] = []
    }
    byType[notif.type].push(notif)
  })

  // Display summary
  Object.entries(byType).forEach(([type, notifs]) => {
    console.log(`${type.toUpperCase()}: ${notifs.length} notifications`)
    notifs.slice(0, 3).forEach(n => {
      console.log(`  - ${n.title} (${new Date(n.created_at!).toLocaleTimeString()})`)
    })
  })

  console.log('\n' + '='.repeat(80))
  console.log('ANALYSIS:')
  console.log('='.repeat(80))

  if (byType['reaction'] || byType['like']) {
    console.log('✓ Like/Reaction notifications ARE being created')
  } else {
    console.log('❌ Like/Reaction notifications are NOT being created')
  }

  if (byType['comment']) {
    console.log('✓ Comment notifications ARE being created')
  } else {
    console.log('❌ Comment notifications are NOT being created')
  }

  if (byType['reply']) {
    console.log('✓ Reply notifications ARE being created')
  } else {
    console.log('❌ Reply notifications are NOT being created')
  }

  console.log('\nIf ALL types are blocked, RLS is the issue.')
  console.log('If SOME work and others don\'t, the issue is in the specific action code.')
}

checkRecentNotifications().catch(console.error)
