/**
 * Clean up test notifications with weird timestamps/test data
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function cleanupTestNotifications() {
  console.log('Cleaning up test notifications...\n')

  // Delete notifications that have test patterns in them
  const { data: testNotifs, error: fetchError } = await supabaseAdmin
    .from('notifications')
    .select('id, title, action_data')
    .or('title.ilike.%Test%,title.ilike.%Someone%')

  if (fetchError) {
    console.error('Error fetching:', fetchError.message)
    return
  }

  console.log(`Found ${testNotifs?.length || 0} test notifications to clean up:`)
  testNotifs?.forEach(n => {
    console.log(`  - ${n.id.substring(0, 8)}... : ${n.title}`)
  })

  if (testNotifs && testNotifs.length > 0) {
    const ids = testNotifs.map(n => n.id)
    const { error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .in('id', ids)

    if (deleteError) {
      console.error('Error deleting:', deleteError.message)
    } else {
      console.log(`\n✓ Deleted ${ids.length} test notifications`)
    }
  }

  // Also clean up notifications with timestamp patterns in content
  const { data: timestampNotifs } = await supabaseAdmin
    .from('notifications')
    .select('id, title, action_data')

  const toDelete: string[] = []
  timestampNotifs?.forEach(n => {
    const actionData = n.action_data as any
    if (actionData?.comment_preview?.includes('176579') ||
        actionData?.comment_preview?.includes('2025-12-15T')) {
      toDelete.push(n.id)
      console.log(`  Marking for deletion: ${n.title?.substring(0, 50)}...`)
    }
  })

  if (toDelete.length > 0) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .in('id', toDelete)

    if (!error) {
      console.log(`\n✓ Deleted ${toDelete.length} more test notifications`)
    }
  }

  // Show remaining notifications
  const { data: remaining } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, type, title, read')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('\n=== Remaining notifications (first 10) ===')
  remaining?.forEach(n => {
    console.log(`  ${n.type}: ${n.title?.substring(0, 50)}... (read: ${n.read})`)
  })

  // Count totals
  const { count: total } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })

  const { count: unread } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)

  console.log(`\nTotal: ${total}, Unread: ${unread}`)
}

cleanupTestNotifications().catch(console.error)
