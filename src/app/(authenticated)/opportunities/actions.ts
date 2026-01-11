'use server'

import { createClient } from "@/lib/supabase/server"
import { formatDistanceToNow } from "date-fns"
import type { OpportunityItem, OpportunityCounts, OpportunityType } from "./types"

interface ProfileData {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  organization_id: string | null
}

interface OrgData {
  id: string
  name: string
}

/**
 * Determine opportunity types based on source data
 */
function determineOpportunityTypes(
  source: 'post' | 'event' | 'project',
  data: Record<string, unknown>
): OpportunityType[] {
  const types: OpportunityType[] = []

  if (source === 'post') {
    // All opportunity posts are treated as jobs
    types.push('job')
  }

  if (source === 'event' || source === 'project') {
    if (data.volunteers_needed && Number(data.volunteers_needed) > 0) {
      types.push('volunteering')
    }
    if (data.seeking_partners) {
      types.push('collaboration')
    }
  }

  if (source === 'project' && data.fundraising_goal) {
    types.push('funding')
  }

  return types
}

/**
 * Generate a pseudo-random rotation between -1 and 1 degrees
 * based on the item ID for consistent bulletin board effect
 */
function generateRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash = hash & hash
  }
  return ((hash % 200) - 100) / 100 // Returns -1 to 1
}

/**
 * Fetch all opportunities from posts, events, and projects
 */
export async function getOpportunitiesData(orgId: string): Promise<{
  opportunities: OpportunityItem[]
  counts: OpportunityCounts
}> {
  const supabase = await createClient()

  // Parallel fetch from all sources
  const [postsResult, eventsResult, projectsResult] = await Promise.all([
    // 1. Opportunity posts (using the opportunities view)
    supabase
      .from('opportunities')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50),

    // 2. Events seeking help (future events only)
    supabase
      .from('events')
      .select('id, title, description, start_time, end_time, location, volunteers_needed, seeking_partners, org_id, organizer_id, created_at, cause')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .or('volunteers_needed.gt.0,seeking_partners.eq.true')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(30),

    // 3. Projects seeking help (active projects only)
    supabase
      .from('projects')
      .select('id, title, description, volunteers_needed, seeking_partners, fundraising_goal, status, org_id, author_id, created_at, target_date, cause')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .in('status', ['planning', 'active'])
      .or('volunteers_needed.gt.0,seeking_partners.eq.true,fundraising_goal.not.is.null')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const posts = postsResult.data || []
  const events = eventsResult.data || []
  const projects = projectsResult.data || []

  // Collect all author IDs
  const authorIds = new Set<string>()
  const orgIds = new Set<string>()

  posts.forEach((p: Record<string, unknown>) => {
    if (p.author_id) authorIds.add(p.author_id as string)
  })
  events.forEach((e: Record<string, unknown>) => {
    if (e.organizer_id) authorIds.add(e.organizer_id as string)
    if (e.org_id) orgIds.add(e.org_id as string)
  })
  projects.forEach((p: Record<string, unknown>) => {
    if (p.author_id) authorIds.add(p.author_id as string)
    if (p.org_id) orgIds.add(p.org_id as string)
  })

  // Batch fetch profiles
  const { data: profilesData } = authorIds.size > 0
    ? await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, organization_id')
        .in('user_id', Array.from(authorIds))
    : { data: null }

  // Batch fetch organizations
  const { data: orgsData } = orgIds.size > 0
    ? await supabase
        .from('organizations')
        .select('id, name')
        .in('id', Array.from(orgIds))
    : { data: null }

  const profilesMap = new Map((profilesData as ProfileData[] | null)?.map(p => [p.user_id, p]) || [])
  const orgsMap = new Map((orgsData as OrgData[] | null)?.map(o => [o.id, o]) || [])

  const opportunities: OpportunityItem[] = []

  // Transform posts
  posts.forEach((post: Record<string, unknown>) => {
    const profile = profilesMap.get(post.author_id as string)
    const types = determineOpportunityTypes('post', post)

    opportunities.push({
      id: `post-${post.id}`,
      source: 'post',
      sourceId: post.id as string,
      title: (post.title as string) || 'Opportunity',
      description: (post.description as string) || '',
      opportunityTypes: types,
      author: {
        id: (post.author_id as string) || '',
        name: profile?.full_name || 'Team Member',
        avatar: profile?.avatar_url || null,
      },
      createdAt: post.created_at as string,
      timeAgo: formatDistanceToNow(new Date(post.created_at as string), { addSuffix: true }),
      orgId: post.org_id as string,
      imageUrl: post.image_url as string | null,
      rotation: generateRotation(post.id as string),
    })
  })

  // Transform events
  events.forEach((event: Record<string, unknown>) => {
    const profile = profilesMap.get(event.organizer_id as string)
    const org = orgsMap.get(event.org_id as string)
    const types = determineOpportunityTypes('event', event)

    opportunities.push({
      id: `event-${event.id}`,
      source: 'event',
      sourceId: event.id as string,
      title: event.title as string,
      description: (event.description as string) || '',
      opportunityTypes: types,
      author: {
        id: (event.organizer_id as string) || '',
        name: profile?.full_name || 'Organizer',
        avatar: profile?.avatar_url || null,
        organization: org?.name,
      },
      createdAt: event.created_at as string,
      timeAgo: formatDistanceToNow(new Date(event.created_at as string), { addSuffix: true }),
      orgId: event.org_id as string,
      startDate: event.start_time as string | null,
      location: event.location as string | null,
      volunteersNeeded: event.volunteers_needed as number | null,
      rotation: generateRotation(event.id as string),
    })
  })

  // Transform projects
  projects.forEach((project: Record<string, unknown>) => {
    const profile = profilesMap.get(project.author_id as string)
    const org = orgsMap.get(project.org_id as string)
    const types = determineOpportunityTypes('project', project)

    opportunities.push({
      id: `project-${project.id}`,
      source: 'project',
      sourceId: project.id as string,
      title: project.title as string,
      description: (project.description as string) || '',
      opportunityTypes: types,
      author: {
        id: (project.author_id as string) || '',
        name: profile?.full_name || 'Project Lead',
        avatar: profile?.avatar_url || null,
        organization: org?.name,
      },
      createdAt: project.created_at as string,
      timeAgo: formatDistanceToNow(new Date(project.created_at as string), { addSuffix: true }),
      orgId: project.org_id as string,
      targetDate: project.target_date as string | null,
      volunteersNeeded: project.volunteers_needed as number | null,
      fundingGoal: project.fundraising_goal as string | null,
      status: project.status as string | null,
      rotation: generateRotation(project.id as string),
    })
  })

  // Sort by created date (most recent first)
  opportunities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Calculate counts
  const counts: OpportunityCounts = {
    all: opportunities.length,
    jobs: opportunities.filter(o => o.opportunityTypes.includes('job')).length,
    volunteering: opportunities.filter(o => o.opportunityTypes.includes('volunteering')).length,
    collaboration: opportunities.filter(o => o.opportunityTypes.includes('collaboration')).length,
    funding: opportunities.filter(o => o.opportunityTypes.includes('funding')).length,
  }

  return { opportunities, counts }
}
