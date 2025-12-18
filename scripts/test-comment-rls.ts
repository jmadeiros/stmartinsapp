/**
 * Test if comments can be created - check RLS on post_comments table
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

async function testCommentRLS() {
  console.log('Testing comment creation RLS...\n')

  // Get users
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const sarah = users?.users?.find(u => u.email === 'admin@stmartins.dev')
  const testUser = users?.users?.find(u => u.email === 'test@stmartins.dev')

  if (!sarah || !testUser) {
    console.error('Users not found')
    return
  }

  console.log('Users found:')
  console.log('  Sarah:', sarah.id)
  console.log('  Test user:', testUser.id)

  // Find a post to comment on
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('id, content, author_id')
    .limit(1)

  if (!posts || posts.length === 0) {
    console.error('No posts found')
    return
  }

  const post = posts[0]
  console.log(`\nTarget post: ${post.id}`)
  console.log(`  Content: ${post.content.substring(0, 50)}...`)

  // Sign in as test user
  const userClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
    email: 'test@stmartins.dev',
    password: 'dev-password-123'
  })

  if (authError || !authData.user) {
    console.error('Could not sign in:', authError?.message)
    return
  }

  console.log(`\n✓ Signed in as test user: ${authData.user.id}`)

  // Try to create a comment
  console.log('\n→ Attempting to create comment...')

  const commentData = {
    post_id: post.id,
    author_id: authData.user.id,
    content: `Test comment at ${new Date().toISOString()}`,
    parent_comment_id: null
  }

  console.log('Comment data:', JSON.stringify(commentData, null, 2))

  const { data: comment, error: commentError } = await userClient
    .from('post_comments')
    .insert(commentData)
    .select()
    .single()

  if (commentError) {
    console.log('\n❌ COMMENT INSERT FAILED!')
    console.log(`   Error: ${commentError.message}`)
    console.log(`   Code: ${commentError.code}`)
    console.log(`   Details: ${commentError.details}`)
    console.log(`   Hint: ${commentError.hint}`)

    if (commentError.code === '42501') {
      console.log('\n🔍 DIAGNOSIS: RLS is blocking comment creation!')
      console.log('   The post_comments table needs an INSERT policy for authenticated users.')
      console.log('\n✅ SOLUTION: Add this RLS policy:')
      console.log(`
CREATE POLICY "Users can create comments"
ON post_comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());
`)
    }
    return
  }

  console.log('\n✅ COMMENT INSERT SUCCEEDED!')
  console.log(`   Comment ID: ${comment.id}`)
  console.log(`   Content: ${comment.content}`)

  // Clean up
  await supabaseAdmin.from('post_comments').delete().eq('id', comment.id)
  console.log('\n✓ Cleaned up test comment')
}

testCommentRLS().catch(console.error)
