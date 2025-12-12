'use server'

import { createClient } from "@/lib/supabase/server"

export type PostCategory = 'intros' | 'wins' | 'opportunities' | 'questions' | 'learnings' | 'general'

export type CreatePostParams = {
  content: string
  authorId: string
  orgId: string
  category?: PostCategory
  linkedEventId?: string
  linkedProjectId?: string
  mentionedUserIds?: string[]
}

/**
 * Extract @usernames from post content
 * Matches @username patterns where username can contain letters, numbers, underscores, and spaces
 * (when enclosed in brackets like @[John Smith])
 */
export async function extractMentions(content: string): Promise<string[]> {
  const mentions: string[] = []

  // Match @[Name With Spaces] pattern
  const bracketPattern = /@\[([^\]]+)\]/g
  let match
  while ((match = bracketPattern.exec(content)) !== null) {
    mentions.push(match[1].trim())
  }

  // Match @SimpleUsername pattern (alphanumeric and underscores only, no spaces)
  const simplePattern = /@(\w+)/g
  while ((match = simplePattern.exec(content)) !== null) {
    // Avoid duplicates if the same name appears in both formats
    const name = match[1].trim()
    if (!mentions.includes(name)) {
      mentions.push(name)
    }
  }

  return Array.from(new Set(mentions)) // Remove duplicates
}

/**
 * Resolve usernames/full names to user IDs by querying user_profiles
 */
export async function resolveUserMentions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  names: string[]
): Promise<{ userId: string; name: string }[]> {
  if (names.length === 0) return []

  // Query user_profiles for matching full_name (case-insensitive)
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')

  if (error) {
    console.error('[resolveUserMentions] Error fetching profiles:', error)
    return []
  }

  if (!profiles) return []

  // Match names case-insensitively
  const resolved: { userId: string; name: string }[] = []
  type ProfileRow = { user_id: string; full_name: string | null }
  const typedProfiles = profiles as ProfileRow[]

  for (const name of names) {
    const normalizedName = name.toLowerCase()
    const matchingProfile = typedProfiles.find(
      (p) => p.full_name?.toLowerCase() === normalizedName
    )
    if (matchingProfile) {
      resolved.push({
        userId: matchingProfile.user_id,
        name: matchingProfile.full_name || name
      })
    }
  }

  return resolved
}

/**
 * Insert mentions into the post_mentions table
 */
async function insertPostMentions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  userIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (userIds.length === 0) return { success: true }

  const mentionRecords = userIds.map(userId => ({
    post_id: postId,
    mentioned_user_id: userId
  }))

  const { error } = await (supabase
    .from('post_mentions' as any) as any)
    .insert(mentionRecords)

  if (error) {
    console.error('[insertPostMentions] Error inserting mentions:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Create notifications for users who were @mentioned in a post
 * Does not notify the post author if they mention themselves
 */
async function createMentionNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  authorId: string,
  mentionedUserIds: string[]
): Promise<void> {
  // Filter out the post author from notifications (don't notify yourself)
  const usersToNotify = mentionedUserIds.filter(userId => userId !== authorId)

  if (usersToNotify.length === 0) {
    console.log('[createMentionNotifications] No users to notify (author was only mention)')
    return
  }

  // Get the author's name for the notification title
  type ProfileResult = {
    full_name: string | null
  }

  const { data: authorProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', authorId)
    .single()

  if (profileError) {
    console.warn('[createMentionNotifications] Could not fetch author profile:', profileError)
  }

  const typedProfile = authorProfile as ProfileResult | null
  const authorName = typedProfile?.full_name || 'Someone'

  // Create notification records for all mentioned users
  const notificationRecords = usersToNotify.map(userId => ({
    user_id: userId,
    actor_id: authorId,
    type: 'mention',
    title: `${authorName} mentioned you in a post`,
    reference_type: 'post',
    reference_id: postId,
    link: `/posts/${postId}`,
    read: false
  }))

  // Insert all notifications in bulk
  const { error: notifError } = await (supabase
    .from('notifications') as any)
    .insert(notificationRecords)

  if (notifError) {
    console.error('[createMentionNotifications] Error creating notifications:', notifError)
  } else {
    console.log(`[createMentionNotifications] Created ${usersToNotify.length} mention notifications for post ${postId}`)
  }
}

/**
 * Create a new post in the database
 */
export async function createPost(params: CreatePostParams) {
  const supabase = await createClient()

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: params.authorId,
        org_id: params.orgId,
        content: params.content,
        category: params.category || 'general',
        linked_event_id: params.linkedEventId || null,
        linked_project_id: params.linkedProjectId || null,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('[createPost] Error creating post:', error)
      return { success: false, error: error.message, data: null }
    }

    const postData = post as { id: string } | null
    console.log(`[createPost] Created post: ${postData?.id}`)

    // Handle @mentions - parse from content and save to post_mentions table
    if (postData?.id) {
      // If mentionedUserIds were explicitly passed, use those
      // Otherwise, extract mentions from content
      let userIdsToMention = params.mentionedUserIds || []

      if (userIdsToMention.length === 0) {
        // Extract @mentions from content and resolve to user IDs
        const extractedNames = await extractMentions(params.content)
        if (extractedNames.length > 0) {
          const resolvedUsers = await resolveUserMentions(supabase, extractedNames)
          userIdsToMention = resolvedUsers.map(u => u.userId)
          console.log(`[createPost] Resolved ${resolvedUsers.length} user mentions from content`)
        }
      }

      if (userIdsToMention.length > 0) {
        const mentionResult = await insertPostMentions(supabase, postData.id, userIdsToMention)
        if (!mentionResult.success) {
          console.warn(`[createPost] Failed to save mentions: ${mentionResult.error}`)
          // Don't fail the whole operation if mentions fail to save
        } else {
          console.log(`[createPost] Saved ${userIdsToMention.length} mentions for post ${postData.id}`)

          // Create notifications for mentioned users
          try {
            await createMentionNotifications(supabase, postData.id, params.authorId, userIdsToMention)
          } catch (notifError) {
            console.warn('[createPost] Failed to create mention notifications:', notifError)
            // Don't fail the whole operation if notifications fail
          }
        }
      }
    }

    return { success: true, data: post, error: null }
  } catch (error) {
    console.error('[createPost] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Get all mentions for a specific post
 */
export async function getPostMentions(postId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('post_mentions' as any)
    .select(`
      mentioned_user_id,
      user_profiles!inner(user_id, full_name, avatar_url)
    `)
    .eq('post_id', postId)

  if (error) {
    console.error('[getPostMentions] Error:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Get all posts that mention a specific user
 */
export async function getPostsMentioningUser(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('post_mentions' as any)
    .select(`
      post_id,
      posts!inner(id, content, created_at, author_id)
    `)
    .eq('mentioned_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getPostsMentioningUser] Error:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
