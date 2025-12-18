import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type Client = SupabaseClient<Database>

/**
 * Fetch feed items from the unified feed view
 * Pinned posts appear first, followed by posts ordered by creation date
 */
export async function getFeed(
  supabase: Client,
  orgId: string,
  options?: {
    limit?: number
    offset?: number
  }
) {
  const { data, error } = await supabase
    .from('feed')
    .select('*')
    .eq('org_id', orgId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 20) - 1)

  if (error) {
    console.error('Error fetching feed:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch posts by category
 * Pinned posts appear first, followed by posts ordered by creation date
 */
export async function getPostsByCategory(
  supabase: Client,
  orgId: string,
  category: Database['public']['Enums']['post_category'],
  options?: {
    limit?: number
    offset?: number
  }
) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('org_id', orgId)
    .eq('category', category)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 20) - 1)

  if (error) {
    console.error('Error fetching posts by category:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch events with RSVPs
 */
export async function getEvents(
  supabase: Client,
  orgId: string,
  options?: {
    limit?: number
    offset?: number
  }
) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      creator:profiles!events_creator_id_fkey(
        id,
        display_name,
        avatar_url
      ),
      rsvps:event_rsvps(count)
    `)
    .eq('org_id', orgId)
    .order('start_date', { ascending: true })
    .range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 20) - 1)

  if (error) {
    console.error('Error fetching events:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch projects with tasks
 */
export async function getProjects(
  supabase: Client,
  orgId: string,
  options?: {
    limit?: number
    offset?: number
  }
) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(
        id,
        display_name,
        avatar_url
      ),
      tasks:project_tasks(count)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 20) - 1)

  if (error) {
    console.error('Error fetching projects:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Create a new post
 */
export async function createPost(
  supabase: Client,
  post: Database['public']['Tables']['posts']['Insert']
) {
  const { data, error } = await supabase
    .from('posts')
    .insert(post as any)
    .select()
    .single()

  if (error) {
    console.error('Error creating post:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * RSVP to an event with support options
 */
export async function rsvpToEvent(
  supabase: Client,
  params: {
    eventId: string
    userId: string
    orgId: string
    status?: string
    volunteerOffered?: boolean
    participantsCount?: number
    canPartner?: boolean
  }
) {
  const { data, error } = await (supabase.rpc as any)('rsvp_event', {
    p_event_id: params.eventId,
    p_user_id: params.userId,
    p_org_id: params.orgId,
    p_status: params.status ?? 'interested',
    p_volunteer_offered: params.volunteerOffered ?? false,
    p_participants_count: params.participantsCount ?? null,
    p_can_partner: params.canPartner ?? false,
  })

  if (error) {
    console.error('Error RSVP to event:', error)
    return { data: null, error }
  }

  // Create notification for event organizer
  try {
    // Get the event's organizer_id
    type EventOrganizer = {
      organizer_id: string
      title: string
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id, title')
      .eq('id', params.eventId)
      .single()

    const typedEvent = event as EventOrganizer | null

    if (eventError || !typedEvent) {
      console.warn('[rsvpToEvent] Could not fetch event for notification:', eventError)
    } else if (typedEvent.organizer_id !== params.userId) {
      // Don't notify if user RSVPs to their own event

      // Get the RSVPing user's name
      type ProfileResult = {
        full_name: string
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', params.userId)
        .single()

      const typedProfile = userProfile as ProfileResult | null
      const userName = typedProfile?.full_name || 'Someone'

      // Truncate event title for preview
      const eventTitle = typedEvent.title || 'your event'
      const eventTitlePreview = eventTitle.length > 60
        ? eventTitle.substring(0, 60) + '...'
        : eventTitle

      // Create the notification
      const { error: notifError } = await (supabase
        .from('notifications') as any)
        .insert({
          user_id: typedEvent.organizer_id,
          actor_id: params.userId,
          type: 'rsvp',
          title: `${userName} is attending "${eventTitlePreview}"`,
          reference_type: 'event',
          reference_id: params.eventId,
          link: `/events/${params.eventId}`,
          action_data: {
            actor_name: userName,
            event_title: eventTitle
          },
          read: false
        })

      if (notifError) {
        console.warn('[rsvpToEvent] Failed to create notification:', notifError)
      } else {
        console.log(`[rsvpToEvent] Created notification for event organizer ${typedEvent.organizer_id}`)
      }
    }
  } catch (notifError) {
    console.warn('[rsvpToEvent] Exception creating notification:', notifError)
    // Don't fail the RSVP if notification fails
  }

  return { data, error: null }
}

/**
 * Express interest in a project with support options
 */
export async function expressProjectInterest(
  supabase: Client,
  params: {
    projectId: string
    userId: string
    orgId: string
    volunteerOffered?: boolean
    participantsCount?: number
    canPartner?: boolean
    provideResources?: boolean
    contributeFunding?: boolean
  }
) {
  const { data, error } = await (supabase.rpc as any)('express_project_interest', {
    p_project_id: params.projectId,
    p_user_id: params.userId,
    p_org_id: params.orgId,
    p_volunteer_offered: params.volunteerOffered ?? false,
    p_participants_count: params.participantsCount ?? null,
    p_can_partner: params.canPartner ?? false,
    p_provide_resources: params.provideResources ?? false,
    p_contribute_funding: params.contributeFunding ?? false,
  })

  if (error) {
    console.error('Error expressing project interest:', error)
    return { data: null, error }
  }

  // Create notification for project owner
  try {
    // Get the project's author_id
    type ProjectOwner = {
      author_id: string
      title: string
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('author_id, title')
      .eq('id', params.projectId)
      .single()

    const typedProject = project as ProjectOwner | null

    if (projectError || !typedProject) {
      console.warn('[expressProjectInterest] Could not fetch project for notification:', projectError)
    } else if (typedProject.author_id !== params.userId) {
      // Don't notify if user expresses interest in their own project

      // Get the user's name
      type ProfileResult = {
        full_name: string
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', params.userId)
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
          actor_id: params.userId,
          type: 'project_interest',
          title: `${userName} is interested in "${projectTitlePreview}"`,
          reference_type: 'project',
          reference_id: params.projectId,
          link: `/projects/${params.projectId}`,
          action_data: {
            actor_name: userName,
            project_title: projectTitle
          },
          read: false
        })

      if (notifError) {
        console.warn('[expressProjectInterest] Failed to create notification:', notifError)
      } else {
        console.log(`[expressProjectInterest] Created notification for project owner ${typedProject.author_id}`)
      }
    }
  } catch (notifError) {
    console.warn('[expressProjectInterest] Exception creating notification:', notifError)
    // Don't fail the interest expression if notification fails
  }

  return { data, error: null }
}

/**
 * Fetch opportunities (opportunity posts)
 */
export async function getOpportunities(
  supabase: Client,
  orgId: string,
  options?: {
    limit?: number
    offset?: number
  }
) {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 20) - 1)

  if (error) {
    console.error('Error fetching opportunities:', error)
    return { data: null, error }
  }

  return { data, error: null }
}
