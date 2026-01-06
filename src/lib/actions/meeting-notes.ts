'use server'

/**
 * Meeting Notes Server Actions (Task 3.13)
 * Server actions for managing meeting notes and action items
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Mark an action item as completed
 */
export async function completeActionItem(actionItemId: string) {
  const supabase = await createClient()

  try {
    const { error } = await (supabase
      .from('action_items') as any)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', actionItemId)

    if (error) {
      console.error('[completeActionItem] Error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[completeActionItem] Completed action item ${actionItemId}`)
    return { success: true }
  } catch (error) {
    console.error('[completeActionItem] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update an action item's status
 */
export async function updateActionItemStatus(
  actionItemId: string,
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
) {
  const supabase = await createClient()

  try {
    const updateData: Record<string, string | null> = { status }

    // Clear completed_at if reopening, set it if completing
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (status === 'open' || status === 'in_progress') {
      updateData.completed_at = null
    }

    const { error } = await (supabase
      .from('action_items') as any)
      .update(updateData)
      .eq('id', actionItemId)

    if (error) {
      console.error('[updateActionItemStatus] Error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[updateActionItemStatus] Updated action item ${actionItemId} to ${status}`)
    return { success: true }
  } catch (error) {
    console.error('[updateActionItemStatus] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Assign an action item to a user
 */
export async function assignActionItem(
  actionItemId: string,
  userId: string | null
) {
  const supabase = await createClient()

  try {
    const { error } = await (supabase
      .from('action_items') as any)
      .update({ assigned_to: userId })
      .eq('id', actionItemId)

    if (error) {
      console.error('[assignActionItem] Error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[assignActionItem] Assigned action item ${actionItemId} to ${userId || 'nobody'}`)
    return { success: true }
  } catch (error) {
    console.error('[assignActionItem] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a meeting note (for API import)
 */
export async function createMeetingNote(params: {
  title: string
  content: string | null
  meeting_date: string | null
  org_id: string
  author_id: string
  tags?: string[] | null
  status?: 'draft' | 'published' | 'archived'
}) {
  const supabase = await createClient()

  try {
    const { data, error } = await (supabase
      .from('meeting_notes') as any)
      .insert({
        title: params.title,
        content: params.content,
        meeting_date: params.meeting_date,
        org_id: params.org_id,
        author_id: params.author_id,
        tags: params.tags || null,
        status: params.status || 'published',
        published_at: params.status === 'published' ? new Date().toISOString() : null
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createMeetingNote] Error:', error)
      return { success: false, data: null, error: error.message }
    }

    console.log(`[createMeetingNote] Created meeting note ${data?.id}`)
    return { success: true, data, error: null }
  } catch (error) {
    console.error('[createMeetingNote] Exception:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create action items for a meeting note (for API import)
 */
export async function createActionItems(
  noteId: string,
  items: Array<{
    title: string
    description?: string | null
    due_date?: string | null
    assigned_to?: string | null
  }>
) {
  const supabase = await createClient()

  try {
    const insertData = items.map(item => ({
      note_id: noteId,
      title: item.title,
      description: item.description || null,
      due_date: item.due_date || null,
      assigned_to: item.assigned_to || null,
      status: 'open' as const
    }))

    const { data, error } = await (supabase
      .from('action_items') as any)
      .insert(insertData)
      .select('id')

    if (error) {
      console.error('[createActionItems] Error:', error)
      return { success: false, count: 0, error: error.message }
    }

    console.log(`[createActionItems] Created ${data?.length || 0} action items for note ${noteId}`)
    return { success: true, count: data?.length || 0, error: null }
  } catch (error) {
    console.error('[createActionItems] Exception:', error)
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Archive a meeting note
 */
export async function archiveMeetingNote(noteId: string) {
  const supabase = await createClient()

  try {
    const { error } = await (supabase
      .from('meeting_notes') as any)
      .update({ status: 'archived' })
      .eq('id', noteId)

    if (error) {
      console.error('[archiveMeetingNote] Error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[archiveMeetingNote] Archived meeting note ${noteId}`)
    return { success: true }
  } catch (error) {
    console.error('[archiveMeetingNote] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
