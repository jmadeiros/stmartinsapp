'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export interface ProfileWithOrganization extends UserProfile {
  organization: {
    id: string
    name: string
    logo_url: string | null
  } | null
}

/**
 * Get a user's profile by user ID
 */
export async function getProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      organization:organizations(
        id,
        name,
        logo_url
      )
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return { data: null, error }
  }

  return { data: data as ProfileWithOrganization, error: null }
}

/**
 * Update a user's profile
 */
export async function updateProfile(userId: string, updates: Partial<UserProfileUpdate>) {
  const supabase = await createClient()

  // Get the current user to verify they're updating their own profile
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return { data: null, error: { message: 'Unauthorized' } }
  }

  // Remove fields that shouldn't be updated directly
  const allowedUpdates = { ...updates }
  delete allowedUpdates.user_id
  delete allowedUpdates.created_at
  delete allowedUpdates.role // Role is managed separately
  delete allowedUpdates.organization_id // Organization is managed through memberships

  const { data, error } = await (supabase
    .from('user_profiles') as any)
    .update({
      ...allowedUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return { data: null, error }
  }

  // Revalidate relevant pages
  revalidatePath(`/profile/${userId}`)
  revalidatePath('/people')
  revalidatePath('/dashboard')

  return { data, error: null }
}

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }

  return getProfile(user.id)
}

/**
 * Update the current user's avatar URL
 */
export async function updateAvatar(userId: string, avatarUrl: string) {
  return updateProfile(userId, { avatar_url: avatarUrl })
}

/**
 * Add or remove a skill from the user's profile
 */
export async function updateSkills(userId: string, skills: string[]) {
  return updateProfile(userId, { skills })
}

/**
 * Add or remove an interest from the user's profile
 */
export async function updateInterests(userId: string, interests: string[]) {
  return updateProfile(userId, { interests })
}
