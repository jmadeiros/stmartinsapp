'use server'

import { createClient } from "@/lib/supabase/server"
import type { FeedItem, EventPost, ProjectPost, FeedPost } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export async function getFeedData(orgId: string): Promise<FeedItem[]> {
  const supabase = await createClient()

  console.log('[getFeedData] Fetching feed for org:', orgId)

  // Fetch posts
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('[getFeedData] Posts:', postsData?.length || 0, 'Error:', postsError)

  // Fetch events
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('[getFeedData] Events:', eventsData?.length || 0, 'Error:', eventsError)

  // Fetch projects
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('[getFeedData] Projects:', projectsData?.length || 0, 'Error:', projectsError)

  if (postsError) console.error('Error fetching posts:', postsError)
  if (eventsError) console.error('Error fetching events:', eventsError)
  if (projectsError) console.error('Error fetching projects:', projectsError)

  // Get all unique author IDs and org IDs
  const authorIds = new Set<string>()
  const orgIds = new Set<string>()

  postsData?.forEach((post: any) => authorIds.add(post.author_id))
  eventsData?.forEach((event: any) => {
    authorIds.add(event.organizer_id)
    event.collaborating_orgs?.forEach((orgId: string) => orgIds.add(orgId))
  })
  projectsData?.forEach((project: any) => {
    authorIds.add(project.author_id)
    project.collaborators?.forEach((orgId: string) => orgIds.add(orgId))
  })

  // Fetch all profiles
  const { data: profilesData } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, avatar_url, contact_email')
    .in('user_id', Array.from(authorIds))

  // Fetch all organizations
  const { data: organizationsData } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .in('id', Array.from(orgIds))

  // Create profile lookup map
  const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || [])

  // Create organizations lookup map
  const organizationsMap = new Map(organizationsData?.map(o => [o.id, o]) || [])

  // Transform posts
  const posts: FeedPost[] = (postsData || []).map((post: any) => {
    const profile = profilesMap.get(post.author_id)
    return {
      id: post.id,
      type: 'post' as const,
      author: {
        name: profile?.full_name || 'Unknown User',
        handle: `@${profile?.contact_email?.split('@')[0] || 'unknown'}`,
        avatar: profile?.avatar_url || '/placeholder.svg',
        organization: 'St Martins Village',
      },
      title: post.title,
      content: post.content,
      category: post.category,
      linkedEventId: post.linked_event_id,
      linkedProjectId: post.linked_project_id,
      cause: post.cause,
      image: post.image_url,
      timeAgo: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
      likes: 0,
      comments: 0,
    }
  })

  // Transform events
  const events: EventPost[] = (eventsData || []).map((event: any) => {
    const profile = profilesMap.get(event.organizer_id)

    // Format date and time
    const startDate = new Date(event.start_time)
    const endDate = new Date(event.end_time)
    const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const startTimeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    // Map collaborating_orgs to Collaboration type
    const collaborations = (event.collaborating_orgs || []).map((orgId: string) => {
      const org = organizationsMap.get(orgId)
      return {
        organization: org?.name || 'Unknown Organization',
        avatar: org?.logo_url || '/placeholder.svg',
      }
    })

    return {
      id: event.id,
      type: 'event' as const,
      author: {
        name: profile?.full_name || 'Unknown User',
        handle: `@${profile?.contact_email?.split('@')[0] || 'unknown'}`,
        avatar: profile?.avatar_url || '/placeholder.svg',
        organization: 'St Martins Village',
      },
      collaborations,
      title: event.title,
      description: event.description || '',
      date: dateStr,
      time: `${startTimeStr} - ${endTimeStr}`,
      location: event.location || 'TBD',
      cause: event.cause,
      parentProjectId: event.parent_project_id,
      needs: {
        volunteersNeeded: event.volunteers_needed || undefined,
        seekingPartners: event.seeking_partners || undefined,
      },
      timeAgo: formatDistanceToNow(new Date(event.created_at), { addSuffix: true }),
      participantsReferred: event.participants_referred,
    }
  })

  // Transform projects
  const projects: ProjectPost[] = (projectsData || []).map((project: any) => {
    const profile = profilesMap.get(project.author_id)

    // Map collaborators to Collaboration type
    const collaborations = (project.collaborators || []).map((orgId: string) => {
      const org = organizationsMap.get(orgId)
      return {
        organization: org?.name || 'Unknown Organization',
        avatar: org?.logo_url || '/placeholder.svg',
      }
    })

    return {
      id: project.id,
      type: 'project' as const,
      author: {
        name: profile?.full_name || 'Unknown User',
        handle: `@${profile?.contact_email?.split('@')[0] || 'unknown'}`,
        avatar: profile?.avatar_url || '/placeholder.svg',
        organization: 'St Martins Village',
      },
      collaborations,
      title: project.title,
      description: project.description,
      impactGoal: project.impact_goal || project.description,
      cause: project.cause,
      targetDate: project.target_date ? new Date(project.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
      serviceArea: project.service_area,
      partnerOrgs: project.partner_orgs || undefined,
      interestedOrgs: project.interested_orgs || undefined,
      needs: {
        volunteersNeeded: project.volunteers_needed || undefined,
        fundraisingGoal: project.fundraising_goal || undefined,
        seekingPartners: project.seeking_partners || undefined,
      },
      progress: project.progress_target ? {
        current: project.progress_current || 0,
        target: project.progress_target,
        unit: project.progress_unit || 'items',
        lastUpdated: formatDistanceToNow(new Date(project.updated_at), { addSuffix: true }),
      } : undefined,
      timeAgo: formatDistanceToNow(new Date(project.created_at), { addSuffix: true }),
      participantsReferred: project.participants_referred,
    }
  })

  // Combine and sort all items by creation date
  const allItems: FeedItem[] = [
    ...posts,
    ...events,
    ...projects,
  ]

  // Sort by created_at timestamp (we need to extract it from timeAgo or store timestamps)
  // For now, items are already sorted within their type, and we're interleaving them
  return allItems
}
