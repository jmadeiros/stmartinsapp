'use server'

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/database.types"

export type SearchResult = {
  posts: Array<{
    id: string
    content: string
    category: string
    created_at: string
    author_id: string
    title: string | null
    org_id: string
  }>
  events: Array<{
    id: string
    title: string
    description: string | null
    start_time: string
    end_time: string
    location: string | null
    organizer_id: string
    org_id: string
  }>
  projects: Array<{
    id: string
    title: string
    description: string
    status: string
    created_at: string
    author_id: string
    org_id: string
  }>
  people: Array<{
    user_id: string
    full_name: string
    job_title: string | null
    bio: string | null
    avatar_url: string | null
    organization_id: string | null
    organization_name: string | null
  }>
}

/**
 * Search across all entities in The Village Hub
 * Uses ILIKE for fuzzy matching
 */
export async function searchAll(query: string): Promise<{
  success: boolean
  data?: SearchResult
  error?: string
}> {
  if (!query || query.trim().length === 0) {
    return {
      success: true,
      data: {
        posts: [],
        events: [],
        projects: [],
        people: []
      }
    }
  }

  const supabase = await createClient()

  // Get current user to filter by their org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      success: false,
      error: 'Not authenticated'
    }
  }

  // Get user's organization
  const { data: membership } = await (supabase
    .from('user_memberships') as any)
    .select('org_id')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single()

  if (!membership?.org_id) {
    return {
      success: false,
      error: 'No organization found'
    }
  }

  const searchPattern = `%${query.trim()}%`

  try {
    // Search posts - search in content and title
    const { data: posts, error: postsError } = await (supabase
      .from('posts') as any)
      .select('id, content, category, created_at, author_id, title, org_id')
      .eq('org_id', membership.org_id)
      .is('deleted_at', null)
      .or(`content.ilike.${searchPattern},title.ilike.${searchPattern}`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (postsError) {
      console.error('Error searching posts:', postsError)
    }

    // Search events - search in title and description
    const { data: events, error: eventsError } = await (supabase
      .from('events') as any)
      .select('id, title, description, start_time, end_time, location, organizer_id, org_id')
      .eq('org_id', membership.org_id)
      .is('deleted_at', null)
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .order('start_time', { ascending: false })
      .limit(20)

    if (eventsError) {
      console.error('Error searching events:', eventsError)
    }

    // Search projects - search in title and description
    const { data: projects, error: projectsError } = await (supabase
      .from('projects') as any)
      .select('id, title, description, status, created_at, author_id, org_id')
      .eq('org_id', membership.org_id)
      .is('deleted_at', null)
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (projectsError) {
      console.error('Error searching projects:', projectsError)
    }

    // Search people - search in full_name, job_title, and bio
    const { data: people, error: peopleError } = await (supabase
      .from('people') as any)
      .select('*')
      .or(`full_name.ilike.${searchPattern},job_title.ilike.${searchPattern},bio.ilike.${searchPattern}`)
      .limit(20)

    if (peopleError) {
      console.error('Error searching people:', peopleError)
    }

    return {
      success: true,
      data: {
        posts: posts || [],
        events: events || [],
        projects: projects || [],
        people: people || []
      }
    }
  } catch (error) {
    console.error('Search error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    }
  }
}
