/**
 * Meeting Notes Queries (Task 3.13)
 * Query helpers for fetching meeting notes and action items
 */

import type {
  MeetingNote,
  ActionItem,
  GetMeetingNotesOptions,
  GetActionItemsOptions
} from '@/lib/meeting-notes/types'

// Use any for Supabase client to avoid complex type inference issues
// eslint-disable-next-line
type SupabaseClientAny = any

/**
 * Get meeting notes for an organization
 */
export async function getMeetingNotes(
  supabase: SupabaseClientAny,
  orgId: string,
  options: GetMeetingNotesOptions = {}
): Promise<{ data: MeetingNote[]; error: string | null }> {
  const { limit = 20, offset = 0, status, tags } = options

  try {
    let query = supabase
      .from('meeting_notes')
      .select(`
        *,
        author:user_profiles!meeting_notes_author_id_fkey(user_id, full_name, avatar_url),
        organization:organizations!meeting_notes_org_id_fkey(id, name, logo_url)
      `)
      .eq('org_id', orgId)
      .order('meeting_date', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    } else {
      // Default to published notes only
      query = query.eq('status', 'published')
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getMeetingNotes] Error:', error)
      return { data: [], error: error.message }
    }

    // Get action item counts for each note
    const noteIds = (data || []).map((n: any) => n.id)
    if (noteIds.length > 0) {
      const { data: counts } = await supabase
        .from('action_items')
        .select('note_id')
        .in('note_id', noteIds)

      const countMap: Record<string, number> = {}
      for (const item of counts || []) {
        countMap[item.note_id] = (countMap[item.note_id] || 0) + 1
      }

      for (const note of data || []) {
        (note as any).action_item_count = countMap[note.id] || 0
      }
    }

    return { data: data as MeetingNote[], error: null }
  } catch (error) {
    console.error('[getMeetingNotes] Exception:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get a single meeting note by ID with action items
 */
export async function getMeetingNoteById(
  supabase: SupabaseClientAny,
  noteId: string
): Promise<{ data: MeetingNote | null; error: string | null }> {
  try {
    const { data: note, error: noteError } = await supabase
      .from('meeting_notes')
      .select(`
        *,
        author:user_profiles!meeting_notes_author_id_fkey(user_id, full_name, avatar_url),
        organization:organizations!meeting_notes_org_id_fkey(id, name, logo_url)
      `)
      .eq('id', noteId)
      .single()

    if (noteError) {
      console.error('[getMeetingNoteById] Error fetching note:', noteError)
      return { data: null, error: noteError.message }
    }

    // Fetch action items for this note
    const { data: actionItems, error: actionItemsError } = await supabase
      .from('action_items')
      .select(`
        *,
        assignee:user_profiles(user_id, full_name, avatar_url)
      `)
      .eq('note_id', noteId)
      .order('created_at', { ascending: true })

    if (actionItemsError) {
      console.error('[getMeetingNoteById] Error fetching action items:', actionItemsError)
    }

    const result: MeetingNote = {
      ...note,
      action_items: (actionItems || []) as ActionItem[],
      action_item_count: actionItems?.length || 0
    }

    return { data: result, error: null }
  } catch (error) {
    console.error('[getMeetingNoteById] Exception:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all action items for an organization
 */
export async function getActionItems(
  supabase: SupabaseClientAny,
  orgId: string,
  options: GetActionItemsOptions = {}
): Promise<{ data: ActionItem[]; error: string | null }> {
  const { limit = 50, offset = 0, status, includeCompleted = false } = options

  try {
    let query = supabase
      .from('action_items')
      .select(`
        *,
        assignee:user_profiles(user_id, full_name, avatar_url),
        meeting_note:meeting_notes!action_items_note_id_fkey(id, title, meeting_date, org_id)
      `)
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    } else if (!includeCompleted) {
      query = query.in('status', ['open', 'in_progress'])
    }

    const { data, error } = await query

    if (error) {
      console.error('[getActionItems] Error:', error)
      return { data: [], error: error.message }
    }

    // Filter by org_id through the meeting_note relationship
    const filteredData = (data || []).filter(
      (item: any) => item.meeting_note?.org_id === orgId
    )

    return { data: filteredData as ActionItem[], error: null }
  } catch (error) {
    console.error('[getActionItems] Exception:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get action items assigned to a specific user
 */
export async function getMyActionItems(
  supabase: SupabaseClientAny,
  userId: string,
  options: GetActionItemsOptions = {}
): Promise<{ data: ActionItem[]; error: string | null }> {
  const { limit = 50, offset = 0, status, includeCompleted = false } = options

  try {
    let query = supabase
      .from('action_items')
      .select(`
        *,
        meeting_note:meeting_notes!action_items_note_id_fkey(id, title, meeting_date)
      `)
      .eq('assigned_to', userId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    } else if (!includeCompleted) {
      query = query.in('status', ['open', 'in_progress'])
    }

    const { data, error } = await query

    if (error) {
      console.error('[getMyActionItems] Error:', error)
      return { data: [], error: error.message }
    }

    return { data: (data || []) as ActionItem[], error: null }
  } catch (error) {
    console.error('[getMyActionItems] Exception:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get adjacent meeting notes for navigation
 */
export async function getAdjacentMeetingNotes(
  supabase: SupabaseClientAny,
  noteId: string,
  orgId: string
): Promise<{
  previous: { id: string; title: string } | null
  next: { id: string; title: string } | null
  error: string | null
}> {
  try {
    // Get the current note's meeting_date
    const { data: currentNote } = await supabase
      .from('meeting_notes')
      .select('meeting_date')
      .eq('id', noteId)
      .single()

    if (!currentNote) {
      return { previous: null, next: null, error: 'Note not found' }
    }

    const meetingDate = currentNote.meeting_date

    // Get previous note (earlier date)
    const { data: prevData } = await supabase
      .from('meeting_notes')
      .select('id, title')
      .eq('org_id', orgId)
      .eq('status', 'published')
      .lt('meeting_date', meetingDate)
      .order('meeting_date', { ascending: false })
      .limit(1)
      .single()

    // Get next note (later date)
    const { data: nextData } = await supabase
      .from('meeting_notes')
      .select('id, title')
      .eq('org_id', orgId)
      .eq('status', 'published')
      .gt('meeting_date', meetingDate)
      .order('meeting_date', { ascending: true })
      .limit(1)
      .single()

    return {
      previous: prevData || null,
      next: nextData || null,
      error: null
    }
  } catch (error) {
    console.error('[getAdjacentMeetingNotes] Exception:', error)
    return {
      previous: null,
      next: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
