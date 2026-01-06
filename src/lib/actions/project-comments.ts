// @ts-nocheck
// TODO(Wave 2): Remove @ts-nocheck after fixing complex type inference issues
'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/database.types"

type ProjectComment = Database['public']['Tables']['project_comments']['Row']
type ProjectCommentInsert = Database['public']['Tables']['project_comments']['Insert']

export type ProjectCommentWithAuthor = ProjectComment & {
  author: {
    user_id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    organization_id: string | null
  }
  replies?: ProjectCommentWithAuthor[]
}

/**
 * Get all comments for a specific project (including author info and nested replies)
 */
export async function getProjectComments(projectId: string) {
  const supabase = await createClient()

  try {
    const { data: comments, error } = await supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[getProjectComments] Error fetching comments:', error)
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
      console.error('[getProjectComments] Error fetching profiles:', profilesError)
    }

    const typedProfiles = (profiles || []) as ProfileResult[]
    const profileMap = new Map(typedProfiles.map(p => [p.user_id, p]))

    // Merge comments with author info
    const commentsWithAuthors: ProjectCommentWithAuthor[] = comments.map(comment => ({
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
    const commentMap = new Map<string, ProjectCommentWithAuthor>()
    const topLevelComments: ProjectCommentWithAuthor[] = []

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
    console.error('[getProjectComments] Exception:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get the count of comments for a specific project
 */
export async function getProjectCommentCount(projectId: string) {
  const supabase = await createClient()

  try {
    const { count, error } = await supabase
      .from('project_comments')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .is('deleted_at', null)

    if (error) {
      console.error('[getProjectCommentCount] Error:', error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('[getProjectCommentCount] Exception:', error)
    return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Add a new comment to a project
 */
export async function addProjectComment(
  projectId: string,
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
        .from('project_comments')
        .select('id, project_id')
        .eq('id', parentId)
        .is('deleted_at', null)
        .single()

      if (parentError || !parentComment) {
        return { success: false, error: 'Parent comment not found', data: null }
      }

      if (parentComment.project_id !== projectId) {
        return { success: false, error: 'Parent comment does not belong to this project', data: null }
      }
    }

    // Insert the comment
    const commentData: ProjectCommentInsert = {
      project_id: projectId,
      author_id: user.id,
      content: content.trim(),
      parent_comment_id: parentId || null
    }

    const { data: comment, error } = await supabase
      .from('project_comments')
      .insert(commentData)
      .select()
      .single()

    if (error || !comment) {
      console.error('[addProjectComment] Error:', error)
      return { success: false, error: error?.message || 'Failed to create comment', data: null }
    }

    // Fetch author profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, avatar_url, job_title, organization_id')
      .eq('user_id', user.id)
      .single()

    const commentWithAuthor: ProjectCommentWithAuthor = {
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

    // Create notification for project lead
    try {
      await createProjectCommentNotification(supabase, projectId, user.id, profile?.full_name || 'Someone', content)
    } catch (notifError) {
      console.warn('[addProjectComment] Failed to create notification:', notifError)
    }

    return { success: true, data: commentWithAuthor, error: null }
  } catch (error) {
    console.error('[addProjectComment] Exception:', error)
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
export async function deleteProjectComment(commentId: string) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: comment, error: fetchError } = await supabase
      .from('project_comments')
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
      .from('project_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('[deleteProjectComment] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update a comment
 */
export async function updateProjectComment(commentId: string, newContent: string) {
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
      .from('project_comments')
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
      .from('project_comments')
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

    const commentWithAuthor: ProjectCommentWithAuthor = {
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
    console.error('[updateProjectComment] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Create notification for project lead
 */
async function createProjectCommentNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  actorId: string,
  actorName: string,
  commentContent: string
) {
  // Get project author
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('author_id, title')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    console.error('[createProjectCommentNotification] Error fetching project:', projectError)
    return
  }

  // Don't notify if user commented on their own project
  if (project.author_id === actorId) {
    return
  }

  const contentPreview = commentContent.length > 100
    ? commentContent.substring(0, 100) + '...'
    : commentContent

  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: project.author_id,
      actor_id: actorId,
      type: 'project_comment',
      title: `${actorName} commented on your project "${project.title}"`,
      reference_type: 'project',
      reference_id: projectId,
      link: `/projects/${projectId}`,
      action_data: {
        actor_name: actorName,
        comment_preview: contentPreview,
        project_title: project.title
      },
      read: false
    })

  if (notifError) {
    console.error('[createProjectCommentNotification] Error:', notifError)
  }
}
