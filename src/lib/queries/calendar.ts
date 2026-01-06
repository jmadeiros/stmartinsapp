import type { Database } from '@/lib/database.types'
import type { CalendarEvent, CalendarEventKind, CalendarAttendee } from '@/components/calendar/monthly-calendar'

// Use 'any' to accept both browser and server client types
type Client = any

// Map database event_category to calendar kind
const categoryToKind: Record<string, CalendarEventKind> = {
  meeting: 'meeting',
  social: 'partner',
  workshop: 'workshop',
  building_event: 'milestone',
  other: 'work',
}

/**
 * Fetch all events for a given month range (building-wide view)
 * Does NOT filter by org - shows ALL events in the building
 */
export async function getCalendarEventsForMonth(
  supabase: Client,
  year: number,
  month: number // 0-indexed (0 = January)
) {
  // Calculate the start and end of the month
  // We fetch a bit extra to show events that span across month boundaries
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999) // Last day of month

  // Extend range to include events from previous/next week for calendar display
  const rangeStart = new Date(startDate)
  rangeStart.setDate(rangeStart.getDate() - 7)

  const rangeEnd = new Date(endDate)
  rangeEnd.setDate(rangeEnd.getDate() + 7)

  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      start_time,
      end_time,
      location,
      virtual_link,
      category,
      organizer_id,
      org_id,
      seeking_partners,
      volunteers_needed,
      cause,
      created_at
    `)
    .gte('start_time', rangeStart.toISOString())
    .lte('start_time', rangeEnd.toISOString())
    .is('deleted_at', null)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('[getCalendarEventsForMonth] Error fetching events:', error)
    return { data: null, error }
  }

  return { data: events, error: null }
}

/**
 * Fetch event RSVPs for a list of event IDs
 */
export async function getEventRsvps(
  supabase: Client,
  eventIds: string[]
) {
  if (eventIds.length === 0) {
    return { data: [], error: null }
  }

  const { data: rsvps, error } = await supabase
    .from('event_rsvps')
    .select(`
      event_id,
      user_id,
      status,
      org_id
    `)
    .in('event_id', eventIds)

  if (error) {
    console.error('[getEventRsvps] Error fetching RSVPs:', error)
    return { data: null, error }
  }

  return { data: rsvps ?? [], error: null }
}

/**
 * Fetch organizer profiles for a list of user IDs
 */
export async function getOrganizerProfiles(
  supabase: Client,
  userIds: string[]
) {
  if (userIds.length === 0) {
    return { data: [], error: null }
  }

  const uniqueIds = Array.from(new Set(userIds))

  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select(`
      user_id,
      full_name,
      avatar_url,
      contact_email,
      contact_phone,
      job_title,
      organization_id
    `)
    .in('user_id', uniqueIds)

  if (error) {
    console.error('[getOrganizerProfiles] Error fetching profiles:', error)
    return { data: null, error }
  }

  return { data: profiles ?? [], error: null }
}

/**
 * Fetch organization names for display
 */
export async function getOrganizations(
  supabase: Client,
  orgIds: string[]
) {
  if (orgIds.length === 0) {
    return { data: [], error: null }
  }

  const uniqueIds = Array.from(new Set(orgIds))

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      logo_url
    `)
    .in('id', uniqueIds)

  if (error) {
    console.error('[getOrganizations] Error fetching organizations:', error)
    return { data: null, error }
  }

  return { data: orgs ?? [], error: null }
}

/**
 * Transform database events into CalendarEvent format
 */
export function transformEventsToCalendarFormat(
  dbEvents: NonNullable<Awaited<ReturnType<typeof getCalendarEventsForMonth>>['data']>,
  profiles: NonNullable<Awaited<ReturnType<typeof getOrganizerProfiles>>['data']>,
  organizations: NonNullable<Awaited<ReturnType<typeof getOrganizations>>['data']>,
  rsvps: NonNullable<Awaited<ReturnType<typeof getEventRsvps>>['data']>,
  currentUserId?: string
): CalendarEvent[] {
  // Create lookup maps
  const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]))
  const orgMap = new Map(organizations.map((o: any) => [o.id, o]))

  // Group RSVPs by event
  const rsvpsByEvent = new Map<string, typeof rsvps>()
  for (const rsvp of rsvps) {
    const existing = rsvpsByEvent.get(rsvp.event_id) ?? []
    existing.push(rsvp)
    rsvpsByEvent.set(rsvp.event_id, existing)
  }

  return dbEvents.map((event: any) => {
    const organizer = profileMap.get(event.organizer_id) as any
    const org = orgMap.get(event.org_id) as any
    const eventRsvps = rsvpsByEvent.get(event.id) ?? []

    // Build attendees from RSVPs
    const attendees: CalendarAttendee[] = eventRsvps.map((rsvp: any) => {
      const profile = profileMap.get(rsvp.user_id) as any
      return {
        id: rsvp.user_id,
        name: profile?.full_name ?? 'Unknown',
        email: profile?.contact_email ?? '',
        avatar: profile?.avatar_url ?? undefined,
        status: rsvp.status === 'going' ? 'yes' : rsvp.status === 'not_going' ? 'no' : 'maybe',
        isYou: rsvp.user_id === currentUserId,
        isOrganizer: rsvp.user_id === event.organizer_id,
      }
    })

    // Add organizer as attendee if not already in RSVPs
    if (organizer && !attendees.some(a => a.id === event.organizer_id)) {
      attendees.unshift({
        id: event.organizer_id,
        name: organizer.full_name,
        email: organizer.contact_email ?? '',
        avatar: organizer.avatar_url ?? undefined,
        status: 'yes',
        isOrganizer: true,
        isYou: event.organizer_id === currentUserId,
        role: organizer.job_title ?? undefined,
      })
    }

    // Determine meeting platform from virtual_link
    let meetingPlatform: string | undefined
    if (event.virtual_link) {
      if (event.virtual_link.includes('zoom.us')) meetingPlatform = 'Zoom'
      else if (event.virtual_link.includes('meet.google.com')) meetingPlatform = 'Google Meet'
      else if (event.virtual_link.includes('teams.microsoft.com')) meetingPlatform = 'Microsoft Teams'
      else meetingPlatform = 'Video Call'
    }

    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      description: event.description ?? undefined,
      start: event.start_time,
      end: event.end_time,
      location: event.location ?? (event.virtual_link ? 'Virtual' : undefined),
      meetingUrl: event.virtual_link ?? undefined,
      meetingPlatform,
      organizer: {
        name: organizer?.full_name ?? org?.name ?? 'Unknown Organizer',
        email: organizer?.contact_email ?? '',
        phone: organizer?.contact_phone ?? undefined,
        avatar: organizer?.avatar_url ?? undefined,
      },
      attendees,
      kind: categoryToKind[event.category] ?? 'work',
      tags: event.cause ? [event.cause] : undefined,
      notes: event.seeking_partners
        ? `Seeking partners! ${event.volunteers_needed ? `Volunteers needed: ${event.volunteers_needed}` : ''}`
        : undefined,
    }

    return calendarEvent
  })
}

/**
 * Main function to fetch and transform calendar events
 * This is the primary export for the calendar page
 */
export async function getCalendarEvents(
  supabase: Client,
  year: number,
  month: number,
  currentUserId?: string
): Promise<{ data: CalendarEvent[] | null; error: Error | null }> {
  try {
    // Fetch events for the month
    const { data: dbEvents, error: eventsError } = await getCalendarEventsForMonth(supabase, year, month)

    if (eventsError || !dbEvents) {
      return { data: null, error: eventsError ?? new Error('Failed to fetch events') }
    }

    if (dbEvents.length === 0) {
      return { data: [], error: null }
    }

    // Collect all unique IDs we need to fetch
    const organizerIds = dbEvents.map((e: any) => e.organizer_id)
    const orgIds = dbEvents.map((e: any) => e.org_id)
    const eventIds = dbEvents.map((e: any) => e.id)

    // First fetch RSVPs and orgs (we need RSVPs to know which user profiles to fetch)
    const [orgsResult, rsvpsResult] = await Promise.all([
      getOrganizations(supabase, orgIds),
      getEventRsvps(supabase, eventIds),
    ])

    // Collect ALL user IDs we need profiles for (organizers + RSVP users)
    const rsvpUserIds = (rsvpsResult.data ?? []).map((r: any) => r.user_id)
    const allUserIds = Array.from(new Set([...organizerIds, ...rsvpUserIds]))

    // Now fetch all needed profiles
    const profilesResult = await getOrganizerProfiles(supabase, allUserIds)

    // Transform to calendar format
    const calendarEvents = transformEventsToCalendarFormat(
      dbEvents,
      profilesResult.data ?? [],
      orgsResult.data ?? [],
      rsvpsResult.data ?? [],
      currentUserId
    )

    return { data: calendarEvents, error: null }
  } catch (error) {
    console.error('[getCalendarEvents] Exception:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error fetching calendar events')
    }
  }
}
