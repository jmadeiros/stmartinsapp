/**
 * Meeting Notes Types (Task 3.13)
 * Types for the meeting notes feature imported from Granola via Zapier
 */

export type MeetingNoteStatus = 'draft' | 'published' | 'archived'
export type ActionItemStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface MeetingNote {
  id: string
  title: string
  content: string | null
  meeting_date: string | null
  status: MeetingNoteStatus
  tags: string[] | null
  org_id: string
  author_id: string
  linked_event_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  author?: {
    user_id: string
    full_name: string
    avatar_url?: string | null
  } | null
  organization?: {
    id: string
    name: string
    logo_url?: string | null
  } | null
  action_items?: ActionItem[]
  action_item_count?: number
}

export interface ActionItem {
  id: string
  note_id: string
  title: string
  description: string | null
  due_date: string | null
  status: ActionItemStatus
  assigned_to: string | null
  completed_at: string | null
  created_at: string
  // Joined data
  assignee?: {
    user_id: string
    full_name: string
    avatar_url?: string | null
  } | null
  meeting_note?: {
    id: string
    title: string
    meeting_date: string | null
  } | null
}

// API Import Types (for Zapier webhook)
export interface MeetingNotesImportRequest {
  meeting_date: string
  title: string
  summary: string
  action_items?: Array<{
    title: string
    description?: string
    due_date?: string
    assigned_to?: string // Email or name - for future matching
  }>
  tags?: string[]
  org_id?: string // Optional - can be inferred from API key config
}

export interface MeetingNotesImportResponse {
  success: boolean
  meeting_note_id?: string
  action_items_created?: number
  error?: string
}

// Query options
export interface GetMeetingNotesOptions {
  limit?: number
  offset?: number
  status?: MeetingNoteStatus
  tags?: string[]
}

export interface GetActionItemsOptions {
  limit?: number
  offset?: number
  status?: ActionItemStatus
  includeCompleted?: boolean
}
