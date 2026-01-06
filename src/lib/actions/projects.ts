'use server'

import { createClient } from "@/lib/supabase/server"
import { inviteCollaborators } from "./collaboration"
import type { ProjectPost } from "@/lib/social/types"
import { formatDistanceToNow } from "date-fns"

export type CreateProjectParams = {
  title: string
  description: string
  impactGoal: string
  authorId: string
  orgId: string
  cause?: string
  targetDate?: string
  volunteersNeeded?: number
  resourcesRequested?: string
  fundraisingGoal?: string
  seekingPartners?: boolean
  inviteCollaborators?: string[]
}

/**
 * Create a new project in the database
 */
export async function createProject(params: CreateProjectParams) {
  const supabase = await createClient()

  try {
    // Create the project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        author_id: params.authorId,
        org_id: params.orgId,
        title: params.title,
        description: params.description,
        impact_goal: params.impactGoal,
        cause: params.cause || null,
        target_date: params.targetDate || null,
        volunteers_needed: params.volunteersNeeded || null,
        fundraising_goal: params.fundraisingGoal || null,
        seeking_partners: params.seekingPartners || false,
        status: 'planning' as const,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('[createProject] Error creating project:', error)
      return { success: false, error: error.message, data: null }
    }

    const projectData = project as { id: string } | null
    console.log(`[createProject] Created project: ${projectData?.id}`)

    // If inviting collaborators, send invitations
    if (params.inviteCollaborators && params.inviteCollaborators.length > 0 && projectData) {
      const inviteResult = await inviteCollaborators({
        resourceType: 'project',
        resourceId: projectData.id,
        inviterOrgId: params.orgId,
        inviterUserId: params.authorId,
        inviteeOrgIds: params.inviteCollaborators,
        message: `You've been invited to collaborate on the project "${params.title}"`,
      })

      if (!inviteResult.success) {
        console.error('[createProject] Error sending invitations:', inviteResult.error)
        // Don't fail the project creation if invitations fail
      } else {
        console.log(`[createProject] Sent ${params.inviteCollaborators.length} invitations`)
      }
    }

    return { success: true, data: project, error: null }
  } catch (error) {
    console.error('[createProject] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Get a project by ID with author and organization details
 */
export async function getProjectById(id: string): Promise<ProjectPost | null> {
  const supabase = await createClient()

  try {
    // Fetch the project with author profile and organization
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        author:profiles!projects_author_id_fkey (
          id,
          display_name,
          avatar_url,
          job_title
        ),
        organization:organizations!projects_org_id_fkey (
          id,
          name
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !project) {
      console.error('[getProjectById] Error fetching project:', error)
      return null
    }

    // Cast project to expected shape
    const p = project as any

    // Fetch collaborator organization details if collaborators exist
    let collaboratorOrgs: Array<{id: string, name: string, logo_url?: string | null}> = []
    if (p.collaborators && p.collaborators.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, logo_url')
        .in('id', p.collaborators)
      collaboratorOrgs = orgs || []
    }

    // Count linked events
    const { count: eventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('parent_project_id', id)
      .is('deleted_at', null)

    // Transform database row to ProjectPost type
    const projectPost: ProjectPost = {
      id: p.id,
      type: "project",
      author: {
        name: p.author?.display_name || 'Unknown',
        handle: `@${(p.author?.display_name || 'unknown').toLowerCase().replace(/\s+/g, '.')}`,
        avatar: p.author?.avatar_url || '/placeholder.svg',
        role: p.author?.job_title || undefined,
        organization: p.organization?.name || undefined,
      },
      title: p.title,
      description: p.description,
      impactGoal: p.impact_goal || '',
      cause: p.cause || undefined,
      targetDate: p.target_date || undefined,
      serviceArea: p.service_area || undefined,
      partnerOrgs: p.partner_orgs || undefined,
      needs: {
        volunteersNeeded: p.volunteers_needed || undefined,
        seekingPartners: p.seeking_partners || undefined,
        fundraisingGoal: p.fundraising_goal || undefined,
      },
      progress: p.progress_current !== null && p.progress_target !== null ? {
        current: p.progress_current,
        target: p.progress_target,
        unit: p.progress_unit || 'completed',
        lastUpdated: formatDistanceToNow(new Date(p.updated_at), { addSuffix: true }),
      } : undefined,
      eventsCount: eventsCount || 0,
      timeAgo: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
      interestedOrgs: p.interested_orgs || undefined,
      participantsReferred: p.participants_referred || 0,
      org_id: p.org_id,
      collaboratorOrgs,
    }

    return projectPost
  } catch (error) {
    console.error('[getProjectById] Exception:', error)
    return null
  }
}
