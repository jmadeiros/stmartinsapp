'use server'

import { createClient } from "@/lib/supabase/server"

/**
 * Toggle a reaction (like) on a project for the current user
 * If the user has already reacted, remove the reaction
 * If the user hasn't reacted, add the reaction
 */
export async function toggleProjectReaction(projectId: string, reactionType: string = 'like') {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[toggleProjectReaction] Not authenticated:', userError)
      return { success: false, error: 'Not authenticated', hasReacted: false }
    }

    // Check if user has already reacted to this project
    const { data: existingReaction, error: checkError } = await (supabase
      .from('project_reactions') as any)
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType)
      .maybeSingle()

    if (checkError) {
      console.error('[toggleProjectReaction] Error checking existing reaction:', checkError)
      return { success: false, error: checkError.message, hasReacted: false }
    }

    if (existingReaction) {
      // Remove the reaction
      const { error: deleteError } = await (supabase
        .from('project_reactions') as any)
        .delete()
        .eq('id', existingReaction.id)

      if (deleteError) {
        console.error('[toggleProjectReaction] Error removing reaction:', deleteError)
        return { success: false, error: deleteError.message, hasReacted: false }
      }

      console.log(`[toggleProjectReaction] Removed reaction from project ${projectId}`)
      return { success: true, hasReacted: false, error: null }
    } else {
      // Add the reaction
      const { error: insertError } = await (supabase
        .from('project_reactions') as any)
        .insert({
          project_id: projectId,
          user_id: user.id,
          reaction_type: reactionType
        })

      if (insertError) {
        console.error('[toggleProjectReaction] Error adding reaction:', insertError)
        return { success: false, error: insertError.message, hasReacted: false }
      }

      console.log(`[toggleProjectReaction] Added reaction to project ${projectId}`)

      // Create notification for project author
      try {
        await createProjectReactionNotification(supabase, projectId, user.id)
      } catch (notifError) {
        console.warn('[toggleProjectReaction] Failed to create notification:', notifError)
        // Don't fail the whole operation if notification fails
      }

      return { success: true, hasReacted: true, error: null }
    }
  } catch (error) {
    console.error('[toggleProjectReaction] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasReacted: false
    }
  }
}

/**
 * Get reaction data for a project (count and whether current user has reacted)
 */
export async function getProjectReactionData(projectId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get total count
    const { count, error: countError } = await (supabase
      .from('project_reactions') as any)
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (countError) {
      console.error('[getProjectReactionData] Error getting count:', countError)
      return { count: 0, hasReacted: false, error: countError.message }
    }

    // Check if current user has reacted
    let hasReacted = false
    if (user) {
      const { data, error: checkError } = await (supabase
        .from('project_reactions') as any)
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!checkError && data) {
        hasReacted = true
      }
    }

    return { count: count || 0, hasReacted, error: null }
  } catch (error) {
    console.error('[getProjectReactionData] Exception:', error)
    return {
      count: 0,
      hasReacted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a notification for the project author when someone reacts to their project
 */
async function createProjectReactionNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  actorId: string
) {
  // Get the project author
  const { data: project, error: projectError } = await (supabase
    .from('projects') as any)
    .select('author_id, title')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    console.error('[createProjectReactionNotification] Error fetching project:', projectError)
    return
  }

  // Don't notify if user reacted to their own project
  if (project.author_id === actorId) {
    return
  }

  // Get actor's name for the notification
  const { data: actorProfile } = await (supabase
    .from('user_profiles') as any)
    .select('full_name')
    .eq('user_id', actorId)
    .single()

  const actorName = actorProfile?.full_name || 'Someone'

  // Create the notification
  const { error: notifError } = await (supabase
    .from('notifications') as any)
    .insert({
      user_id: project.author_id,
      actor_id: actorId,
      type: 'project_reaction',
      title: `${actorName} liked your project "${project.title}"`,
      reference_type: 'project',
      reference_id: projectId,
      link: `/projects/${projectId}`,
      action_data: {
        actor_name: actorName,
        project_title: project.title
      },
      read: false
    })

  if (notifError) {
    console.error('[createProjectReactionNotification] Error creating notification:', notifError)
  } else {
    console.log(`[createProjectReactionNotification] Created notification for user ${project.author_id}`)
  }
}
