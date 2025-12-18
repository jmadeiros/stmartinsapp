'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/database.types"

export type OrganizationWithMembers = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website: string | null
  mission: string | null
  cause_areas: string[] | null
  primary_color: string | null
  social_links: Record<string, string> | null
  room_location: string | null
  contact_email: string | null
  contact_phone: string | null
  founded_date: string | null
  members: {
    user_id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    role: Database['public']['Enums']['user_role']
  }[]
}

export type UpdateOrganizationParams = {
  room_location?: string
  description?: string
  mission?: string
  website?: string
  contact_email?: string
  contact_phone?: string
}

/**
 * Get organization details with members
 */
export async function getOrganization(orgId: string): Promise<{ data: OrganizationWithMembers | null, error: string | null }> {
  try {
    const supabase = await createClient()

    // Fetch organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError) {
      return { data: null, error: orgError.message }
    }

    if (!org) {
      return { data: null, error: 'Organization not found' }
    }

    // Fetch members
    const { data: members, error: membersError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, avatar_url, job_title, role')
      .eq('organization_id', orgId)
      .order('full_name')

    if (membersError) {
      console.error('Error fetching members:', membersError)
      // Continue even if members fetch fails
    }

    return {
      data: {
        ...org,
        social_links: org.social_links as Record<string, string> | null,
        members: members || [],
      },
      error: null,
    }
  } catch (err) {
    console.error('Error in getOrganization:', err)
    return { data: null, error: 'Failed to fetch organization' }
  }
}

/**
 * Update organization details
 * Only admins and managers of the organization can update
 */
export async function updateOrganization(
  orgId: string,
  updates: UpdateOrganizationParams
): Promise<{ success: boolean, error: string | null }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user profile to check role and organization
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' }
    }

    // Check permissions: must be admin OR manager of this organization
    const isAdmin = profile.role === 'admin'
    const isOrgManager = profile.organization_id === orgId &&
                         (profile.role === 'admin' || profile.role === 'st_martins_staff')

    if (!isAdmin && !isOrgManager) {
      return { success: false, error: 'Permission denied. Only admins and organization managers can update organization details.' }
    }

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)

    if (updateError) {
      console.error('Error updating organization:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Error in updateOrganization:', err)
    return { success: false, error: 'Failed to update organization' }
  }
}
