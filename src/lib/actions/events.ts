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
    // Fetch the event with organization (foreign key exists)
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        collaborating_orgs,
        organization:organizations!events_org_id_fkey(
          id,
          name,
          logo_url
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

    const eventData = event as { organizer_id: string; collaborating_orgs?: string[] | null }

    // Fetch organizer profile separately (no foreign key exists)
    const { data: organizerProfile } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, avatar_url, role, job_title, organization_id')
      .eq('user_id', eventData.organizer_id)
      .single()

    // Fetch organizer's organization if they have one
    let organizerOrg: { name: string } | null = null
    if (organizerProfile?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizerProfile.organization_id)
        .single()
      organizerOrg = org
    }

    // Fetch RSVPs with attendee profiles separately
    const { data: rsvps } = await supabase
      .from('event_rsvps')
      .select('id, user_id, status, volunteer_offered, participants_count, can_partner, created_at')
      .eq('event_id', eventId)

    // Fetch attendee profiles for RSVPs
    const rsvpUserIds = (rsvps || []).map(r => r.user_id)
    let attendeeProfiles: Record<string, { user_id: string; full_name: string; avatar_url: string | null; role: string }> = {}
    if (rsvpUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, role')
        .in('user_id', rsvpUserIds)

      attendeeProfiles = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p
        return acc
      }, {} as Record<string, { user_id: string; full_name: string; avatar_url: string | null; role: string }>)
    }

    // Attach attendee profiles to RSVPs
    const rsvpsWithAttendees = (rsvps || []).map(rsvp => ({
      ...rsvp,
      attendee: attendeeProfiles[rsvp.user_id] || null
    }))

    // Fetch collaborator org details
    let collaboratorOrgs: Array<{id: string, name: string, logo_url?: string | null}> = []
    if (eventData.collaborating_orgs && eventData.collaborating_orgs.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, logo_url')
        .in('id', eventData.collaborating_orgs)
      collaboratorOrgs = orgs || []
    }

    // Construct the organizer object
    const organizer = organizerProfile ? {
      user_id: organizerProfile.user_id,
      full_name: organizerProfile.full_name,
      avatar_url: organizerProfile.avatar_url,
      role: organizerProfile.role,
      job_title: organizerProfile.job_title,
      organization: organizerOrg ? [{ organization: organizerOrg }] : []
    } : null

    return {
      success: true,
      data: {
        ...(event as Record<string, unknown>),
        organizer,
        rsvps: rsvpsWithAttendees,
        collaboratorOrgs
      },
      error: null
    }
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
