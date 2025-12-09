'use server'

import { createClient } from "@/lib/supabase/server"
import type { FeedItem, EventPost, ProjectPost, FeedPost } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

// Mock data for demo purposes
const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: 'event-1',
    type: 'event',
    author: {
      name: 'Sarah Chen',
      handle: '@sarahchen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      organization: 'St Martins',
    },
    collaborations: [
      { organization: 'Hope Kitchen', avatar: '/placeholder.svg' },
      { organization: 'Youth Forward', avatar: '/placeholder.svg' },
    ],
    title: 'Community Food Drive & Distribution',
    description: 'Join us for our monthly food drive! We\'ll be collecting non-perishable items and distributing them to families in need. Volunteers welcome!',
    date: 'Dec 15, 2024',
    time: '10:00 AM - 2:00 PM',
    location: 'St Martins Community Centre',
    cause: 'Food Security',
    needs: {
      volunteersNeeded: 12,
      seekingPartners: true,
    },
    timeAgo: '2 hours ago',
  },
  {
    id: 'project-1',
    type: 'project',
    author: {
      name: 'Marcus Johnson',
      handle: '@marcusj',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      organization: 'St Martins',
    },
    collaborations: [
      { organization: 'Green Spaces Trust', avatar: '/placeholder.svg' },
    ],
    title: 'Urban Garden Initiative',
    description: 'Creating community gardens in underserved areas to provide fresh produce and green spaces for local residents.',
    impactGoal: 'Establish 5 community gardens serving 500+ families',
    cause: 'Environment',
    targetDate: 'March 2025',
    serviceArea: 'West London',
    needs: {
      volunteersNeeded: 20,
      fundraisingGoal: 15000,
      seekingPartners: true,
    },
    progress: {
      current: 2,
      target: 5,
      unit: 'gardens',
      lastUpdated: '3 days ago',
    },
    timeAgo: '1 day ago',
  },
  {
    id: 'post-1',
    type: 'post',
    author: {
      name: 'Emma Williams',
      handle: '@emmaw',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      organization: 'St Martins',
    },
    title: 'Milestone Reached!',
    content: '🎉 Incredible news! We\'ve just served our 10,000th meal at the community kitchen this year. Thank you to all our amazing volunteers and donors who make this possible. Together, we\'re making a real difference in our community.',
    category: 'milestone',
    cause: 'Food Security',
    timeAgo: '3 hours ago',
    likes: 47,
    comments: 12,
  },
  {
    id: 'event-2',
    type: 'event',
    author: {
      name: 'Priya Patel',
      handle: '@priyap',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      organization: 'Youth Forward',
    },
    title: 'Youth Mentorship Workshop',
    description: 'A hands-on workshop connecting young people with industry professionals. Learn about career paths, build your network, and get inspired!',
    date: 'Dec 18, 2024',
    time: '2:00 PM - 5:00 PM',
    location: 'Youth Forward Centre',
    cause: 'Youth Development',
    needs: {
      volunteersNeeded: 8,
    },
    timeAgo: '5 hours ago',
  },
  {
    id: 'project-2',
    type: 'project',
    author: {
      name: 'David Okonkwo',
      handle: '@davido',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      organization: 'Hope Kitchen',
    },
    title: 'Mobile Meal Service Expansion',
    description: 'Expanding our meal delivery service to reach housebound elderly residents who cannot access our community kitchen.',
    impactGoal: 'Deliver 500 meals weekly to housebound residents',
    cause: 'Food Security',
    targetDate: 'February 2025',
    needs: {
      volunteersNeeded: 15,
      fundraisingGoal: 8000,
      resourcesRequested: ['Delivery van', 'Insulated food containers'],
    },
    progress: {
      current: 200,
      target: 500,
      unit: 'meals/week',
      lastUpdated: '1 week ago',
    },
    timeAgo: '2 days ago',
  },
  {
    id: 'post-2',
    type: 'post',
    author: {
      name: 'James Morrison',
      handle: '@jamesm',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      organization: 'St Martins',
    },
    title: 'Volunteer Spotlight',
    content: 'Shoutout to our incredible volunteer team who put in 200+ hours this month! Special thanks to the weekend crew who helped reorganize our donation storage. You make everything we do possible. 💪',
    category: 'shoutout',
    timeAgo: '6 hours ago',
    likes: 34,
    comments: 8,
  },
  {
    id: 'event-3',
    type: 'event',
    author: {
      name: 'Tom Richardson',
      handle: '@tomr',
      avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
      organization: 'Green Spaces Trust',
    },
    title: 'Winter Tree Planting Day',
    description: 'Help us plant 100 trees in the local park! All equipment provided. Bring warm clothes and a willingness to get your hands dirty.',
    date: 'Dec 20, 2024',
    time: '9:00 AM - 1:00 PM',
    location: 'Riverside Park',
    cause: 'Environment',
    needs: {
      volunteersNeeded: 25,
    },
    timeAgo: '1 day ago',
  },
]

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

  // Mock profiles for when real profiles aren't found
  const mockProfiles = [
    { name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', handle: 'sarahchen' },
    { name: 'Marcus Johnson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', handle: 'marcusj' },
    { name: 'Emma Williams', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', handle: 'emmaw' },
    { name: 'David Okonkwo', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', handle: 'davido' },
    { name: 'Priya Patel', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', handle: 'priyap' },
    { name: 'James Morrison', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', handle: 'jamesm' },
    { name: 'Tom Richardson', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face', handle: 'tomr' },
    { name: 'Sophie Martin', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', handle: 'sophiem' },
  ]
  let mockProfileIndex = 0
  const getNextMockProfile = () => {
    const profile = mockProfiles[mockProfileIndex % mockProfiles.length]
    mockProfileIndex++
    return profile
  }

  // Transform posts
  const posts: FeedPost[] = (postsData || []).map((post: any) => {
    const profile = profilesMap.get(post.author_id)
    const mockProfile = !profile ? getNextMockProfile() : null
    return {
      id: post.id,
      type: 'post' as const,
      author: {
        name: profile?.full_name || mockProfile?.name || 'Team Member',
        handle: `@${profile?.contact_email?.split('@')[0] || mockProfile?.handle || 'team'}`,
        avatar: profile?.avatar_url || mockProfile?.avatar || '/placeholder.svg',
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
    const mockProfile = !profile ? getNextMockProfile() : null

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
        organization: org?.name || 'Partner Organization',
        avatar: org?.logo_url || '/placeholder.svg',
      }
    })

    return {
      id: event.id,
      type: 'event' as const,
      author: {
        name: profile?.full_name || mockProfile?.name || 'Team Member',
        handle: `@${profile?.contact_email?.split('@')[0] || mockProfile?.handle || 'team'}`,
        avatar: profile?.avatar_url || mockProfile?.avatar || '/placeholder.svg',
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
    const mockProfile = !profile ? getNextMockProfile() : null

    // Map collaborators to Collaboration type
    const collaborations = (project.collaborators || []).map((orgId: string) => {
      const org = organizationsMap.get(orgId)
      return {
        organization: org?.name || 'Partner Organization',
        avatar: org?.logo_url || '/placeholder.svg',
      }
    })

    return {
      id: project.id,
      type: 'project' as const,
      author: {
        name: profile?.full_name || mockProfile?.name || 'Team Member',
        handle: `@${profile?.contact_email?.split('@')[0] || mockProfile?.handle || 'team'}`,
        avatar: profile?.avatar_url || mockProfile?.avatar || '/placeholder.svg',
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

  // Return mock data if no real data exists
  if (allItems.length === 0) {
    console.log('[getFeedData] No real data found, returning mock data')
    return MOCK_FEED_ITEMS
  }

  // Sort by created_at timestamp (we need to extract it from timeAgo or store timestamps)
  // For now, items are already sorted within their type, and we're interleaving them
  return allItems
}
