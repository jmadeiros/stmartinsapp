"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type AlertSeverity = "high" | "medium" | "low"

export interface Alert {
  id: string
  title: string
  message: string
  severity: string
  created_by: string
  created_at: string
  dismissed_at: string | null
  org_id: string | null
  target_orgs: string[] | null
  expires_at: string | null
  author?: {
    full_name: string
    job_title: string | null
    avatar_url: string | null
  } | null
}

export interface CreateAlertParams {
  title: string
  message: string
  severity: AlertSeverity
  createdBy: string
  orgId?: string
  targetOrgs?: string[]
  expiresAt?: string
}

/**
 * Fetches active alerts for an organization
 * Filters out expired alerts (where expires_at < now)
 */
export async function getAlerts(orgId?: string): Promise<{ data: Alert[] | null; error: string | null }> {
  const supabase = await createClient()

  try {
    // First fetch alerts
    let query = (supabase
      .from("alerts") as any)
      .select("*")
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })

    // Filter by org_id if provided, or get alerts where org_id is null (broadcast to all)
    if (orgId) {
      query = query.or(`org_id.eq.${orgId},org_id.is.null`)
    }

    const { data: alertsData, error: alertsError } = await query

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError)
      return { data: null, error: alertsError.message }
    }

    // Filter out expired alerts
    const now = new Date().toISOString()
    type AlertRow = { id: string; title: string; message: string; severity: string; created_by: string; created_at: string; expires_at: string | null }
    const activeAlerts = ((alertsData || []) as AlertRow[]).filter((alert) => {
      if (!alert.expires_at) return true
      return alert.expires_at > now
    })

    // Fetch author profiles for all alerts
    const authorIds = Array.from(new Set(activeAlerts.map(a => a.created_by)))

    let authorMap: Record<string, { full_name: string; job_title: string | null; avatar_url: string | null }> = {}

    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, full_name, job_title, avatar_url")
        .in("user_id", authorIds)

      if (profiles) {
        type ProfileRow = { user_id: string; full_name: string; job_title: string | null; avatar_url: string | null }
        authorMap = (profiles as ProfileRow[]).reduce((acc, profile) => {
          acc[profile.user_id] = {
            full_name: profile.full_name,
            job_title: profile.job_title,
            avatar_url: profile.avatar_url,
          }
          return acc
        }, {} as typeof authorMap)
      }
    }

    // Combine alerts with author data
    const alertsWithAuthors = activeAlerts.map(alert => ({
      ...alert,
      dismissed_at: null,
      org_id: null,
      target_orgs: null,
      author: authorMap[alert.created_by] || null,
    })) as Alert[]

    return { data: alertsWithAuthors, error: null }
  } catch (err) {
    console.error("Error in getAlerts:", err)
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

/**
 * Creates a new alert
 * Only admin and st_martins_staff can create alerts (enforced at component level)
 */
export async function createAlert(params: CreateAlertParams): Promise<{ success: boolean; error: string | null; data?: Alert }> {
  const supabase = await createClient()

  try {
    const { data, error } = await (supabase
      .from("alerts") as any)
      .insert({
        title: params.title,
        message: params.message,
        severity: params.severity,
        created_by: params.createdBy,
        org_id: params.orgId || null,
        target_orgs: params.targetOrgs || null,
        expires_at: params.expiresAt || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating alert:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    return { success: true, error: null, data: data as Alert }
  } catch (err) {
    console.error("Error in createAlert:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

/**
 * Dismisses an alert globally (sets dismissed_at)
 * This is different from user-level dismissal which uses localStorage
 */
export async function dismissAlertGlobally(alertId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  try {
    const { error } = await (supabase
      .from("alerts") as any)
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", alertId)

    if (error) {
      console.error("Error dismissing alert:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard")
    return { success: true, error: null }
  } catch (err) {
    console.error("Error in dismissAlertGlobally:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
