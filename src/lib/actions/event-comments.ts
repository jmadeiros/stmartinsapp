'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/database.types"

type EventComment = Database['public']['Tables']['event_comments']['Row']
type EventCommentInsert = Database['public']['Tables']['event_comments']['Insert']

export type EventCommentWithAuthor = EventComment & {
  author: {
    user_id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    organization_id: string | null
  }
  replies?: EventCommentWithAuthor[]
}

/**
 * Get all comments for a specific event (including author info and nested replies)
 */
export async function getEventComments(eventId: string) {
  const supabase = await createClient()

  try {
    const { data: comments, error } = await supabase
      .from('event_comments')
      .select('*')
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[getEventComments] Error fetching comments:', error)
      return { data: null, error: error.message }
    }

    if (!comments || comments.length === 0) {
      return { data: [], error: null }
    }

    // Fetch author profiles for all comments
    const authorIds = Array.from(new Set(comments.map(c => c.author_id)))

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
      console.error('[getEventComments] Error fetching profiles:', profilesError)
    }

    const typedProfiles = (profiles || []) as ProfileResult[]
    const profileMap = new Map(typedProfiles.map(p => [p.user_id, p]))

    // Merge comments with author info
    const commentsWithAuthors: EventCommentWithAuthor[] = comments.map(comment => ({
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

    // Organize into threaded structure
    const commentMap = new Map<string, EventCommentWithAuthor>()
    const topLevelComments: EventCommentWithAuthor[] = []

    commentsWithAuthors.forEach(comment => {
      commentMap.set(comment.id, comment)
    })

    commentsWithAuthors.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parent_comment_id) {
        const parentComment = commentMap.get(comment.parent_comment_id)
        if (parentComment) {
          parentComment.replies = parentComment.replies || []
          parentComment.replies.push(commentWithReplies)
        }
      } else {
        topLevelComments.push(commentWithReplies)
      }
    })

    return { data: topLevelComments, error: null }
  } catch (error) {
    console.error('[getEventComments] Exception:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get the count of comments for a specific event
 */
export async function getEventCommentCount(eventId: string) {
  const supabase = await createClient()

  try {
    const { count, error } = await supabase
      .from('event_comments')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .is('deleted_at', null)

    if (error) {
      console.error('[getEventCommentCount] Error:', error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('[getEventCommentCount] Exception:', error)
    return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Add a new comment to an event
 */
export async function addEventComment(
  eventId: string,
  content: string,
  parentId?: string
) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated', data: null }
    }

    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Comment content cannot be empty', data: null }
    }

    if (content.length > 2000) {
      return { success: false, error: 'Comment is too long (max 2000 characters)', data: null }
    }

    // Verify parent exists if replying
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('event_comments')
        .select('id, event_id')
        .eq('id', parentId)
        .is('deleted_at', null)
        .single()

      if (parentError || !parentComment) {
        return { success: false, error: 'Parent comment not found', data: null }
      }

      if (parentComment.event_id !== eventId) {
        return { success: false, error: 'Parent comment does not belong to this event', data: null }
      }
    }

    // Insert the comment
    const commentData: EventCommentInsert = {
      event_id: eventId,
      author_id: user.id,
      content: content.trim(),
      parent_comment_id: parentId || null
    }

    const { data: comment, error } = await supabase
      .from('event_comments')
      .insert(commentData)
      .select()
      .single()

    if (error || !comment) {
      console.error('[addEventComment] Error:', error)
      return { success: false, error: error?.message || 'Failed to create comment', data: null }
    }

    // Fetch author profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, avatar_url, job_title, organization_id')
      .eq('user_id', user.id)
      .single()

    const commentWithAuthor: EventCommentWithAuthor = {
      ...comment,
      author: profile || {
        user_id: user.id,
        full_name: 'Unknown User',
        avatar_url: null,
        job_title: null,
        organization_id: null
      },
      replies: []
    }

    // Create notification for event organizer
    try {
      await createEventCommentNotification(supabase, eventId, user.id, profile?.full_name || 'Someone', content)
    } catch (notifError) {
      console.warn('[addEventComment] Failed to create notification:', notifError)
    }

    return { success: true, data: commentWithAuthor, error: null }
  } catch (error) {
    console.error('[addEventComment] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Delete (soft-delete) a comment
 */
export async function deleteEventComment(commentId: string) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: comment, error: fetchError } = await supabase
      .from('event_comments')
      .select('id, author_id')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !comment) {
      return { success: false, error: 'Comment not found' }
    }

    if (comment.author_id !== user.id) {
      return { success: false, error: 'You can only delete your own comments' }
    }

    const { error } = await supabase
      .from('event_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('[deleteEventComment] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update a comment
 */
export async function updateEventComment(commentId: string, newContent: string) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated', data: null }
    }

    if (!newContent || newContent.trim().length === 0) {
      return { success: false, error: 'Comment content cannot be empty', data: null }
    }

    if (newContent.length > 2000) {
      return { success: false, error: 'Comment is too long (max 2000 characters)', data: null }
    }

    const { data: comment, error: fetchError } = await supabase
      .from('event_comments')
      .select('id, author_id')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !comment) {
      return { success: false, error: 'Comment not found', data: null }
    }

    if (comment.author_id !== user.id) {
      return { success: false, error: 'You can only edit your own comments', data: null }
    }

    const { data: updatedComment, error } = await supabase
      .from('event_comments')
      .update({ content: newContent.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single()

    if (error || !updatedComment) {
      return { success: false, error: error?.message || 'Failed to update comment', data: null }
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, avatar_url, job_title, organization_id')
      .eq('user_id', user.id)
      .single()

    const commentWithAuthor: EventCommentWithAuthor = {
      ...updatedComment,
      author: profile || {
        user_id: user.id,
        full_name: 'Unknown User',
        avatar_url: null,
        job_title: null,
        organization_id: null
      },
      replies: []
    }

    return { success: true, data: commentWithAuthor, error: null }
  } catch (error) {
    console.error('[updateEventComment] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Create notification for event organizer
 */
async function createEventCommentNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  actorId: string,
  actorName: string,
  commentContent: string
) {
  // Get event organizer
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('organizer_id, title')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    console.error('[createEventCommentNotification] Error fetching event:', eventError)
    return
  }

  // Don't notify if user commented on their own event
  if (event.organizer_id === actorId) {
    return
  }

  const contentPreview = commentContent.length > 100
    ? commentContent.substring(0, 100) + '...'
    : commentContent

  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: event.organizer_id,
      actor_id: actorId,
      type: 'event_comment',
      title: `${actorName} commented on your event "${event.title}"`,
      reference_type: 'event',
      reference_id: eventId,
      link: `/events/${eventId}`,
      action_data: {
        actor_name: actorName,
        comment_preview: contentPreview,
        event_title: event.title
      },
      read: false
    })

  if (notifError) {
    console.error('[createEventCommentNotification] Error:', notifError)
  }
}
