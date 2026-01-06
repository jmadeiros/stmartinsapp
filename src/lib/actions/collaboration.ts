'use server'

import { createClient } from "@/lib/supabase/server"
import type { CollaborationInvitation } from "@/lib/collaboration.types"

export type InviteCollaboratorsParams = {
  resourceType: 'event' | 'project'
  resourceId: string
  inviterOrgId: string
  inviterUserId: string
  inviteeOrgIds: string[]
  message?: string
}

export type RespondToInvitationParams = {
  invitationId: string
  status: 'accepted' | 'declined'
  respondedBy: string
}

export type ExpressInterestParams = {
  resourceType: 'event' | 'project'
  resourceId: string
  userOrgId: string
  userId: string
  message?: string
}

/**
 * Helper function to get an admin user for an organization
 */
async function getOrgAdminUserId(supabase: any, orgId: string): Promise<string | null> {
  try {
    const { data, error } = await (supabase
      .from('user_profiles') as any)
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (error || !data) {
      // Fallback: get any user from the org if no admin found
      const { data: fallbackData } = await (supabase
        .from('user_profiles') as any)
        .select('user_id')
        .eq('organization_id', orgId)
        .limit(1)
        .single()

      return fallbackData?.user_id || null
    }

    return data.user_id
  } catch {
    return null
  }
}

/**
 * Send collaboration invitations to multiple organizations
 * Creates invitation records and notifications for invited organization admins
 */
export async function inviteCollaborators(params: InviteCollaboratorsParams) {
  const supabase = await createClient()

  try {
    // Get the inviter organization name and resource title for notification message
    const { data: inviterOrg } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', params.inviterOrgId)
      .single()

    const inviterOrgName = (inviterOrg as { name: string } | null)?.name || 'An organization'

    // Get the resource title
    const table = params.resourceType === 'event' ? 'events' : 'projects'
    const { data: resource } = await supabase
      .from(table)
      .select('title')
      .eq('id', params.resourceId)
      .single()

    const resourceTitle = (resource as { title: string } | null)?.title || `this ${params.resourceType}`

    // Create invitation records for each invitee org
    const invitations = params.inviteeOrgIds.map((inviteeOrgId) => ({
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      inviter_org_id: params.inviterOrgId,
      inviter_user_id: params.inviterUserId,
      invitee_org_id: inviteeOrgId,
      status: 'pending' as const,
      message: params.message || null,
    }))

    const { data, error } = await (supabase
      .from('collaboration_invitations' as any) as any)
      .insert(invitations)
      .select()

    if (error) {
      console.error('[inviteCollaborators] Error:', error)
      return { success: false, error: error.message }
    }

    // Create notifications for each invited organization's admin
    for (const inviteeOrgId of params.inviteeOrgIds) {
      try {
        const adminUserId = await getOrgAdminUserId(supabase, inviteeOrgId)

        if (adminUserId) {
          const { error: notifError } = await (supabase
            .from('notifications') as any)
            .insert({
              user_id: adminUserId,
              actor_id: params.inviterUserId,
              type: 'collaboration_invitation',
              title: `${inviterOrgName} invited your organization to collaborate on ${resourceTitle}`,
              reference_type: params.resourceType,
              reference_id: params.resourceId,
              link: `/${params.resourceType}s/${params.resourceId}`,
              read: false
            })

          if (notifError) {
            console.error('[inviteCollaborators] Failed to create notification for org:', inviteeOrgId, notifError)
          }
        }
      } catch (notifErr) {
        // Don't fail the main operation if notification fails
        console.error('[inviteCollaborators] Notification error for org:', inviteeOrgId, notifErr)
      }
    }

    console.log(`[inviteCollaborators] Created ${(data as any[])?.length || 0} invitations`)
    return { success: true, data }
  } catch (error) {
    console.error('[inviteCollaborators] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Respond to a collaboration invitation (accept or decline)
 * If accepted, adds the organization to the event/project collaborators array
 * Notifies the inviter of the response
 */
export async function respondToInvitation(params: RespondToInvitationParams) {
  const supabase = await createClient()

  try {
    // First, get the invitation details
    const { data: invitation, error: invitationError } = await (supabase
      .from('collaboration_invitations' as any) as any)
      .select('*')
      .eq('id', params.invitationId)
      .single()

    if (invitationError || !invitation) {
      return { success: false, error: 'Invitation not found' }
    }

    // Update the invitation status
    const { error: updateError } = await (supabase
      .from('collaboration_invitations' as any) as any)
      .update({
        status: params.status,
        responded_by: params.respondedBy,
        responded_at: new Date().toISOString(),
      })
      .eq('id', params.invitationId)

    if (updateError) {
      console.error('[respondToInvitation] Error updating invitation:', updateError)
      return { success: false, error: updateError.message }
    }

    // Cast invitation to expected shape
    const inv = invitation as {
      resource_type: string
      resource_id: string
      invitee_org_id: string
      inviter_org_id: string
      inviter_user_id: string
    }

    // If accepted, add the organization to the resource's collaborators
    if (params.status === 'accepted') {
      const table = inv.resource_type === 'event' ? 'events' : 'projects'
      const arrayColumn = inv.resource_type === 'event' ? 'collaborating_orgs' : 'collaborators'

      // Get current collaborators
      const { data: resource, error: resourceError } = await supabase
        .from(table)
        .select(arrayColumn)
        .eq('id', inv.resource_id)
        .single()

      if (resourceError || !resource) {
        console.error('[respondToInvitation] Error fetching resource:', resourceError)
        return { success: false, error: 'Resource not found' }
      }

      // Add the new collaborator if not already in the array
      const currentCollaborators = (resource as any)[arrayColumn] || []
      if (!currentCollaborators.includes(inv.invitee_org_id)) {
        const newCollaborators = [...currentCollaborators, inv.invitee_org_id]

        const { error: updateResourceError } = await (supabase
          .from(table) as any)
          .update({ [arrayColumn]: newCollaborators })
          .eq('id', inv.resource_id)

        if (updateResourceError) {
          console.error('[respondToInvitation] Error updating resource:', updateResourceError)
          return { success: false, error: updateResourceError.message }
        }
      }
    }

    // Notify the inviter about the response
    try {
      // Get the responding organization's name
      const { data: respondingOrg } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', inv.invitee_org_id)
        .single()

      const respondingOrgName = (respondingOrg as { name: string } | null)?.name || 'An organization'

      // Determine notification type and title based on response status
      const notificationType = params.status === 'accepted' ? 'invitation_accepted' : 'invitation_declined'
      const notificationTitle = params.status === 'accepted'
        ? `${respondingOrgName} accepted your collaboration invitation`
        : `${respondingOrgName} declined your collaboration invitation`

      // Notify the original inviter user
      const { error: notifError } = await (supabase
        .from('notifications') as any)
        .insert({
          user_id: inv.inviter_user_id,
          actor_id: params.respondedBy,
          type: notificationType,
          title: notificationTitle,
          reference_type: inv.resource_type,
          reference_id: inv.resource_id,
          link: `/${inv.resource_type}s/${inv.resource_id}`,
          read: false
        })

      if (notifError) {
        console.error('[respondToInvitation] Failed to create notification:', notifError)
      }
    } catch (notifErr) {
      // Don't fail the main operation if notification fails
      console.error('[respondToInvitation] Notification error:', notifErr)
    }

    console.log(`[respondToInvitation] ${params.status} invitation ${params.invitationId}`)
    return { success: true }
  } catch (error) {
    console.error('[respondToInvitation] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Express interest in collaborating on an event/project
 * This creates a collaboration_request notification for the organizer
 */
export async function expressInterest(params: ExpressInterestParams) {
  const supabase = await createClient()

  try {
    // Get the resource to find the organizer
    const table = params.resourceType === 'event' ? 'events' : 'projects'
    const organizerField = params.resourceType === 'event' ? 'organizer_id' : 'author_id'

    const { data: resource, error: resourceError } = await supabase
      .from(table)
      .select(`id, title, org_id, ${organizerField}`)
      .eq('id', params.resourceId)
      .single()

    if (resourceError || !resource) {
      return { success: false, error: 'Resource not found' }
    }

    const res = resource as any
    const organizerId = res[organizerField]

    // Get the user's organization name
    const { data: userOrg, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', params.userOrgId)
      .single()

    if (orgError || !userOrg) {
      return { success: false, error: 'Organization not found' }
    }

    const org = userOrg as { name: string }

    // Create a notification for the organizer
    const notificationTitle = params.message
      ? `${org.name} expressed interest in collaborating: "${params.message.substring(0, 50)}${params.message.length > 50 ? '...' : ''}"`
      : `${org.name} expressed interest in collaborating on your ${params.resourceType}`

    const { error: notificationError } = await (supabase
      .from('notifications') as any)
      .insert({
        user_id: organizerId,
        actor_id: params.userId,
        type: 'collaboration_request',
        title: notificationTitle,
        reference_type: params.resourceType,
        reference_id: params.resourceId,
        link: `/${params.resourceType}s/${params.resourceId}`,
        action_data: {
          interested_org_id: params.userOrgId,
          interested_org_name: org.name,
          interested_user_id: params.userId,
          message: params.message || null
        },
        read: false,
      })

    if (notificationError) {
      console.error('[expressInterest] Error creating notification:', notificationError)
      return { success: false, error: notificationError.message }
    }

    console.log(`[expressInterest] Created collaboration request for ${params.resourceType} ${params.resourceId}`)
    return { success: true }
  } catch (error) {
    console.error('[expressInterest] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all pending invitations for a user's organization
 */
export async function getPendingInvitations(orgId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await (supabase
      .from('collaboration_invitations' as any) as any)
      .select(`
        *,
        inviter_org:organizations!inviter_org_id(id, name, logo_url)
      `)
      .eq('invitee_org_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getPendingInvitations] Error:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data }
  } catch (error) {
    console.error('[getPendingInvitations] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(userId: string, unreadOnly = false) {
  const supabase = await createClient()

  try {
    let query = (supabase
      .from('notifications' as any) as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getNotifications] Error:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data }
  } catch (error) {
    console.error('[getNotifications] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()

  try {
    const { error } = await (supabase
      .from('notifications' as any) as any)
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)

    if (error) {
      console.error('[markNotificationRead] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[markNotificationRead] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// =============================================================================
// Collaboration Management (Task 3.12)
// =============================================================================

export type RemoveCollaboratorParams = {
  resourceType: 'event' | 'project'
  resourceId: string
  collaboratorOrgId: string
  currentUserOrgId: string
}

export type CollaborationItem = {
  id: string
  title: string
  type: 'event' | 'project'
  ownerOrgId: string
  ownerOrgName: string
  ownerOrgLogo?: string | null
  createdAt: string
}

/**
 * Remove a collaborator from an event or project
 * Only the owner organization can remove collaborators
 */
export async function removeCollaborator(params: RemoveCollaboratorParams) {
  const supabase = await createClient()

  try {
    const table = params.resourceType === 'event' ? 'events' : 'projects'
    const arrayColumn = params.resourceType === 'event' ? 'collaborating_orgs' : 'collaborators'

    // First, verify the current user's org is the owner
    const { data: resource, error: fetchError } = await supabase
      .from(table)
      .select(`id, org_id, ${arrayColumn}`)
      .eq('id', params.resourceId)
      .single()

    if (fetchError || !resource) {
      console.error('[removeCollaborator] Resource not found:', fetchError)
      return { success: false, error: 'Resource not found' }
    }

    // Check ownership
    if ((resource as any).org_id !== params.currentUserOrgId) {
      return { success: false, error: 'Only the owner can remove collaborators' }
    }

    // Get current collaborators and filter out the one to remove
    const currentCollaborators = (resource as any)[arrayColumn] || []
    const newCollaborators = currentCollaborators.filter(
      (orgId: string) => orgId !== params.collaboratorOrgId
    )

    // Update the resource
    const { error: updateError } = await (supabase
      .from(table) as any)
      .update({ [arrayColumn]: newCollaborators })
      .eq('id', params.resourceId)

    if (updateError) {
      console.error('[removeCollaborator] Error updating:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`[removeCollaborator] Removed org ${params.collaboratorOrgId} from ${params.resourceType} ${params.resourceId}`)
    return { success: true }
  } catch (error) {
    console.error('[removeCollaborator] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all events and projects where the organization is a collaborator (not owner)
 */
export async function getMyCollaborations(orgId: string): Promise<{
  success: boolean
  data: CollaborationItem[]
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Query events where org is in collaborating_orgs
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        org_id,
        created_at,
        organization:organizations!events_org_id_fkey(id, name, logo_url)
      `)
      .contains('collaborating_orgs', [orgId])
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (eventsError) {
      console.error('[getMyCollaborations] Events error:', eventsError)
    }

    // Query projects where org is in collaborators
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        org_id,
        created_at,
        organization:organizations!projects_org_id_fkey(id, name, logo_url)
      `)
      .contains('collaborators', [orgId])
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('[getMyCollaborations] Projects error:', projectsError)
    }

    // Combine and format results
    const collaborations: CollaborationItem[] = []

    if (events) {
      for (const event of events as any[]) {
        const org = event.organization as { id: string; name: string; logo_url?: string | null } | null
        collaborations.push({
          id: event.id,
          title: event.title,
          type: 'event',
          ownerOrgId: event.org_id,
          ownerOrgName: org?.name || 'Unknown Organization',
          ownerOrgLogo: org?.logo_url,
          createdAt: event.created_at,
        })
      }
    }

    if (projects) {
      for (const project of projects as any[]) {
        const org = project.organization as { id: string; name: string; logo_url?: string | null } | null
        collaborations.push({
          id: project.id,
          title: project.title,
          type: 'project',
          ownerOrgId: project.org_id,
          ownerOrgName: org?.name || 'Unknown Organization',
          ownerOrgLogo: org?.logo_url,
          createdAt: project.created_at,
        })
      }
    }

    // Sort by created_at descending
    collaborations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log(`[getMyCollaborations] Found ${collaborations.length} collaborations for org ${orgId}`)
    return { success: true, data: collaborations }
  } catch (error) {
    console.error('[getMyCollaborations] Exception:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if a user's organization can edit a resource
 * Returns true if the org is the owner OR a collaborator
 */
export async function canEditResource(
  resourceType: 'event' | 'project',
  resourceId: string,
  userOrgId: string
): Promise<{ canEdit: boolean; isOwner: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const table = resourceType === 'event' ? 'events' : 'projects'
    const arrayColumn = resourceType === 'event' ? 'collaborating_orgs' : 'collaborators'

    const { data: resource, error } = await supabase
      .from(table)
      .select(`org_id, ${arrayColumn}`)
      .eq('id', resourceId)
      .single()

    if (error || !resource) {
      console.error('[canEditResource] Resource not found:', error)
      return { canEdit: false, isOwner: false, error: 'Resource not found' }
    }

    const isOwner = (resource as any).org_id === userOrgId
    const collaborators = (resource as any)[arrayColumn] || []
    const isCollaborator = collaborators.includes(userOrgId)

    return {
      canEdit: isOwner || isCollaborator,
      isOwner,
    }
  } catch (error) {
    console.error('[canEditResource] Exception:', error)
    return {
      canEdit: false,
      isOwner: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get collaborators for an event or project with organization details
 */
export async function getCollaborators(
  resourceType: 'event' | 'project',
  resourceId: string
): Promise<{
  success: boolean
  data: Array<{ id: string; name: string; logo_url?: string | null }>
  error?: string
}> {
  const supabase = await createClient()

  try {
    const table = resourceType === 'event' ? 'events' : 'projects'
    const arrayColumn = resourceType === 'event' ? 'collaborating_orgs' : 'collaborators'

    const { data: resource, error: resourceError } = await supabase
      .from(table)
      .select(arrayColumn)
      .eq('id', resourceId)
      .single()

    if (resourceError || !resource) {
      return { success: false, data: [], error: 'Resource not found' }
    }

    const collaboratorIds = (resource as any)[arrayColumn] || []
    if (collaboratorIds.length === 0) {
      return { success: true, data: [] }
    }

    // Fetch organization details
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, logo_url')
      .in('id', collaboratorIds)

    if (orgsError) {
      console.error('[getCollaborators] Error fetching orgs:', orgsError)
      return { success: false, data: [], error: orgsError.message }
    }

    return { success: true, data: orgs || [] }
  } catch (error) {
    console.error('[getCollaborators] Exception:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
