'use server'

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/database.types"

type ReactionType = Database['public']['Enums']['reaction_type']

/**
 * Toggle a reaction (like) on a post for the current user
 * If the user has already reacted, remove the reaction
 * If the user hasn't reacted, add the reaction
 */
export async function toggleReaction(postId: string, reactionType: ReactionType = 'like') {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[toggleReaction] Not authenticated:', userError)
      return { success: false, error: 'Not authenticated', hasReacted: false }
    }

    // Check if user has already reacted to this post
    type ReactionCheck = {
      id: string
    }

    const { data: existingReaction, error: checkError } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType)
      .maybeSingle()

    const typedReaction = existingReaction as ReactionCheck | null

    if (checkError) {
      console.error('[toggleReaction] Error checking existing reaction:', checkError)
      return { success: false, error: checkError.message, hasReacted: false }
    }

    if (typedReaction) {
      // Remove the reaction
      const { error: deleteError } = await (supabase
        .from('post_reactions') as any)
        .delete()
        .eq('id', typedReaction.id)

      if (deleteError) {
        console.error('[toggleReaction] Error removing reaction:', deleteError)
        return { success: false, error: deleteError.message, hasReacted: false }
      }

      console.log(`[toggleReaction] Removed reaction from post ${postId}`)
      return { success: true, hasReacted: false, error: null }
    } else {
      // Add the reaction
      const { error: insertError } = await (supabase
        .from('post_reactions') as any)
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType
        })

      if (insertError) {
        console.error('[toggleReaction] Error adding reaction:', insertError)
        return { success: false, error: insertError.message, hasReacted: false }
      }

      console.log(`[toggleReaction] Added reaction to post ${postId}`)

      // Create notification for post author
      try {
        await createReactionNotification(supabase, postId, user.id)
      } catch (notifError) {
        console.warn('[toggleReaction] Failed to create notification:', notifError)
        // Don't fail the whole operation if notification fails
      }

      return { success: true, hasReacted: true, error: null }
    }
  } catch (error) {
    console.error('[toggleReaction] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasReacted: false
    }
  }
}

/**
 * Get the count of reactions for a post
 */
export async function getReactionCount(postId: string) {
  const supabase = await createClient()

  try {
    const { count, error } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (error) {
      console.error('[getReactionCount] Error:', error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('[getReactionCount] Exception:', error)
    return {
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if the current user has reacted to a post
 */
export async function hasUserReacted(postId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { hasReacted: false, error: null }
    }

    const { data, error } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[hasUserReacted] Error:', error)
      return { hasReacted: false, error: error.message }
    }

    return { hasReacted: !!data, error: null }
  } catch (error) {
    console.error('[hasUserReacted] Exception:', error)
    return {
      hasReacted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get reaction data for a post (count and whether current user has reacted)
 */
export async function getReactionData(postId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get total count
    const { count, error: countError } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (countError) {
      console.error('[getReactionData] Error getting count:', countError)
      return { count: 0, hasReacted: false, error: countError.message }
    }

    // Check if current user has reacted
    let hasReacted = false
    if (user) {
      const { data, error: checkError } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!checkError && data) {
        hasReacted = true
      }
    }

    return { count: count || 0, hasReacted, error: null }
  } catch (error) {
    console.error('[getReactionData] Exception:', error)
    return {
      count: 0,
      hasReacted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a notification for the post author when someone reacts to their post
 */
async function createReactionNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  actorId: string
) {
  // Get the post author
  type PostAuthor = {
    author_id: string
  }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  const typedPost = post as PostAuthor | null

  if (postError || !typedPost) {
    console.error('[createReactionNotification] Error fetching post:', postError)
    return
  }

  // Don't notify if user reacted to their own post
  if (typedPost.author_id === actorId) {
    return
  }

  // Get actor's name for the notification
  type ProfileResult = {
    full_name: string
  }

  const { data: actorProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', actorId)
    .single()

  const typedProfile = actorProfile as ProfileResult | null
  const actorName = typedProfile?.full_name || 'Someone'

  // Create the notification
  const { error: notifError } = await (supabase
    .from('notifications') as any)
    .insert({
      user_id: typedPost.author_id,
      actor_id: actorId,
      type: 'reaction',
      title: `${actorName} liked your post`,
      reference_type: 'post',
      reference_id: postId,
      link: `/posts/${postId}`,
      read: false
    })

  if (notifError) {
    console.error('[createReactionNotification] Error creating notification:', notifError)
  } else {
    console.log(`[createReactionNotification] Created notification for user ${typedPost.author_id}`)
  }
}
