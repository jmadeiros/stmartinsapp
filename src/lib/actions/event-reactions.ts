'use server'

import { createClient } from "@/lib/supabase/server"

/**
 * Toggle a reaction (like) on an event for the current user
 * If the user has already reacted, remove the reaction
 * If the user hasn't reacted, add the reaction
 */
export async function toggleEventReaction(eventId: string, reactionType: string = 'like') {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[toggleEventReaction] Not authenticated:', userError)
      return { success: false, error: 'Not authenticated', hasReacted: false }
    }

    // Check if user has already reacted to this event
    const { data: existingReaction, error: checkError } = await (supabase
      .from('event_reactions') as any)
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType)
      .maybeSingle()

    if (checkError) {
      console.error('[toggleEventReaction] Error checking existing reaction:', checkError)
      return { success: false, error: checkError.message, hasReacted: false }
    }

    if (existingReaction) {
      // Remove the reaction
      const { error: deleteError } = await (supabase
        .from('event_reactions') as any)
        .delete()
        .eq('id', existingReaction.id)

      if (deleteError) {
        console.error('[toggleEventReaction] Error removing reaction:', deleteError)
        return { success: false, error: deleteError.message, hasReacted: false }
      }

      console.log(`[toggleEventReaction] Removed reaction from event ${eventId}`)
      return { success: true, hasReacted: false, error: null }
    } else {
      // Add the reaction
      const { error: insertError } = await (supabase
        .from('event_reactions') as any)
        .insert({
          event_id: eventId,
          user_id: user.id,
          reaction_type: reactionType
        })

      if (insertError) {
        console.error('[toggleEventReaction] Error adding reaction:', insertError)
        return { success: false, error: insertError.message, hasReacted: false }
      }

      console.log(`[toggleEventReaction] Added reaction to event ${eventId}`)

      // Create notification for event organizer
      try {
        await createEventReactionNotification(supabase, eventId, user.id)
      } catch (notifError) {
        console.warn('[toggleEventReaction] Failed to create notification:', notifError)
        // Don't fail the whole operation if notification fails
      }

      return { success: true, hasReacted: true, error: null }
    }
  } catch (error) {
    console.error('[toggleEventReaction] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasReacted: false
    }
  }
}

/**
 * Get reaction data for an event (count and whether current user has reacted)
 */
export async function getEventReactionData(eventId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get total count
    const { count, error: countError } = await (supabase
      .from('event_reactions') as any)
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)

    if (countError) {
      console.error('[getEventReactionData] Error getting count:', countError)
      return { count: 0, hasReacted: false, error: countError.message }
    }

    // Check if current user has reacted
    let hasReacted = false
    if (user) {
      const { data, error: checkError } = await (supabase
        .from('event_reactions') as any)
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!checkError && data) {
        hasReacted = true
      }
    }

    return { count: count || 0, hasReacted, error: null }
  } catch (error) {
    console.error('[getEventReactionData] Exception:', error)
    return {
      count: 0,
      hasReacted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a notification for the event organizer when someone reacts to their event
 */
async function createEventReactionNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  actorId: string
) {
  // Get the event organizer
  const { data: event, error: eventError } = await (supabase
    .from('events') as any)
    .select('organizer_id, title')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    console.error('[createEventReactionNotification] Error fetching event:', eventError)
    return
  }

  // Don't notify if user reacted to their own event
  if (event.organizer_id === actorId) {
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
      user_id: event.organizer_id,
      actor_id: actorId,
      type: 'event_reaction',
      title: `${actorName} liked your event "${event.title}"`,
      reference_type: 'event',
      reference_id: eventId,
      link: `/events/${eventId}`,
      action_data: {
        actor_name: actorName,
        event_title: event.title
      },
      read: false
    })

  if (notifError) {
    console.error('[createEventReactionNotification] Error creating notification:', notifError)
  } else {
    console.log(`[createEventReactionNotification] Created notification for user ${event.organizer_id}`)
  }
}
