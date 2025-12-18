'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/database.types"

export type NotificationPreferences = {
  reactions: boolean
  comments: boolean
  mentions: boolean
  event_updates: boolean
  project_updates: boolean
  collaboration_invitations: boolean
  priority_alerts: boolean // Always true, can't be disabled
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  reactions: true,
  comments: true,
  mentions: true,
  event_updates: true,
  project_updates: true,
  collaboration_invitations: true,
  priority_alerts: true, // Always enabled
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If no settings exist yet, return defaults
      if (error.code === 'PGRST116') {
        return { success: true, data: DEFAULT_PREFERENCES, error: null }
      }
      console.error('[getNotificationPreferences] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    // Extract notification preferences from user_settings
    const preferences: NotificationPreferences = {
      reactions: (data as any).notify_reactions ?? true,
      comments: (data as any).notify_comments ?? true,
      mentions: (data as any).notify_mentions ?? true,
      event_updates: (data as any).notify_event_updates ?? true,
      project_updates: (data as any).notify_project_updates ?? true,
      collaboration_invitations: (data as any).notify_collaboration_invitations ?? true,
      priority_alerts: true, // Always enabled
    }

    return { success: true, data: preferences, error: null }
  } catch (error) {
    console.error('[getNotificationPreferences] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
) {
  const supabase = await createClient()

  try {
    // Ensure priority_alerts is always true
    const safePreferences = {
      ...preferences,
      priority_alerts: true,
    }

    // Calculate if any notifications are enabled
    const anyEnabled = Object.entries(safePreferences).some(
      ([key, value]) => key !== 'priority_alerts' && value === true
    )

    const { data, error } = await (supabase
      .from('user_settings') as any)
      .upsert({
        user_id: userId,
        push_notifications: anyEnabled,
        email_notifications: false, // Email notifications coming soon
        notify_reactions: safePreferences.reactions,
        notify_comments: safePreferences.comments,
        notify_mentions: safePreferences.mentions,
        notify_event_updates: safePreferences.event_updates,
        notify_project_updates: safePreferences.project_updates,
        notify_collaboration_invitations: safePreferences.collaboration_invitations,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('[updateNotificationPreferences] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data: safePreferences, error: null }
  } catch (error) {
    console.error('[updateNotificationPreferences] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Get user profile information for settings page
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await (supabase
      .from('user_profiles') as any)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[getUserProfile] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('[getUserProfile] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Change user password (for email/password auth)
 */
export async function changePassword(newPassword: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('[changePassword] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('[changePassword] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[signOut] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('[signOut] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
