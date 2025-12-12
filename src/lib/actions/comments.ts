'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/database.types"

type PostComment = Database['public']['Tables']['post_comments']['Row']
type PostCommentInsert = Database['public']['Tables']['post_comments']['Insert']

export type CommentWithAuthor = PostComment & {
  author: {
    user_id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    organization_id: string | null
  }
  replies?: CommentWithAuthor[]
}

/**
 * Get all comments for a specific post (including author info and nested replies)
 */
export async function getComments(postId: string) {
  const supabase = await createClient()

  try {
    // Fetch all comments for the post
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[getComments] Error fetching comments:', error)
      return { data: null, error: error.message }
    }

    if (!comments || comments.length === 0) {
      return { data: [], error: null }
    }

    // Type the comments array for TypeScript
    type CommentRow = {
      id: string
      post_id: string
      author_id: string
      content: string
      parent_comment_id: string | null
      created_at: string
      updated_at: string
      deleted_at: string | null
    }
    const typedComments = comments as CommentRow[]

    // Fetch author profiles for all comments
    const authorIds = Array.from(new Set(typedComments.map(c => c.author_id)))

    type ProfileResult = {
      user_id: string
      full_name: string
      avatar_url: string | null
      job_title: string | null
      organization_id: string | null
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, avatar_url, job_title, organization_id')
      .in('user_id', authorIds)

    if (profilesError) {
      console.error('[getComments] Error fetching profiles:', profilesError)
      // Continue without author info rather than failing
    }

    const typedProfiles = (profiles || []) as ProfileResult[]

    // Create a map of author profiles
    const profileMap = new Map(
      typedProfiles.map(p => [p.user_id, p])
    )

    // Merge comments with author info
    const commentsWithAuthors: CommentWithAuthor[] = typedComments.map(comment => ({
      ...comment,
      author: profileMap.get(comment.author_id) || {
        user_id: comment.author_id,
        full_name: 'Unknown User',
        avatar_url: null,
        job_title: null,
        organization_id: null
      },
      replies: []
    }))

    // Organize comments into a threaded structure (top-level + replies)
    const commentMap = new Map<string, CommentWithAuthor>()
    const topLevelComments: CommentWithAuthor[] = []

    // First pass: create map of all comments
    commentsWithAuthors.forEach(comment => {
      commentMap.set(comment.id, comment)
    })

    // Second pass: organize into tree structure
    commentsWithAuthors.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!

      if (comment.parent_comment_id) {
        // This is a reply - add it to parent's replies array
        const parentComment = commentMap.get(comment.parent_comment_id)
        if (parentComment) {
          parentComment.replies = parentComment.replies || []
          parentComment.replies.push(commentWithReplies)
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentWithReplies)
      }
    })

    return { data: topLevelComments, error: null }
  } catch (error) {
    console.error('[getComments] Exception:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get the count of comments for a specific post (excluding soft-deleted)
 */
export async function getCommentCount(postId: string) {
  const supabase = await createClient()

  try {
    const { count, error } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .is('deleted_at', null)

    if (error) {
      console.error('[getCommentCount] Error counting comments:', error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('[getCommentCount] Exception:', error)
    return {
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Add a new comment to a post
 */
export async function addComment(
  postId: string,
  content: string,
  parentId?: string
) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[addComment] Auth error:', authError)
      return { success: false, error: 'Not authenticated', data: null }
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Comment content cannot be empty', data: null }
    }

    if (content.length > 2000) {
      return { success: false, error: 'Comment is too long (max 2000 characters)', data: null }
    }

    // If replying to a comment, verify the parent exists
    if (parentId) {
      type ParentCommentResult = {
        id: string
        post_id: string
      }

      const { data: parentComment, error: parentError } = await supabase
        .from('post_comments')
        .select('id, post_id')
        .eq('id', parentId)
        .is('deleted_at', null)
        .single()

      const typedParentComment = parentComment as ParentCommentResult | null

      if (parentError || !typedParentComment) {
        console.error('[addComment] Parent comment not found:', parentError)
        return { success: false, error: 'Parent comment not found', data: null }
      }

      // Verify parent comment belongs to the same post
      if (typedParentComment.post_id !== postId) {
        return { success: false, error: 'Parent comment does not belong to this post', data: null }
      }
    }

    // Insert the comment
    const commentData: PostCommentInsert = {
      post_id: postId,
      author_id: user.id,
      content: content.trim(),
      parent_comment_id: parentId || null
    }

    const { data: comment, error } = await (supabase
      .from('post_comments') as any)
      .insert(commentData)
      .select()
      .single()

    const typedComment = comment as PostComment | null

    if (error || !typedComment) {
      console.error('[addComment] Error inserting comment:', error)
      return { success: false, error: error?.message || 'Failed to create comment', data: null }
    }

    // Fetch author profile
    type ProfileResult = {
      user_id: string
      full_name: string
      avatar_url: string | null
      job_title: string | null
      organization_id: string | null
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, avatar_url, job_title, organization_id')
      .eq('user_id', user.id)
      .single()

    const typedProfile = profile as ProfileResult | null

    const commentWithAuthor: CommentWithAuthor = {
      ...typedComment,
      author: typedProfile || {
        user_id: user.id,
        full_name: 'Unknown User',
        avatar_url: null,
        job_title: null,
        organization_id: null
      },
      replies: []
    }

    console.log(`[addComment] Created comment: ${typedComment.id}`)

    // Create notifications for post author and parent comment author (if replying)
    try {
      const actorName = typedProfile?.full_name || 'Someone'

      // Notify post author about the new comment
      await createCommentNotification(
        supabase,
        postId,
        user.id,
        actorName,
        'comment',
        parentId || null
      )

      // If this is a reply, also notify the parent comment author
      if (parentId) {
        await createReplyNotification(
          supabase,
          postId,
          parentId,
          user.id,
          actorName
        )
      }
    } catch (notifError) {
      console.warn('[addComment] Failed to create notification:', notifError)
      // Don't fail the whole operation if notification fails
    }

    return { success: true, data: commentWithAuthor, error: null }
  } catch (error) {
    console.error('[addComment] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Soft delete a comment (only author can delete)
 */
export async function deleteComment(commentId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[deleteComment] Auth error:', authError)
      return { success: false, error: 'Not authenticated' }
    }

    // Verify the comment exists and user is the author
    type CommentAuthCheck = {
      id: string
      author_id: string
    }

    const { data: comment, error: fetchError } = await supabase
      .from('post_comments')
      .select('id, author_id')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single()

    const typedComment = comment as CommentAuthCheck | null

    if (fetchError || !typedComment) {
      console.error('[deleteComment] Comment not found:', fetchError)
      return { success: false, error: 'Comment not found' }
    }

    if (typedComment.author_id !== user.id) {
      return { success: false, error: 'You can only delete your own comments' }
    }

    // Soft delete the comment
    const { error } = await (supabase
      .from('post_comments') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)

    if (error) {
      console.error('[deleteComment] Error deleting comment:', error)
      return { success: false, error: error.message }
    }

    console.log(`[deleteComment] Soft-deleted comment: ${commentId}`)

    return { success: true, error: null }
  } catch (error) {
    console.error('[deleteComment] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update/edit a comment (only author can edit)
 */
export async function updateComment(commentId: string, newContent: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[updateComment] Auth error:', authError)
      return { success: false, error: 'Not authenticated', data: null }
    }

    // Validate content
    if (!newContent || newContent.trim().length === 0) {
      return { success: false, error: 'Comment content cannot be empty', data: null }
    }

    if (newContent.length > 2000) {
      return { success: false, error: 'Comment is too long (max 2000 characters)', data: null }
    }

    // Verify the comment exists and user is the author
    type CommentAuthCheck = {
      id: string
      author_id: string
    }

    const { data: comment, error: fetchError } = await supabase
      .from('post_comments')
      .select('id, author_id')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single()

    const typedComment = comment as CommentAuthCheck | null

    if (fetchError || !typedComment) {
      console.error('[updateComment] Comment not found:', fetchError)
      return { success: false, error: 'Comment not found', data: null }
    }

    if (typedComment.author_id !== user.id) {
      return { success: false, error: 'You can only edit your own comments', data: null }
    }

    // Update the comment
    const { data: updatedComment, error } = await (supabase
      .from('post_comments') as any)
      .update({
        content: newContent.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single()

    const typedUpdatedComment = updatedComment as PostComment | null

    if (error || !typedUpdatedComment) {
      console.error('[updateComment] Error updating comment:', error)
      return { success: false, error: error?.message || 'Failed to update comment', data: null }
    }

    // Fetch author profile
    type ProfileResult = {
      user_id: string
      full_name: string
      avatar_url: string | null
      job_title: string | null
      organization_id: string | null
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, avatar_url, job_title, organization_id')
      .eq('user_id', user.id)
      .single()

    const typedProfile = profile as ProfileResult | null

    const commentWithAuthor: CommentWithAuthor = {
      ...typedUpdatedComment,
      author: typedProfile || {
        user_id: user.id,
        full_name: 'Unknown User',
        avatar_url: null,
        job_title: null,
        organization_id: null
      },
      replies: []
    }

    console.log(`[updateComment] Updated comment: ${commentId}`)

    return { success: true, data: commentWithAuthor, error: null }
  } catch (error) {
    console.error('[updateComment] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Create a notification for the post author when someone comments on their post
 */
async function createCommentNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  actorId: string,
  actorName: string,
  notificationType: 'comment' | 'reply',
  parentCommentId: string | null
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
    console.error('[createCommentNotification] Error fetching post:', postError)
    return
  }

  // Don't notify if user commented on their own post
  if (typedPost.author_id === actorId) {
    console.log('[createCommentNotification] Skipping - user commented on own post')
    return
  }

  // Create the notification for the post author
  const { error: notifError } = await (supabase
    .from('notifications') as any)
    .insert({
      user_id: typedPost.author_id,
      actor_id: actorId,
      type: 'comment',
      title: `${actorName} commented on your post`,
      reference_type: 'post',
      reference_id: postId,
      link: `/posts/${postId}`,
      read: false
    })

  if (notifError) {
    console.error('[createCommentNotification] Error creating notification:', notifError)
  } else {
    console.log(`[createCommentNotification] Created notification for user ${typedPost.author_id}`)
  }
}

/**
 * Create a notification for the parent comment author when someone replies to their comment
 */
async function createReplyNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  parentCommentId: string,
  actorId: string,
  actorName: string
) {
  // Get the parent comment author
  type ParentCommentAuthor = {
    author_id: string
  }

  const { data: parentComment, error: parentError } = await supabase
    .from('post_comments')
    .select('author_id')
    .eq('id', parentCommentId)
    .single()

  const typedParentComment = parentComment as ParentCommentAuthor | null

  if (parentError || !typedParentComment) {
    console.error('[createReplyNotification] Error fetching parent comment:', parentError)
    return
  }

  // Don't notify if user replied to their own comment
  if (typedParentComment.author_id === actorId) {
    console.log('[createReplyNotification] Skipping - user replied to own comment')
    return
  }

  // Create the notification for the parent comment author
  const { error: notifError } = await (supabase
    .from('notifications') as any)
    .insert({
      user_id: typedParentComment.author_id,
      actor_id: actorId,
      type: 'reply',
      title: `${actorName} replied to your comment`,
      reference_type: 'post',
      reference_id: postId,
      link: `/posts/${postId}`,
      read: false
    })

  if (notifError) {
    console.error('[createReplyNotification] Error creating notification:', notifError)
  } else {
    console.log(`[createReplyNotification] Created notification for user ${typedParentComment.author_id}`)
  }
}
