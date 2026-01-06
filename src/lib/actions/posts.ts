// @ts-nocheck
// TODO(Wave 2): Remove @ts-nocheck after fixing complex type inference issues
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

export type CreatePostResult = {
  success: boolean
  data: { id: string } | null
  error: string | null
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
  mentionedUserIds: string[],
  postContent: string
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

  // Truncate post content for preview (showing where the mention appears)
  // Target: ~100 chars to show context around the mention
  const postPreview = postContent.length > 100
    ? postContent.substring(0, 100) + '...'
    : postContent

  // Create notification records for all mentioned users
  const notificationRecords = usersToNotify.map(userId => ({
    user_id: userId,
    actor_id: authorId,
    type: 'mention',
    title: `${authorName} mentioned you`,
    reference_type: 'post',
    reference_id: postId,
    link: `/posts/${postId}`,
    action_data: {
      actor_name: authorName,
      post_preview: postPreview
    },
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
export async function createPost(params: CreatePostParams): Promise<CreatePostResult> {
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
            await createMentionNotifications(supabase, postData.id, params.authorId, userIdsToMention, params.content)
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
 * Get all posts created by a specific user
 */
export async function getUserPosts(userId: string) {
  const supabase = await createClient()

  try {
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getUserPosts] Error fetching posts:', error)
      return { data: [], error: error.message }
    }

    if (!postsData || postsData.length === 0) {
      return { data: [], error: null }
    }

    // Process posts to include author info (which we already know, but for consistency) and org info
    // Fetch author profile once
    const { data: authorProfile } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, avatar_url, role')
      .eq('user_id', userId)
      .single()
    
    // Fetch unique orgs
    const orgIds = [...new Set(postsData.map(p => p.org_id).filter(Boolean))]
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds)
    
    const orgMap = new Map(orgs?.map(o => [o.id, o.name]) || [])

    // Get reaction and comment counts for all posts
    // We can do this efficiently or just loop for now. 
    // For better performance, we'd do a group by query, but Supabase JS client doesn't support it easily without view/rpc.
    // Let's do a simple loop for now as profile posts volume isn't huge usually.
    
    const posts = await Promise.all(postsData.map(async (p) => {
      // Get counts
      const { count: reactionCount } = await supabase
        .from('post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', p.id)

      const { count: commentCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', p.id)
        .is('deleted_at', null)

       // Format time ago
       const date = new Date(p.created_at)
       const now = new Date()
       const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
       let timeAgo = ''
 
       if (seconds < 60) timeAgo = 'just now'
       else if (seconds < 3600) timeAgo = `${Math.floor(seconds / 60)}m ago`
       else if (seconds < 86400) timeAgo = `${Math.floor(seconds / 3600)}h ago`
       else if (seconds < 604800) timeAgo = `${Math.floor(seconds / 86400)}d ago`
       else timeAgo = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      return {
        id: p.id,
        type: 'post' as const,
        author: {
          name: authorProfile?.full_name || 'Unknown',
          handle: `@${authorProfile?.full_name?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
          avatar: authorProfile?.avatar_url || '/placeholder.svg',
          role: authorProfile?.role || undefined,
          organization: p.org_id ? orgMap.get(p.org_id) : undefined,
        },
        title: p.title || undefined,
        content: p.content,
        category: p.category as PostCategory,
        linkedEventId: p.linked_event_id || undefined,
        linkedProjectId: p.linked_project_id || undefined,
        cause: p.cause || undefined,
        image: p.image_url || undefined,
        timeAgo: timeAgo,
        likes: reactionCount || 0,
        comments: commentCount || 0,
        isPinned: p.is_pinned || false,
      }
    }))

    return { data: posts, error: null }
  } catch (error) {
    console.error('[getUserPosts] Exception:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
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

/**
 * Get a single post by ID with author information
 */
export async function getPostById(postId: string) {
  const supabase = await createClient()

  try {
    console.log('[getPostById] Fetching post:', postId)

    // First, get the basic post data
    const { data: postData, error: postError } = await (supabase
      .from('posts') as any)
      .select('*')
      .eq('id', postId)
      .is('deleted_at', null)
      .single()

    if (postError) {
      console.error('[getPostById] Error fetching post:', postError)
      return null
    }

    if (!postData) {
      console.log('[getPostById] Post not found')
      return null
    }

    console.log('[getPostById] Found post:', postData.id)

    // Get author profile
    let authorProfile: { user_id: string; full_name: string | null; avatar_url: string | null; role: string | null } | null = null
    if (postData.author_id) {
      const { data: profileData } = await (supabase
        .from('user_profiles') as any)
        .select('user_id, full_name, avatar_url, role')
        .eq('user_id', postData.author_id)
        .single()
      authorProfile = profileData
    }

    // Get organization
    let organization: { id: string; name: string } | null = null
    if (postData.org_id) {
      const { data: orgData } = await (supabase
        .from('organizations') as any)
        .select('id, name')
        .eq('id', postData.org_id)
        .single()
      organization = orgData
    }

    // Define the combined type
    type PostWithAuthor = {
      id: string
      content: string
      title: string | null
      category: string
      cause: string | null
      image_url: string | null
      created_at: string
      updated_at: string
      author_id: string
      org_id: string
      linked_event_id: string | null
      linked_project_id: string | null
      is_pinned: boolean
      view_count: number
      user_profiles: typeof authorProfile
      organizations: typeof organization
    }

    const typedData: PostWithAuthor = {
      ...postData,
      user_profiles: authorProfile,
      organizations: organization
    }

    // Get reaction count
    const { count: reactionCount } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    // Get comment count
    const { count: commentCount } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .is('deleted_at', null)

    // Format time ago
    const formatTimeAgo = (dateString: string): string => {
      const date = new Date(dateString)
      const now = new Date()
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

      if (seconds < 60) return 'just now'
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Transform to Post type
    const post = {
      id: typedData.id,
      type: 'post' as const,
      author: {
        name: typedData.user_profiles?.full_name || 'Unknown',
        handle: `@${typedData.user_profiles?.full_name?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
        avatar: typedData.user_profiles?.avatar_url || '/placeholder.svg',
        role: typedData.user_profiles?.role || undefined,
        organization: typedData.organizations?.name || undefined,
      },
      title: typedData.title || undefined,
      content: typedData.content,
      category: typedData.category as any,
      linkedEventId: typedData.linked_event_id || undefined,
      linkedProjectId: typedData.linked_project_id || undefined,
      cause: typedData.cause || undefined,
      image: typedData.image_url || undefined,
      timeAgo: formatTimeAgo(typedData.created_at),
      likes: reactionCount || 0,
      comments: commentCount || 0,
      isPinned: typedData.is_pinned || false,
    }

    return post
  } catch (error) {
    console.error('[getPostById] Exception:', error)
    return null
  }
}

/**
 * Pin a post (admin only)
 * Sets is_pinned=true, pinned_at=now(), pinned_by=userId
 */
export async function pinPost(postId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[pinPost] Not authenticated:', authError)
      return { success: false, error: 'Not authenticated', data: null }
    }

    // Check if user is admin
    const { data: profile } = await (supabase
      .from('user_profiles') as any)
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      console.error('[pinPost] User is not admin')
      return { success: false, error: 'Only admins can pin posts', data: null }
    }

    // Check current pinned count
    const { count: pinnedCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_pinned', true)
      .is('deleted_at', null)

    if (pinnedCount !== null && pinnedCount >= 3) {
      console.error('[pinPost] Maximum pinned posts reached')
      return { success: false, error: 'Maximum of 3 pinned posts allowed. Please unpin another post first.', data: null }
    }

    // Pin the post
    const { data, error } = await (supabase
      .from('posts') as any)
      .update({
        is_pinned: true,
        pinned_at: new Date().toISOString(),
        pinned_by: user.id
      })
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      console.error('[pinPost] Error pinning post:', error)
      return { success: false, error: error.message, data: null }
    }

    console.log(`[pinPost] Successfully pinned post ${postId}`)
    return { success: true, data, error: null }
  } catch (error) {
    console.error('[pinPost] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Unpin a post (admin only)
 * Sets is_pinned=false, pinned_at=null, pinned_by=null
 */
export async function unpinPost(postId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[unpinPost] Not authenticated:', authError)
      return { success: false, error: 'Not authenticated', data: null }
    }

    // Check if user is admin
    const { data: profile } = await (supabase
      .from('user_profiles') as any)
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      console.error('[unpinPost] User is not admin')
      return { success: false, error: 'Only admins can unpin posts', data: null }
    }

    // Unpin the post
    const { data, error } = await (supabase
      .from('posts') as any)
      .update({
        is_pinned: false,
        pinned_at: null,
        pinned_by: null
      })
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      console.error('[unpinPost] Error unpinning post:', error)
      return { success: false, error: error.message, data: null }
    }

    console.log(`[unpinPost] Successfully unpinned post ${postId}`)
    return { success: true, data, error: null }
  } catch (error) {
    console.error('[unpinPost] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Acknowledge a post (typically for priority alerts)
 * Inserts an acknowledgment record for the current user
 */
export async function acknowledgePost(postId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[acknowledgePost] Not authenticated:', authError)
      return { success: false, error: 'Not authenticated', data: null }
    }

    // Insert acknowledgment record
    const { data, error } = await (supabase
      .from('post_acknowledgments') as any)
      .insert({
        post_id: postId,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      // If error is duplicate key (user already acknowledged), treat as success
      if (error.code === '23505') {
        console.log(`[acknowledgePost] User ${user.id} already acknowledged post ${postId}`)
        return { success: true, data: null, error: null }
      }
      console.error('[acknowledgePost] Error creating acknowledgment:', error)
      return { success: false, error: error.message, data: null }
    }

    console.log(`[acknowledgePost] User ${user.id} acknowledged post ${postId}`)
    return { success: true, data, error: null }
  } catch (error) {
    console.error('[acknowledgePost] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Get acknowledgment statistics for a post
 * Returns count of acknowledgments and list of users who acknowledged
 */
export async function getPostAcknowledgments(postId: string) {
  const supabase = await createClient()

  try {
    // Get acknowledgments with user profile data
    const { data: acknowledgments, error } = await (supabase
      .from('post_acknowledgments') as any)
      .select(`
        user_id,
        acknowledged_at,
        user_profiles!inner(user_id, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('acknowledged_at', { ascending: false })

    if (error) {
      console.error('[getPostAcknowledgments] Error fetching acknowledgments:', error)
      return { success: false, error: error.message, data: null }
    }

    type AcknowledgmentData = {
      user_id: string
      acknowledged_at: string
      user_profiles: {
        user_id: string
        full_name: string
        avatar_url: string | null
      }
    }

    const typedAcknowledgments = (acknowledgments || []) as AcknowledgmentData[]

    const users = typedAcknowledgments.map(ack => ({
      userId: ack.user_id,
      fullName: ack.user_profiles.full_name,
      avatarUrl: ack.user_profiles.avatar_url,
      acknowledgedAt: ack.acknowledged_at
    }))

    return {
      success: true,
      data: {
        count: users.length,
        users
      },
      error: null
    }
  } catch (error) {
    console.error('[getPostAcknowledgments] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Check if a specific user has acknowledged a post
 * If userId is not provided, checks for the current user
 */
export async function hasUserAcknowledged(postId: string, userId?: string) {
  const supabase = await createClient()

  try {
    let targetUserId = userId

    // If no userId provided, get current user
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('[hasUserAcknowledged] Not authenticated:', authError)
        return { success: false, error: 'Not authenticated', data: false }
      }
      targetUserId = user.id
    }

    // Check if acknowledgment exists
    const { data, error } = await (supabase
      .from('post_acknowledgments') as any)
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (error) {
      console.error('[hasUserAcknowledged] Error checking acknowledgment:', error)
      return { success: false, error: error.message, data: false }
    }

    return { success: true, data: !!data, error: null }
  } catch (error) {
    console.error('[hasUserAcknowledged] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: false
    }
  }
}
