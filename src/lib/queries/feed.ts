import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type Client = SupabaseClient<Database>

/**
 * Fetch feed items from the unified feed view
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
    .insert(post)
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
  const { data, error } = await supabase.rpc('rsvp_event', {
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
  const { data, error } = await supabase.rpc('express_project_interest', {
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
