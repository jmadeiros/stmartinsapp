// @ts-nocheck
// TODO(Wave 2): Remove @ts-nocheck after fixing complex type inference issues
'use server'

import { createClient } from "@/lib/supabase/server"
import { inviteCollaborators } from "./collaboration"

export type EventCategory = 'meeting' | 'social' | 'workshop' | 'building_event' | 'other'

export type CreateEventParams = {
  title: string
  description: string
  date: string  // YYYY-MM-DD format
  time: string  // HH:MM format
  location: string
  organizerId: string
  orgId: string
  category?: EventCategory
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
        category: params.category || 'other',
        status: 'Open',
      } as any)
      .select()
      .single()

    if (error) {
      console.error('[createEvent] Error creating event:', error)
      return { success: false, error: error.message, data: null }
    }

    const eventData = event as { id: string } | null
    console.log(`[createEvent] Created event: ${eventData?.id}`)

    // If inviting collaborators, send invitations
    if (params.inviteCollaborators && params.inviteCollaborators.length > 0 && eventData) {
      const inviteResult = await inviteCollaborators({
        resourceType: 'event',
        resourceId: eventData.id,
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

/**
 * Get a single event by ID with full details including organizer, organization, RSVPs, and collaborations
 */
export async function getEventById(eventId: string) {
  const supabase = await createClient()

  try {
    // Fetch the event with related data
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        collaborating_orgs,
        organizer:user_profiles!events_organizer_id_fkey(
          user_id,
          full_name,
          avatar_url,
          role,
          organization:organization_members!user_profiles_user_id_fkey(
            organization:organizations(name)
          )
        ),
        organization:organizations!events_org_id_fkey(
          id,
          name,
          logo_url
        ),
        rsvps:event_rsvps(
          id,
          user_id,
          status,
          volunteer_offered,
          participants_count,
          can_partner,
          created_at,
          attendee:user_profiles!event_rsvps_user_id_fkey(
            user_id,
            full_name,
            avatar_url,
            role
          )
        )
      `)
      .eq('id', eventId)
      .single()

    if (error) {
      console.error('[getEventById] Error fetching event:', error)
      return { success: false, error: error.message, data: null }
    }

    if (!event) {
      return { success: false, error: 'Event not found', data: null }
    }

    // After getting event data, fetch collaborator org details
    let collaboratorOrgs: Array<{id: string, name: string, logo_url?: string | null}> = []
    const eventData = event as { collaborating_orgs?: string[] | null }
    if (eventData.collaborating_orgs && eventData.collaborating_orgs.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, logo_url')
        .in('id', eventData.collaborating_orgs)
      collaboratorOrgs = orgs || []
    }

    return { success: true, data: { ...(event as Record<string, unknown>), collaboratorOrgs }, error: null }
  } catch (error) {
    console.error('[getEventById] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Get all events organized by a specific user
 */
export async function getUserEvents(userId: string) {
  const supabase = await createClient()

  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        location,
        start_time,
        end_time,
        category,
        status,
        cause,
        created_at,
        organization:organizations!events_org_id_fkey(
          id,
          name
        )
      `)
      .eq('organizer_id', userId)
      .order('start_time', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[getUserEvents] Error fetching events:', error)
      return { data: [], error: error.message }
    }

    // Get RSVP counts for each event
    const eventsWithCounts = await Promise.all((events || []).map(async (event) => {
      const { count } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('status', 'going')

      return {
        ...event,
        attendeeCount: count || 0
      }
    }))

    return { data: eventsWithCounts, error: null }
  } catch (error) {
    console.error('[getUserEvents] Exception:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get all events a user has RSVP'd to
 */
export async function getUserRSVPs(userId: string) {
  const supabase = await createClient()

  try {
    const { data: rsvps, error } = await supabase
      .from('event_rsvps')
      .select(`
        id,
        status,
        created_at,
        event:events(
          id,
          title,
          description,
          location,
          start_time,
          end_time,
          category,
          status,
          organization:organizations!events_org_id_fkey(
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'going')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[getUserRSVPs] Error fetching RSVPs:', error)
      return { data: [], error: error.message }
    }

    // Flatten the data structure
    const events = (rsvps || [])
      .filter(rsvp => rsvp.event)
      .map(rsvp => rsvp.event)

    return { data: events, error: null }
  } catch (error) {
    console.error('[getUserRSVPs] Exception:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
