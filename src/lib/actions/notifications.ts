'use server'

import { createClient } from "@/lib/supabase/server"

/**
 * Get the count of unread notifications for the current user
 */
export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient()

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      return { success: false, error: error.message, count: 0 }
    }

    return { success: true, count: count || 0, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    }
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  try {
    const { error } = await (supabase
      .from('notifications') as any)
      .update({
        read: true
      })
      .eq('id', notificationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = await createClient()

  try {
    const { error } = await (supabase
      .from('notifications') as any)
      .update({
        read: true
      })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(userId: string, options?: {
  limit?: number
  unreadOnly?: boolean
}) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq('read', false)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}
