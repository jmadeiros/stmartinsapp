'use server'

import { createClient } from "@/lib/supabase/server"
import { inviteCollaborators } from "./collaboration"

export type CreateEventParams = {
  title: string
  description: string
  date: string  // YYYY-MM-DD format
  time: string  // HH:MM format
  location: string
  organizerId: string
  orgId: string
  cause?: string
  volunteersNeeded?: number
  seekingPartners?: boolean
  inviteCollaborators?: string[]
}

/**
 * Create a new event in the database
 */
export async function createEvent(params: CreateEventParams) {
  const supabase = await createClient()

  try {
    // Combine date and time into ISO timestamps
    const startTime = `${params.date}T${params.time}:00Z`
    // Default end time to 2 hours after start
    const endDate = new Date(`${params.date}T${params.time}:00Z`)
    endDate.setHours(endDate.getHours() + 2)
    const endTime = endDate.toISOString()

    // Create the event
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        organizer_id: params.organizerId,
        org_id: params.orgId,
        title: params.title,
        description: params.description,
        location: params.location,
        start_time: startTime,
        end_time: endTime,
        cause: params.cause || null,
        volunteers_needed: params.volunteersNeeded || null,
        seeking_partners: params.seekingPartners || false,
        category: 'other' as const,
        status: 'Open',
      })
      .select()
      .single()

    if (error) {
      console.error('[createEvent] Error creating event:', error)
      return { success: false, error: error.message, data: null }
    }

    console.log(`[createEvent] Created event: ${event.id}`)

    // If inviting collaborators, send invitations
    if (params.inviteCollaborators && params.inviteCollaborators.length > 0 && event) {
      const inviteResult = await inviteCollaborators({
        resourceType: 'event',
        resourceId: event.id,
        inviterOrgId: params.orgId,
        inviterUserId: params.organizerId,
        inviteeOrgIds: params.inviteCollaborators,
        message: `You've been invited to collaborate on the event "${params.title}"`,
      })

      if (!inviteResult.success) {
        console.error('[createEvent] Error sending invitations:', inviteResult.error)
        // Don't fail the event creation if invitations fail
      } else {
        console.log(`[createEvent] Sent ${params.inviteCollaborators.length} invitations`)
      }
    }

    return { success: true, data: event, error: null }
  } catch (error) {
    console.error('[createEvent] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}
