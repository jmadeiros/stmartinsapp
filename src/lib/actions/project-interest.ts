'use server'

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/database.types"

type ProjectInterestRow = Database['public']['Tables']['project_interest']['Row']
type ProjectInterestInsert = Database['public']['Tables']['project_interest']['Insert']

/**
 * Toggle project interest for the current user
 * If the user has already expressed interest, remove it (no notification)
 * If the user hasn't expressed interest, add it and create notification for project author
 */
export async function toggleProjectInterest(projectId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[toggleProjectInterest] Not authenticated:', userError)
      return { success: false, error: 'Not authenticated', isInterested: false }
    }

    // Get user's org_id from organization_members
    type OrgMembership = {
      org_id: string
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    const typedMembership = membership as OrgMembership | null

    if (membershipError || !typedMembership) {
      console.error('[toggleProjectInterest] Error fetching org membership:', membershipError)
      return { success: false, error: 'Organization membership not found', isInterested: false }
    }

    // Check if interest already exists
    type InterestCheck = {
      project_id: string
      user_id: string
    }

    const { data: existingInterest, error: checkError } = await supabase
      .from('project_interest')
      .select('project_id, user_id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()

    const typedInterest = existingInterest as InterestCheck | null

    if (checkError) {
      console.error('[toggleProjectInterest] Error checking existing interest:', checkError)
      return { success: false, error: checkError.message, isInterested: false }
    }

    if (typedInterest) {
      // Remove the interest (no notification)
      const { error: deleteError } = await supabase
        .from('project_interest')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('[toggleProjectInterest] Error removing interest:', deleteError)
        return { success: false, error: deleteError.message, isInterested: false }
      }

      console.log(`[toggleProjectInterest] Removed interest from project ${projectId}`)
      return { success: true, isInterested: false, error: null }
    } else {
      // Add the interest
      const interestData: ProjectInterestInsert = {
        project_id: projectId,
        user_id: user.id,
        org_id: typedMembership.org_id
      }

      const { error: insertError } = await (supabase
        .from('project_interest') as any)
        .insert(interestData)

      if (insertError) {
        console.error('[toggleProjectInterest] Error adding interest:', insertError)
        return { success: false, error: insertError.message, isInterested: false }
      }

      console.log(`[toggleProjectInterest] Added interest to project ${projectId}`)

      // Create notification for project author
      try {
        await createProjectInterestNotification(supabase, projectId, user.id)
      } catch (notifError) {
        console.warn('[toggleProjectInterest] Failed to create notification:', notifError)
        // Don't fail the whole operation if notification fails
      }

      return { success: true, isInterested: true, error: null }
    }
  } catch (error) {
    console.error('[toggleProjectInterest] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isInterested: false
    }
  }
}

/**
 * Get project interest status for the current user
 */
export async function getProjectInterestStatus(projectId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { isInterested: false, interestData: null, error: null }
    }

    const { data, error } = await supabase
      .from('project_interest')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()

    const typedData = data as ProjectInterestRow | null

    if (error) {
      console.error('[getProjectInterestStatus] Error:', error)
      return { isInterested: false, interestData: null, error: error.message }
    }

    return { isInterested: !!typedData, interestData: typedData, error: null }
  } catch (error) {
    console.error('[getProjectInterestStatus] Exception:', error)
    return {
      isInterested: false,
      interestData: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update support options for a project interest
 */
export async function updateProjectInterestSupport(
  projectId: string,
  supportOptions: {
    volunteerOffered?: boolean
    participantsCount?: number
    canPartner?: boolean
    provideResources?: boolean
    contributeFunding?: boolean
  }
) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[updateProjectInterestSupport] Not authenticated:', userError)
      return { success: false, error: 'Not authenticated' }
    }

    // Update the interest record
    const { error: updateError } = await (supabase
      .from('project_interest') as any)
      .update({
        volunteer_offered: supportOptions.volunteerOffered ?? null,
        participants_count: supportOptions.participantsCount ?? null,
        can_partner: supportOptions.canPartner ?? null,
        provide_resources: supportOptions.provideResources ?? null,
        contribute_funding: supportOptions.contributeFunding ?? null
      })
      .eq('project_id', projectId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[updateProjectInterestSupport] Error updating support options:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`[updateProjectInterestSupport] Updated support options for project ${projectId}`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[updateProjectInterestSupport] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a notification for the project author when someone expresses interest
 */
async function createProjectInterestNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  actorId: string
) {
  // Get the project's author_id and title
  type ProjectOwner = {
    author_id: string
    title: string
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('author_id, title')
    .eq('id', projectId)
    .single()

  const typedProject = project as ProjectOwner | null

  if (projectError || !typedProject) {
    console.warn('[createProjectInterestNotification] Could not fetch project:', projectError)
    return
  }

  // Don't notify if user expresses interest in their own project
  if (typedProject.author_id === actorId) {
    return
  }

  // Get the user's name
  type ProfileResult = {
    full_name: string
  }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', actorId)
    .single()

  const typedProfile = userProfile as ProfileResult | null
  const userName = typedProfile?.full_name || 'Someone'

  // Truncate project title for preview
  const projectTitle = typedProject.title || 'your project'
  const projectTitlePreview = projectTitle.length > 60
    ? projectTitle.substring(0, 60) + '...'
    : projectTitle

  // Create the notification
  const { error: notifError } = await (supabase
    .from('notifications') as any)
    .insert({
      user_id: typedProject.author_id,
      actor_id: actorId,
      type: 'project_interest',
      title: `${userName} is interested in "${projectTitlePreview}"`,
      reference_type: 'project',
      reference_id: projectId,
      link: `/projects/${projectId}`,
      action_data: {
        actor_name: userName,
        project_title: projectTitle
      },
      read: false
    })

  if (notifError) {
    console.warn('[createProjectInterestNotification] Failed to create notification:', notifError)
  } else {
    console.log(`[createProjectInterestNotification] Created notification for project owner ${typedProject.author_id}`)
  }
}
