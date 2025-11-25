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
 * Send collaboration invitations to multiple organizations
 * This creates invitation records and triggers notifications via database trigger
 */
export async function inviteCollaborators(params: InviteCollaboratorsParams) {
  const supabase = await createClient()

  try {
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

    const { data, error } = await supabase
      .from('collaboration_invitations')
      .insert(invitations)
      .select()

    if (error) {
      console.error('[inviteCollaborators] Error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[inviteCollaborators] Created ${data.length} invitations`)
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
 */
export async function respondToInvitation(params: RespondToInvitationParams) {
  const supabase = await createClient()

  try {
    // First, get the invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('collaboration_invitations')
      .select('*')
      .eq('id', params.invitationId)
      .single()

    if (invitationError || !invitation) {
      return { success: false, error: 'Invitation not found' }
    }

    // Update the invitation status
    const { error: updateError } = await supabase
      .from('collaboration_invitations')
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

    // If accepted, add the organization to the resource's collaborators
    if (params.status === 'accepted') {
      const table = invitation.resource_type === 'event' ? 'events' : 'projects'
      const arrayColumn = invitation.resource_type === 'event' ? 'collaborating_orgs' : 'collaborators'

      // Get current collaborators
      const { data: resource, error: resourceError } = await supabase
        .from(table)
        .select(arrayColumn)
        .eq('id', invitation.resource_id)
        .single()

      if (resourceError || !resource) {
        console.error('[respondToInvitation] Error fetching resource:', resourceError)
        return { success: false, error: 'Resource not found' }
      }

      // Add the new collaborator if not already in the array
      const currentCollaborators = (resource as any)[arrayColumn] || []
      if (!currentCollaborators.includes(invitation.invitee_org_id)) {
        const newCollaborators = [...currentCollaborators, invitation.invitee_org_id]

        const { error: updateResourceError } = await supabase
          .from(table)
          .update({ [arrayColumn]: newCollaborators })
          .eq('id', invitation.resource_id)

        if (updateResourceError) {
          console.error('[respondToInvitation] Error updating resource:', updateResourceError)
          return { success: false, error: updateResourceError.message }
        }
      }
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

    const organizerId = (resource as any)[organizerField]

    // Get the user's organization name
    const { data: userOrg, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', params.userOrgId)
      .single()

    if (orgError || !userOrg) {
      return { success: false, error: 'Organization not found' }
    }

    // Create a notification for the organizer
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: organizerId,
        org_id: resource.org_id,
        type: 'collaboration_request',
        title: 'Interest in Collaboration',
        message: params.message
          ? `${userOrg.name} expressed interest in collaborating: "${params.message}"`
          : `${userOrg.name} expressed interest in collaborating on your ${params.resourceType}`,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        action_url: `/${params.resourceType}s/${params.resourceId}`,
        action_data: {
          interested_org_id: params.userOrgId,
          interested_org_name: userOrg.name,
          interested_user_id: params.userId,
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
    const { data, error } = await supabase
      .from('collaboration_invitations')
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
    let query = supabase
      .from('notifications')
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
    const { error } = await supabase
      .from('notifications')
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
