'use server'

import { createClient } from "@/lib/supabase/server"
import { inviteCollaborators } from "./collaboration"

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
      })
      .select()
      .single()

    if (error) {
      console.error('[createProject] Error creating project:', error)
      return { success: false, error: error.message, data: null }
    }

    console.log(`[createProject] Created project: ${project.id}`)

    // If inviting collaborators, send invitations
    if (params.inviteCollaborators && params.inviteCollaborators.length > 0 && project) {
      const inviteResult = await inviteCollaborators({
        resourceType: 'project',
        resourceId: project.id,
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
