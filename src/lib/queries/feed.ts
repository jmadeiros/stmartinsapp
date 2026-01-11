import type { Database } from '@/lib/database.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// eslint-disable-next-line
type Client = any // Supabase client type varies between browser and server

// Types for realtime feed events
export type PostRow = Database['public']['Tables']['posts']['Row']
export type PostCommentRow = Database['public']['Tables']['post_comments']['Row']
export type PostReactionRow = Database['public']['Tables']['post_reactions']['Row']

export type FeedRealtimeEvent =
  | { type: 'post'; event: 'INSERT' | 'UPDATE' | 'DELETE'; payload: PostRow }
  | { type: 'comment'; event: 'INSERT' | 'UPDATE' | 'DELETE'; payload: PostCommentRow }
  | { type: 'reaction'; event: 'INSERT' | 'UPDATE' | 'DELETE'; payload: PostReactionRow }

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

/**
 * Subscribe to real-time feed updates for an organization
 *
 * This enables instant feed updates instead of polling.
 * RLS policies ensure users only receive posts from their organization.
 *
 * IMPORTANT: The feed tables must have:
 * 1. REPLICA IDENTITY FULL set (for filtered subscriptions to work)
 * 2. Be added to the supabase_realtime publication
 *
 * Run the migration: 20260106200000_enable_feed_realtime.sql
 */
export function subscribeToFeed(
  supabase: Client,
  orgId: string,
  callbacks: {
    onPostInsert?: (post: PostRow) => void
    onPostUpdate?: (post: PostRow) => void
    onPostDelete?: (post: PostRow) => void
    onCommentInsert?: (comment: PostCommentRow) => void
    onCommentUpdate?: (comment: PostCommentRow) => void
    onCommentDelete?: (comment: PostCommentRow) => void
    onReactionInsert?: (reaction: PostReactionRow) => void
    onReactionDelete?: (reaction: PostReactionRow) => void
  }
): RealtimeChannel {
  console.log('[Feed Realtime] Creating subscription for org:', orgId)

  const channel = supabase.channel(`feed:${orgId}`)

  // Subscribe to posts table
  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
      },
      (payload: { new: PostRow }) => {
        console.log('[Feed Realtime] Post INSERT received:', payload)
        // Filter by org_id client-side (RLS should already filter, but double-check)
        if (payload.new.org_id === orgId) {
          callbacks.onPostInsert?.(payload.new)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'posts',
      },
      (payload: { new: PostRow; old: PostRow }) => {
        console.log('[Feed Realtime] Post UPDATE received:', payload)
        if (payload.new.org_id === orgId) {
          callbacks.onPostUpdate?.(payload.new)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'posts',
      },
      (payload: { old: PostRow }) => {
        console.log('[Feed Realtime] Post DELETE received:', payload)
        if (payload.old.org_id === orgId) {
          callbacks.onPostDelete?.(payload.old)
        }
      }
    )

  // Subscribe to post_comments table
  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'post_comments',
      },
      (payload: { new: PostCommentRow }) => {
        console.log('[Feed Realtime] Comment INSERT received:', payload)
        callbacks.onCommentInsert?.(payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'post_comments',
      },
      (payload: { new: PostCommentRow }) => {
        console.log('[Feed Realtime] Comment UPDATE received:', payload)
        callbacks.onCommentUpdate?.(payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'post_comments',
      },
      (payload: { old: PostCommentRow }) => {
        console.log('[Feed Realtime] Comment DELETE received:', payload)
        callbacks.onCommentDelete?.(payload.old)
      }
    )

  // Subscribe to post_reactions table
  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'post_reactions',
      },
      (payload: { new: PostReactionRow }) => {
        console.log('[Feed Realtime] Reaction INSERT received:', payload)
        callbacks.onReactionInsert?.(payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'post_reactions',
      },
      (payload: { old: PostReactionRow }) => {
        console.log('[Feed Realtime] Reaction DELETE received:', payload)
        callbacks.onReactionDelete?.(payload.old)
      }
    )

  // Subscribe and log status
  channel.subscribe((status: string, err?: Error) => {
    console.log('[Feed Realtime] Subscription status:', status, 'for org:', orgId)
    if (err) {
      console.error('[Feed Realtime] Subscription error:', err)
      console.error('[Feed Realtime] This may be due to:')
      console.error('  1. REPLICA IDENTITY FULL not set on tables')
      console.error('  2. Tables not in supabase_realtime publication')
      console.error('  3. RLS policies blocking access')
    }
    if (status === 'SUBSCRIBED') {
      console.log('[Feed Realtime] Successfully subscribed! Waiting for feed updates...')
    }
    if (status === 'CHANNEL_ERROR') {
      console.error('[Feed Realtime] Channel error - check Supabase Realtime configuration')
      console.error('  Run migration: 20260106200000_enable_feed_realtime.sql')
    }
    if (status === 'TIMED_OUT') {
      console.error('[Feed Realtime] Subscription timed out - check network or Supabase status')
    }
  })

  return channel
}
