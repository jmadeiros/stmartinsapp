import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testReactions() {
  console.log('=== Testing Post Reactions ===\n')

  // 1. Get a test user (Sarah)
  const { data: sarah } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .eq('full_name', 'Sarah Mitchell')
    .single()

  if (!sarah) {
    console.log('❌ Could not find Sarah Mitchell')
    return
  }
  console.log(`✓ Found user: ${sarah.full_name} (${sarah.user_id})`)

  // 2. Get a post to react to (not authored by Sarah for notification test)
  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, author_id')
    .neq('author_id', sarah.user_id)
    .limit(1)

  if (!posts || posts.length === 0) {
    // Fallback to any post
    const { data: anyPosts } = await supabase
      .from('posts')
      .select('id, content, author_id')
      .limit(1)

    if (!anyPosts || anyPosts.length === 0) {
      console.log('❌ No posts found to react to')
      return
    }
    posts.push(anyPosts[0])
  }

  const post = posts[0]
  console.log(`✓ Found post: ${post.id}`)
  console.log(`  Content: "${post.content.substring(0, 50)}..."`)

  // 3. Check current reaction count
  const { count: beforeCount } = await supabase
    .from('post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  console.log(`\n📊 Current reactions on post: ${beforeCount || 0}`)

  // 4. Check if Sarah already reacted
  const { data: existingReaction } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', post.id)
    .eq('user_id', sarah.user_id)
    .maybeSingle()

  if (existingReaction) {
    console.log(`ℹ️  Sarah already reacted to this post`)

    // Test removing reaction
    const { error: deleteError } = await supabase
      .from('post_reactions')
      .delete()
      .eq('id', existingReaction.id)

    if (deleteError) {
      console.log(`❌ Failed to remove reaction: ${deleteError.message}`)
    } else {
      console.log(`✓ Successfully removed Sarah's reaction`)
    }
  }

  // 5. Add a new reaction
  console.log(`\n🔄 Adding new reaction...`)
  const { data: newReaction, error: insertError } = await supabase
    .from('post_reactions')
    .insert({
      post_id: post.id,
      user_id: sarah.user_id,
      reaction_type: 'like'
    })
    .select()
    .single()

  if (insertError) {
    console.log(`❌ Failed to add reaction: ${insertError.message}`)
    console.log(`   Code: ${insertError.code}`)
    console.log(`   Details: ${insertError.details}`)
    return
  }
  console.log(`✓ Successfully added reaction: ${newReaction.id}`)

  // 6. Verify the reaction exists
  const { count: afterCount } = await supabase
    .from('post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  console.log(`📊 Reactions after adding: ${afterCount || 0}`)

  // 7. Test notification was created (only if reacting to someone else's post)
  if (post.author_id !== sarah.user_id) {
    const { data: notification } = await supabase
      .from('notifications')
      .select('id, type, title')
      .eq('reference_id', post.id)
      .eq('type', 'reaction')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (notification) {
      console.log(`\n✓ Notification created: "${notification.title}"`)
    } else {
      console.log(`\n⚠️  No notification found (trigger may not be set up)`)
    }
  } else {
    console.log(`\nℹ️  Self-reaction - no notification expected`)
  }

  console.log('\n=== Reactions Test Complete ===')
}

testReactions()
