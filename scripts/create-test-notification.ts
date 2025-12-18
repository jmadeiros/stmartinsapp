/**
 * Create a test notification with rich context to demo the new format
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestNotification() {
  console.log('Creating test notification with rich context...\n')

  // Get admin user (Sarah Mitchell)
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const adminUser = users?.users?.find(u => u.email === 'admin@stmartins.dev')

  if (!adminUser) {
    console.error('Admin user not found')
    return
  }

  // Create a MENTION notification with post context
  // The action_data JSONB field stores additional context like post previews, event titles, etc.
  const notification = {
    user_id: adminUser.id,
    actor_id: adminUser.id, // Self notification for demo
    type: 'mention',
    title: 'Sarah Mitchell mentioned you',
    reference_type: 'post',
    reference_id: '00000000-0000-0000-0000-000000000001',
    link: '/posts/00000000-0000-0000-0000-000000000001',
    read: false,
    action_data: {
      actor_name: 'Sarah Mitchell',
      post_preview: 'Hey @Sarah, just wanted to say thanks for organizing the community garden event! The turnout was amazing and we got so much done. Looking forward to the next one!'
    }
  }

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    return
  }

  console.log('✓ Created test MENTION notification with post preview!')
  console.log('\nNotification details:')
  console.log('- Type: mention')
  console.log('- Title:', notification.title)
  console.log('- Post Preview:', notification.action_data.post_preview)
  console.log('\nGo to your app and refresh, then click the notification bell to see it!')
}

createTestNotification()
