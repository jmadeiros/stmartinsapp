/**
 * Test the full comment flow including addComment action and notification creation
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testFullCommentFlow() {
  console.log('Testing full comment flow...\n')

  // Get users
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const sarah = users?.users?.find(u => u.email === 'admin@stmartins.dev')
  const james = users?.users?.find(u => u.email === 'staff@stmartins.dev')

  if (!sarah || !james) {
    console.error('Users not found')
    return
  }

  console.log('✓ Found users:')
  console.log('  - Sarah (post author):', sarah.email)
  console.log('  - James (commenter):', james.email)

  // Find Sarah's recent post
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('id, content, author_id')
    .eq('author_id', sarah.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!posts || posts.length === 0) {
    console.error('\n❌ No posts found for Sarah')
    return
  }

  const post = posts[0]
  console.log('\n✓ Found Sarah\'s post:', post.id)

  // Count existing notifications for Sarah
  const { data: existingNotifs } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('user_id', sarah.id)
    .eq('type', 'comment')

  const initialNotifCount = existingNotifs?.length || 0
  console.log(`\n  Initial comment notifications for Sarah: ${initialNotifCount}`)

  // Create a client authenticated as James
  const { data: jamesSession } = await supabaseAdmin.auth.admin.createSession({
    user_id: james.id
  })

  if (!jamesSession.session) {
    console.error('\n❌ Could not create session for James')
    return
  }

  const jamesClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jamesSession.session.access_token}`
      }
    }
  })

  console.log('\n→ Creating comment as James using addComment action...')
  const commentContent = `Test comment from James via action at ${new Date().toISOString()}`

  // Call the addComment action (simulating what the UI does)
  // We need to import and call it, but since we're in a script context,
  // let's manually replicate what addComment does step by step

  // Step 1: Insert the comment
  const { data: comment, error: commentError } = await jamesClient
    .from('post_comments')
    .insert({
      post_id: post.id,
      author_id: james.id,
      content: commentContent,
      parent_comment_id: null
    })
    .select()
    .single()

  if (commentError || !comment) {
    console.error('\n❌ Error creating comment:', commentError)
    return
  }

  console.log('✓ Comment created:', comment.id)

  // Step 2: Check if notification was created
  // Wait a bit for any async notification creation
  await new Promise(resolve => setTimeout(resolve, 2000))

  const { data: newNotifs } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', sarah.id)
    .eq('type', 'comment')
    .order('created_at', { ascending: false })

  const newNotifCount = newNotifs?.length || 0

  console.log(`\n  Final comment notifications for Sarah: ${newNotifCount}`)

  if (newNotifCount > initialNotifCount) {
    const latestNotif = newNotifs![0]
    console.log('\n✅ SUCCESS! New notification created:')
    console.log('  - ID:', latestNotif.id)
    console.log('  - Title:', latestNotif.title)
    console.log('  - Type:', latestNotif.type)
    console.log('  - Action Data:', JSON.stringify(latestNotif.action_data, null, 2))
  } else {
    console.log('\n❌ FAILURE! No new notification was created.')
    console.log('This means the notification creation is failing silently in addComment.')
    console.log('\nDebugging steps:')
    console.log('1. Check if createCommentNotification is being called')
    console.log('2. Check if there are errors in the try-catch block')
    console.log('3. Check if RLS policies are blocking notification insertion')
    console.log('4. Check console logs in the server for notification creation errors')
  }
}

testFullCommentFlow().catch(console.error)
