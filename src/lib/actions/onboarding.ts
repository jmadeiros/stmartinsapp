'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types for onboarding steps
export interface ProfileStepData {
  full_name: string
  bio?: string
  job_title?: string
  avatar_url?: string
  linkedin_url?: string
  twitter_url?: string
  website_url?: string
}

export interface OrganizationStepData {
  organization_id: string
}

export interface InterestsStepData {
  skills: string[]
  interests: string[]
  linkedin_url?: string
  twitter_url?: string
  website_url?: string
}

export interface NotificationStepData {
  email_notifications: boolean
  push_notifications: boolean
  digest_frequency: 'daily' | 'weekly' | 'never'
}

/**
 * Check if user needs to complete onboarding
 */
export async function checkOnboardingStatus() {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { needsOnboarding: true, reason: 'not_authenticated', currentStep: 0 }
    }

    // Check profile completeness
    type ProfileCheck = {
      user_id: string
      full_name: string | null
      organization_id: string | null
      bio: string | null
      skills: string[] | null
      interests: string[] | null
      approval_status: string | null
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, organization_id, bio, skills, interests, approval_status')
      .eq('user_id', user.id)
      .single()

    const typedProfile = profile as ProfileCheck | null

    if (profileError || !typedProfile) {
      return { needsOnboarding: true, reason: 'no_profile', currentStep: 1 }
    }

    if (!typedProfile.full_name) {
      return { needsOnboarding: true, reason: 'missing_name', currentStep: 1 }
    }

    if (!typedProfile.organization_id) {
      return { needsOnboarding: true, reason: 'no_organization', currentStep: 2 }
    }

    if (!typedProfile.skills || typedProfile.skills.length === 0) {
      return { needsOnboarding: true, reason: 'no_interests', currentStep: 3 }
    }

    // Check approval status - if pending or rejected, redirect to pending-approval
    if (typedProfile.approval_status === 'pending' || typedProfile.approval_status === 'rejected') {
      return { needsOnboarding: false, reason: 'pending_approval', currentStep: 5, redirectTo: '/pending-approval' }
    }

    // All complete and approved
    return { needsOnboarding: false, reason: null, currentStep: 5 }
  } catch (error) {
    console.error('[checkOnboardingStatus] Error:', error)
    return { needsOnboarding: true, reason: 'error', currentStep: 0 }
  }
}

/**
 * Step 1: Save profile basics (name, bio, job title)
 */
export async function saveProfileStep(data: ProfileStepData) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Upsert profile
    const { error } = await (supabase
      .from('user_profiles') as any)
      .upsert({
        user_id: user.id,
        full_name: data.full_name,
        bio: data.bio || null,
        job_title: data.job_title || null,
        avatar_url: data.avatar_url || null,
        linkedin_url: data.linkedin_url || null,
        twitter_url: data.twitter_url || null,
        website_url: data.website_url || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('[saveProfileStep] Error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/onboarding')
    return { success: true, error: null }
  } catch (error) {
    console.error('[saveProfileStep] Exception:', error)
    return { success: false, error: 'Failed to save profile' }
  }
}

/**
 * Step 2: Save organization selection
 */
export async function saveOrganizationStep(data: OrganizationStepData) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update profile with organization
    const { error: profileError } = await (supabase
      .from('user_profiles') as any)
      .update({
        organization_id: data.organization_id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (profileError) {
      console.error('[saveOrganizationStep] Profile error:', profileError)
      return { success: false, error: profileError.message }
    }

    // Create or update membership
    const { error: membershipError } = await (supabase
      .from('user_memberships') as any)
      .upsert({
        user_id: user.id,
        org_id: data.organization_id,
        role: 'member',
        is_primary: true,
      }, { onConflict: 'user_id,org_id' })

    if (membershipError) {
      console.error('[saveOrganizationStep] Membership error:', membershipError)
      // Don't fail - membership might already exist
    }

    revalidatePath('/onboarding')
    return { success: true, error: null }
  } catch (error) {
    console.error('[saveOrganizationStep] Exception:', error)
    return { success: false, error: 'Failed to save organization' }
  }
}

/**
 * Step 3: Save skills and interests
 */
export async function saveInterestsStep(data: InterestsStepData) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await (supabase
      .from('user_profiles') as any)
      .update({
        skills: data.skills,
        interests: data.interests,
        linkedin_url: data.linkedin_url || null,
        twitter_url: data.twitter_url || null,
        website_url: data.website_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('[saveInterestsStep] Error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/onboarding')
    return { success: true, error: null }
  } catch (error) {
    console.error('[saveInterestsStep] Exception:', error)
    return { success: false, error: 'Failed to save interests' }
  }
}

/**
 * Step 4: Save notification preferences and complete onboarding
 */
export async function completeOnboarding(data: NotificationStepData) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated', redirectTo: null }
    }

    // Upsert user settings - use notification_frequency (the actual column name)
    const { error: settingsError } = await (supabase
      .from('user_settings') as any)
      .upsert({
        user_id: user.id,
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
        notification_frequency: data.digest_frequency,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (settingsError) {
      console.error('[completeOnboarding] Settings error:', settingsError)
      return { success: false, error: settingsError.message, redirectTo: null }
    }

    // Set approval status to pending - column exists via migration 20260107000000
    const { error: profileError } = await (supabase
      .from('user_profiles') as any)
      .update({
        approval_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (profileError) {
      console.error('[completeOnboarding] Profile error:', profileError)
      return { success: false, error: profileError.message, redirectTo: null }
    }

    // Get user's profile info for notification
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, job_title, organization_id')
      .eq('user_id', user.id)
      .single()

    // Notify all admins about new user pending approval
    await notifyAdminsOfPendingUser(supabase, user.id, profile)

    revalidatePath('/pending-approval')
    return { success: true, error: null, redirectTo: '/pending-approval' }
  } catch (error) {
    console.error('[completeOnboarding] Exception:', error)
    return { success: false, error: 'Failed to complete onboarding', redirectTo: null }
  }
}

/**
 * Notify all admin users about a new pending approval
 */
async function notifyAdminsOfPendingUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  profile: { full_name: string; job_title?: string | null; organization_id?: string | null } | null
) {
  try {
    // Get all admin users (only 'admin' role, not st_martins_staff)
    type AdminUser = { user_id: string }
    const { data, error: adminError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('role', 'admin')

    const admins = data as AdminUser[] | null

    if (adminError || !admins || admins.length === 0) {
      console.warn('[notifyAdminsOfPendingUser] No admins found or error:', adminError)
      return
    }

    const userName = profile?.full_name || 'A new user'
    const jobTitle = profile?.job_title ? ` (${profile.job_title})` : ''

    // Create notifications for each admin
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      actor_id: userId,
      type: 'user_approval_needed',
      title: `${userName}${jobTitle} needs approval`,
      reference_type: 'user',
      reference_id: userId,
      link: '/admin/approvals',
      action_data: {
        user_name: userName,
        job_title: profile?.job_title,
      },
      read: false,
    }))

    const { error: notifError } = await (supabase
      .from('notifications') as any)
      .insert(notifications)

    if (notifError) {
      console.error('[notifyAdminsOfPendingUser] Error creating notifications:', notifError)
    } else {
      console.log(`[notifyAdminsOfPendingUser] Notified ${admins.length} admin(s)`)
    }
  } catch (error) {
    console.error('[notifyAdminsOfPendingUser] Exception:', error)
  }
}

/**
 * Get list of active organizations for selection
 */
export async function getOrganizationsForOnboarding() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, description, logo_url')
      .order('name')

    if (error) {
      console.error('[getOrganizationsForOnboarding] Error:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getOrganizationsForOnboarding] Exception:', error)
    return { data: [], error: 'Failed to fetch organizations' }
  }
}
