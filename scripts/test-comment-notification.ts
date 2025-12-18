/**
 * Test comment notification creation
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

async function testCommentNotification() {
  console.log('Testing comment notification creation...\n')

  // Get users
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const sarah = users?.users?.find(u => u.email === 'admin@stmartins.dev')
  const james = users?.users?.find(u => u.email === 'staff@stmartins.dev')

  if (!sarah || !james) {
    console.error('Users not found')
    console.log('Sarah:', sarah?.email)
    console.log('James:', james?.email)
    return
  }

  console.log('✓ Found users:')
  console.log('  - Sarah:', sarah.email, sarah.id)
  console.log('  - James:', james.email, james.id)

  // Find Sarah's recent post
  const { data: posts, error: postsError } = await supabaseAdmin
    .from('posts')
    .select('id, content, author_id')
    .eq('author_id', sarah.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (postsError || !posts || posts.length === 0) {
    console.error('\n❌ Error finding Sarah\'s post:', postsError)
    console.log('Please create a post as Sarah first')
    return
  }

  const post = posts[0]
  console.log('\n✓ Found post:')
  console.log('  - ID:', post.id)
  console.log('  - Content:', post.content.substring(0, 50) + '...')
  console.log('  - Author:', post.author_id)

  // Create a comment as James
  console.log('\n→ Creating comment as James...')
  const commentContent = `Test comment from James at ${new Date().toISOString()}`

  const { data: comment, error: commentError } = await supabaseAdmin
    .from('post_comments')
    .insert({
      post_id: post.id,
      author_id: james.id,
      content: commentContent
      // Note: parent_id removed - checking if it exists in schema
    })
    .select()
    .single()

  if (commentError || !comment) {
    console.error('\n❌ Error creating comment:', commentError)
    return
  }

  console.log('✓ Created comment:', comment.id)

  // Now manually create the notification (simulating what should happen)
  console.log('\n→ Creating notification for Sarah...')

  const { data: jamesProfile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', james.id)
    .single()

  const actorName = jamesProfile?.full_name || 'James Chen'
  const postPreview = post.content.length > 50
    ? post.content.substring(0, 50) + '...'
    : post.content
  const commentPreview = commentContent.length > 100
    ? commentContent.substring(0, 100) + '...'
    : commentContent

  const notification = {
    user_id: sarah.id,
    actor_id: james.id,
    type: 'comment',
    title: `${actorName} commented on your post`,
    reference_type: 'post',
    reference_id: post.id,
    link: `/posts/${post.id}`,
    action_data: {
      actor_name: actorName,
      comment_preview: commentPreview,
      post_preview: postPreview
    },
    read: false
  }

  const { data: notif, error: notifError } = await supabaseAdmin
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  if (notifError) {
    console.error('\n❌ Error creating notification:', notifError)
    console.log('\nNotification data attempted:')
    console.log(JSON.stringify(notification, null, 2))
    return
  }

  console.log('✓ Created notification:', notif.id)
  console.log('\nNotification details:')
  console.log('- Type:', notification.type)
  console.log('- Title:', notification.title)
  console.log('- Comment Preview:', notification.action_data.comment_preview)
  console.log('- Post Preview:', notification.action_data.post_preview)
  console.log('\n✅ SUCCESS! Comment notification created.')
  console.log('Log in as Sarah and check the notification bell.')

  // Verify the notification exists
  const { data: checkNotif, error: checkError } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('id', notif.id)
    .single()

  if (checkError || !checkNotif) {
    console.error('\n⚠️  Warning: Could not verify notification was stored')
  } else {
    console.log('\n✓ Verified notification is in database')
  }
}

testCommentNotification().catch(console.error)
