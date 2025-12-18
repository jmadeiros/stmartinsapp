/**
 * Test the actual addComment server action flow
 * This simulates exactly what happens when the user clicks Comment
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testAddCommentFlow() {
  console.log('Testing full addComment flow...\n')

  // 1. Get Sarah's post
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('id, content, author_id')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!posts || posts.length === 0) {
    console.error('No posts found')
    return
  }

  const post = posts[0]
  console.log(`Target post: ${post.id}`)
  console.log(`  Author: ${post.author_id}`)
  console.log(`  Content: ${post.content.substring(0, 50)}...\n`)

  // 2. Sign in as test user
  const userClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
    email: 'test@stmartins.dev',
    password: 'dev-password-123'
  })

  if (authError || !authData.user) {
    console.error('Auth failed:', authError?.message)
    return
  }

  console.log(`Signed in as: ${authData.user.id}\n`)

  // 3. Simulate the addComment function step by step
  console.log('=== Simulating addComment ===\n')

  const content = `Test comment at ${new Date().toISOString()}`
  const userId = authData.user.id
  const postId = post.id

  // Step 1: Insert comment
  console.log('Step 1: Insert comment...')
  const commentData = {
    post_id: postId,
    author_id: userId,
    content: content.trim(),
    parent_comment_id: null
  }

  const { data: comment, error: insertError } = await userClient
    .from('post_comments')
    .insert(commentData)
    .select()
    .single()

  if (insertError) {
    console.log('❌ Comment insert FAILED:', insertError.message)
    console.log('   Code:', insertError.code)
    return
  }
  console.log('✓ Comment created:', comment.id)

  // Step 2: Fetch user profile
  console.log('\nStep 2: Fetch user profile...')
  const { data: profile, error: profileError } = await userClient
    .from('user_profiles')
    .select('user_id, full_name, avatar_url, job_title, organization_id')
    .eq('user_id', userId)
    .single()

  if (profileError) {
    console.log('❌ Profile fetch FAILED:', profileError.message)
    console.log('   Code:', profileError.code)
    console.log('   This might be why comments fail - user_profiles RLS issue!')
  } else {
    console.log('✓ Profile found:', profile?.full_name)
  }

  // Step 3: Fetch post author for notification
  console.log('\nStep 3: Fetch post author...')
  const { data: postData, error: postFetchError } = await userClient
    .from('posts')
    .select('author_id, content')
    .eq('id', postId)
    .single()

  if (postFetchError) {
    console.log('❌ Post fetch FAILED:', postFetchError.message)
    console.log('   Code:', postFetchError.code)
    console.log('   This might be why notifications fail!')
  } else {
    console.log('✓ Post author:', postData?.author_id)
  }

  // Step 4: Create notification (if different author)
  if (postData && postData.author_id !== userId) {
    console.log('\nStep 4: Create notification...')

    const actorName = profile?.full_name || 'Someone'
    const contentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content
    const postPreview = postData.content?.substring(0, 50) + '...'

    // Note: Don't use .select() - RLS prevents reading others' notifications
    const { error: notifError } = await userClient
      .from('notifications')
      .insert({
        user_id: postData.author_id,
        actor_id: userId,
        type: 'comment',
        title: `${actorName} commented on your post`,
        reference_type: 'post',
        reference_id: postId,
        link: `/posts/${postId}`,
        action_data: {
          actor_name: actorName,
          comment_preview: contentPreview,
          post_preview: postPreview
        },
        read: false
      })

    if (notifError) {
      console.log('❌ Notification FAILED:', notifError.message)
      console.log('   Code:', notifError.code)
    } else {
      console.log('✓ Notification created!')
    }
  } else {
    console.log('\nStep 4: Skipping notification (same author)')
  }

  console.log('\n=== Test Complete ===')
  console.log('\nIf all steps passed, the issue is likely on the client side (UI/React).')
  console.log('If any step failed, that indicates where the problem is.')

  // Cleanup
  await supabaseAdmin.from('post_comments').delete().eq('id', comment.id)
  console.log('\n✓ Cleaned up test comment')
}

testAddCommentFlow().catch(console.error)
