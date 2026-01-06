'use server'

import { createClient } from "@/lib/supabase/server"

/**
 * Toggle RSVP status for an event
 * - If user has already RSVPed, remove the RSVP (no notification)
 * - If user hasn't RSVPed, create an RSVP and notify the event organizer
 */
export async function toggleEventRsvp(eventId: string) {
  console.log('[toggleEventRsvp] Called with eventId:', eventId)
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('[toggleEventRsvp] User:', user?.id || 'none', 'AuthError:', userError?.message || 'none')

    if (userError || !user) {
      console.error('[toggleEventRsvp] Not authenticated:', userError)
      return { success: false, error: 'Not authenticated', isRsvped: false }
    }

    // Get user's org_id from their profile
    type ProfileResult = {
      organization_id: string | null
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    const typedProfile = profile as ProfileResult | null

    if (profileError || !typedProfile?.organization_id) {
      console.error('[toggleEventRsvp] Error fetching user org:', profileError)
      return { success: false, error: 'Could not determine user organization', isRsvped: false }
    }

    const orgId = typedProfile.organization_id

    // Check if user has already RSVPed to this event
    type RsvpCheck = {
      event_id: string
      user_id: string
    }

    const { data: existingRsvp, error: checkError } = await supabase
      .from('event_rsvps')
      .select('event_id, user_id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()

    const typedRsvp = existingRsvp as RsvpCheck | null

    if (checkError) {
      console.error('[toggleEventRsvp] Error checking existing RSVP:', checkError)
      return { success: false, error: checkError.message, isRsvped: false }
    }

    if (typedRsvp) {
      // Remove the RSVP (no notification)
      const { error: deleteError } = await (supabase
        .from('event_rsvps') as any)
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('[toggleEventRsvp] Error removing RSVP:', deleteError)
        return { success: false, error: deleteError.message, isRsvped: false }
      }

      console.log(`[toggleEventRsvp] Removed RSVP from event ${eventId}`)
      return { success: true, isRsvped: false, error: null }
    } else {
      // Add the RSVP
      const { error: insertError } = await (supabase
        .from('event_rsvps') as any)
        .insert({
          event_id: eventId,
          user_id: user.id,
          org_id: orgId,
          status: 'going'
        })

      if (insertError) {
        console.error('[toggleEventRsvp] Error adding RSVP:', insertError)
        return { success: false, error: insertError.message, isRsvped: false }
      }

      console.log(`[toggleEventRsvp] Added RSVP to event ${eventId}`)

      // Create notification for event organizer
      try {
        await createRsvpNotification(supabase, eventId, user.id)
      } catch (notifError) {
        console.warn('[toggleEventRsvp] Failed to create notification:', notifError)
        // Don't fail the whole operation if notification fails
      }

      return { success: true, isRsvped: true, error: null }
    }
  } catch (error) {
    console.error('[toggleEventRsvp] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isRsvped: false
    }
  }
}

/**
 * Get the current user's RSVP status for an event
 */
export async function getEventRsvpStatus(eventId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { isRsvped: false, rsvpData: null, error: null }
    }

    type RsvpData = {
      event_id: string
      user_id: string
      status: string
      volunteer_offered: boolean | null
      participants_count: number | null
      can_partner: boolean | null
      created_at: string
    }

    const { data, error } = await supabase
      .from('event_rsvps')
      .select('event_id, user_id, status, volunteer_offered, participants_count, can_partner, created_at')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()

    const typedData = data as RsvpData | null

    if (error) {
      console.error('[getEventRsvpStatus] Error:', error)
      return { isRsvped: false, rsvpData: null, error: error.message }
    }

    return { isRsvped: !!typedData, rsvpData: typedData, error: null }
  } catch (error) {
    console.error('[getEventRsvpStatus] Exception:', error)
    return {
      isRsvped: false,
      rsvpData: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update support options for an existing event RSVP
 */
export async function updateEventRsvpSupport(
  eventId: string,
  supportOptions: {
    volunteer_offered?: boolean
    participants_count?: number | null
    can_partner?: boolean
  }
) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[updateEventRsvpSupport] Not authenticated:', userError)
      return { success: false, error: 'Not authenticated' }
    }

    // Update the RSVP with support options
    const { error: updateError } = await (supabase
      .from('event_rsvps') as any)
      .update(supportOptions)
      .eq('event_id', eventId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[updateEventRsvpSupport] Error updating RSVP:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`[updateEventRsvpSupport] Updated RSVP support options for event ${eventId}`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[updateEventRsvpSupport] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a notification for the event organizer when someone RSVPs
 */
async function createRsvpNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  actorId: string
) {
  // Get the event's organizer
  type EventOrganizer = {
    organizer_id: string
    title: string
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('organizer_id, title')
    .eq('id', eventId)
    .single()

  const typedEvent = event as EventOrganizer | null

  if (eventError || !typedEvent) {
    console.error('[createRsvpNotification] Error fetching event:', eventError)
    return
  }

  // Don't notify if user RSVPs to their own event
  if (typedEvent.organizer_id === actorId) {
    return
  }

  // Get actor's name for the notification
  type ProfileResult = {
    full_name: string
  }

  const { data: actorProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', actorId)
    .single()

  const typedProfile = actorProfile as ProfileResult | null
  const actorName = typedProfile?.full_name || 'Someone'

  // Get event title preview
  const eventTitle = typedEvent.title || 'your event'
  const eventTitlePreview = eventTitle.length > 60
    ? eventTitle.substring(0, 60) + '...'
    : eventTitle

  // Create the notification with event context in title
  const { error: notifError } = await (supabase
    .from('notifications') as any)
    .insert({
      user_id: typedEvent.organizer_id,
      actor_id: actorId,
      type: 'rsvp',
      title: `${actorName} is attending "${eventTitlePreview}"`,
      reference_type: 'event',
      reference_id: eventId,
      link: `/events/${eventId}`,
      action_data: {
        actor_name: actorName,
        event_title: eventTitle
      },
      read: false
    })

  if (notifError) {
    console.error('[createRsvpNotification] Error creating notification:', notifError)
  } else {
    console.log(`[createRsvpNotification] Created notification for event organizer ${typedEvent.organizer_id}`)
  }
}
