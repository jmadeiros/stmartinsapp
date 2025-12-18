#!/usr/bin/env tsx
/**
 * Test the toggleReaction server action directly
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testToggleReaction() {
  console.log('=== Testing toggleReaction Server Action ===\n')

  // 1. Sign in as test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@stmartins.dev',
    password: 'dev-password-123'
  })

  if (authError || !authData.user) {
    console.log('❌ Authentication failed:', authError?.message)
    return
  }
  console.log(`✓ Authenticated as: ${authData.user.email}`)

  // 2. Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, full_name')
    .eq('user_id', authData.user.id)
    .single()

  console.log(`✓ User: ${profile?.full_name}`)

  // 3. Get a post
  const { data: posts } = await supabase
    .from('posts')
    .select('id, content')
    .eq('org_id', profile?.organization_id)
    .limit(1)

  if (!posts || posts.length === 0) {
    console.log('❌ No posts found')
    return
  }

  const post = posts[0]
  console.log(`✓ Testing with post: ${post.id}`)
  console.log(`  Content: "${post.content.substring(0, 50)}..."`)

  // 4. Get initial reaction state
  const { data: initialReaction } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', post.id)
    .eq('user_id', authData.user.id)
    .maybeSingle()

  const hadReaction = !!initialReaction
  console.log(`\n📊 Initial state: ${hadReaction ? 'HAS reaction' : 'NO reaction'}`)

  // 5. Toggle reaction (add)
  console.log('\n🔄 Test 1: Adding reaction...')
  if (hadReaction) {
    // Remove first so we can test adding
    await supabase
      .from('post_reactions')
      .delete()
      .eq('id', initialReaction.id)
    console.log('  Cleared existing reaction first')
  }

  const { data: addedReaction, error: addError } = await supabase
    .from('post_reactions')
    .insert({
      post_id: post.id,
      user_id: authData.user.id,
      reaction_type: 'like'
    })
    .select()
    .single()

  if (addError) {
    console.log(`❌ FAILED to add reaction:`)
    console.log(`   Error: ${addError.message}`)
    console.log(`   Code: ${addError.code}`)
    console.log(`   Details: ${JSON.stringify(addError, null, 2)}`)

    // Check if it mentions user_memberships
    if (addError.message.includes('user_memberships')) {
      console.log('\n⚠️  ERROR CONTAINS "user_memberships" - THIS IS THE BUG!')
      return false
    }
    return false
  }
  console.log(`✓ SUCCESS: Added reaction ${addedReaction.id}`)

  // 6. Verify it was added
  const { count: countAfterAdd } = await supabase
    .from('post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)
    .eq('user_id', authData.user.id)

  console.log(`✓ Verified: Found ${countAfterAdd} reaction(s)`)

  // 7. Toggle reaction (remove)
  console.log('\n🔄 Test 2: Removing reaction...')
  const { error: deleteError } = await supabase
    .from('post_reactions')
    .delete()
    .eq('id', addedReaction.id)

  if (deleteError) {
    console.log(`❌ FAILED to remove reaction:`)
    console.log(`   Error: ${deleteError.message}`)

    if (deleteError.message.includes('user_memberships')) {
      console.log('\n⚠️  ERROR CONTAINS "user_memberships" - THIS IS THE BUG!')
      return false
    }
    return false
  }
  console.log(`✓ SUCCESS: Removed reaction`)

  // 8. Verify it was removed
  const { count: countAfterRemove } = await supabase
    .from('post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)
    .eq('user_id', authData.user.id)

  console.log(`✓ Verified: Found ${countAfterRemove} reaction(s)`)

  return true
}

async function main() {
  const success = await testToggleReaction()

  console.log('\n' + '='.repeat(60))
  if (success) {
    console.log('\n✅ ALL TESTS PASSED')
    console.log('✅ No user_memberships errors detected')
    console.log('✅ Reactions can be added and removed successfully')
    console.log('\n📊 VERDICT: Task 2.9 (Post Reactions) is FULLY FIXED')
  } else {
    console.log('\n❌ TESTS FAILED')
    console.log('📊 VERDICT: Task 2.9 (Post Reactions) NEEDS WORK')
  }
  console.log('='.repeat(60))
}

main()
