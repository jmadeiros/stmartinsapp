'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/database.types"

type UserRole = Database['public']['Enums']['user_role']

// Authorization helper
async function checkAdminAccess(): Promise<
  | { authorized: false; error: string }
  | { authorized: true; supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } }
> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, error: 'Unauthorized' }
  }

  const { data: profile } = await (supabase
    .from('user_profiles') as any)
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'st_martins_staff'

  if (!isAdmin) {
    return { authorized: false, error: 'Insufficient permissions' }
  }

  return { authorized: true, supabase, user }
}

// Dashboard Stats
export async function getAdminStats() {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth

  // Get total users count
  const { count: totalUsers } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  // Get pending approvals (users created in last 7 days without org membership)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: pendingApprovals } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())
    .is('organization_id', null)

  // Get active posts (not deleted, created in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: activePosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get soft deleted items (posts + events + projects)
  const { count: deletedPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .not('deleted_at', 'is', null)

  const { count: deletedEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .not('deleted_at', 'is', null)

  const { count: deletedProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .not('deleted_at', 'is', null)

  const softDeletedItems = (deletedPosts || 0) + (deletedEvents || 0) + (deletedProjects || 0)

  return {
    data: {
      totalUsers: totalUsers || 0,
      pendingApprovals: pendingApprovals || 0,
      activePosts: activePosts || 0,
      softDeletedItems,
    }
  }
}

// User Management
export type UserListOptions = {
  search?: string
  role?: UserRole
  orgId?: string
  limit?: number
  offset?: number
}

export async function getUsers(options: UserListOptions = {}) {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth
  const { search, role, orgId, limit = 50, offset = 0 } = options

  let query = supabase
    .from('user_profiles')
    .select(`
      user_id,
      full_name,
      contact_email,
      role,
      job_title,
      organization_id,
      created_at,
      last_active_at,
      organizations:organization_id (
        name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,contact_email.ilike.%${search}%`)
  }

  if (role) {
    query = query.eq('role', role)
  }

  if (orgId) {
    query = query.eq('organization_id', orgId)
  }

  const { data, error, count } = await query

  if (error) {
    return { error: error.message }
  }

  return { data, count }
}

export async function getUserDetails(userId: string) {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      organizations:organization_id (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    return { error: error.message }
  }

  // Get user's memberships
  const { data: memberships } = await supabase
    .from('user_memberships')
    .select(`
      *,
      organizations (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', userId)

  return { data: { ...(data as any), memberships } }
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth

  const { error } = await (supabase
    .from('user_profiles') as any)
    .update({ role: newRole })
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function softDeleteUser(userId: string) {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth

  // Note: User profiles don't have deleted_at field in current schema
  // We'll update their membership status instead
  const { error } = await (supabase
    .from('user_memberships') as any)
    .update({ left_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('left_at', null)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function restoreUser(userId: string) {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth

  const { error } = await (supabase
    .from('user_memberships') as any)
    .update({ left_at: null })
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// User Approvals (for OAuth onboarding flow)
export async function getPendingApprovals() {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth

  // Get users without organization membership
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .is('organization_id', null)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function approveUser(userId: string, orgId: string, role: UserRole = 'volunteer') {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth

  // Update user's organization
  const { error: updateError } = await (supabase
    .from('user_profiles') as any)
    .update({ organization_id: orgId, role })
    .eq('user_id', userId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Create membership record
  const { error: membershipError } = await (supabase
    .from('user_memberships') as any)
    .insert({
      user_id: userId,
      org_id: orgId,
      role,
      is_primary: true,
    })

  if (membershipError) {
    return { error: membershipError.message }
  }

  return { success: true }
}

export async function rejectUser(userId: string, reason: string) {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  // For now, we'll just soft delete by removing their profile
  // In production, you might want to send an email with the reason
  const { supabase } = auth

  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// Website Publishing Queue
export type WebsiteQueueItem = {
  id: string
  type: 'post' | 'event' | 'project'
  title: string
  content?: string
  author_id: string
  org_id: string
  created_at: string
  author_name?: string
  org_name?: string
}

export async function getWebsiteQueue() {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth

  // Get recent opportunities posts (potential website content)
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      author_id,
      org_id,
      created_at,
      category,
      user_profiles:author_id (
        full_name
      ),
      organizations:org_id (
        name
      )
    `)
    .eq('category', 'opportunities')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get recent events
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      organizer_id,
      org_id,
      created_at,
      start_time,
      user_profiles:organizer_id (
        full_name
      ),
      organizations:org_id (
        name
      )
    `)
    .is('deleted_at', null)
    .gte('start_time', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  // Get active projects
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      author_id,
      org_id,
      created_at,
      status,
      user_profiles:author_id (
        full_name
      ),
      organizations:org_id (
        name
      )
    `)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20)

  // Combine and format
  const items: WebsiteQueueItem[] = [
    ...(posts || []).map((p: any) => ({
      id: p.id,
      type: 'post' as const,
      title: p.title || 'Untitled Post',
      content: p.content,
      author_id: p.author_id,
      org_id: p.org_id,
      created_at: p.created_at,
      author_name: p.user_profiles?.full_name,
      org_name: p.organizations?.name,
    })),
    ...(events || []).map((e: any) => ({
      id: e.id,
      type: 'event' as const,
      title: e.title,
      content: e.description,
      author_id: e.organizer_id,
      org_id: e.org_id,
      created_at: e.created_at,
      author_name: e.user_profiles?.full_name,
      org_name: e.organizations?.name,
    })),
    ...(projects || []).map((p: any) => ({
      id: p.id,
      type: 'project' as const,
      title: p.title,
      content: p.description,
      author_id: p.author_id,
      org_id: p.org_id,
      created_at: p.created_at,
      author_name: p.user_profiles?.full_name,
      org_name: p.organizations?.name,
    })),
  ]

  // Sort by created_at
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return { data: items }
}

export async function approveForWebsite(itemId: string, itemType: 'post' | 'event' | 'project') {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  // This is a placeholder - you would implement actual website publishing logic here
  // For now, we'll just mark it as approved in the future when you add a website_approved field

  return { success: true, message: 'Website publishing will be implemented in Task 3.17' }
}

export async function rejectForWebsite(itemId: string, reason: string) {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  // Placeholder for rejection logic
  return { success: true, message: 'Rejection reason saved' }
}

// Get all organizations (for dropdowns)
export async function getOrganizations() {
  const auth = await checkAdminAccess()
  if (!auth.authorized) {
    return { error: auth.error }
  }

  const { supabase } = auth

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  if (error) {
    return { error: error.message }
  }

  return { data }
}
