import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncGranolaNotes } from '@/lib/granola/sync'
import { GranolaAuthError, getGranolaAuthPath, isTokenExpired, getExpirationInfo } from '@/lib/granola/client'
import { isCacheAvailable, getCacheInfo } from '@/lib/granola/local-cache'
import { readFile } from 'fs/promises'
import type { GranolaAuth, WorkOSTokens } from '@/lib/granola/types'

/**
 * POST /api/granola/sync
 *
 * Triggers a Granola sync for the authenticated user.
 * Fetches meeting notes from the local Granola app and syncs them to the database.
 */
export async function POST() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in to sync Granola notes' },
      { status: 401 }
    )
  }

  // Get user's organization ID from their profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  const profileData = profile as { organization_id?: string } | null
  if (profileError || !profileData?.organization_id) {
    return NextResponse.json(
      { error: 'Profile not found', message: 'Could not find your organization. Please contact support.' },
      { status: 500 }
    )
  }

  const orgId = profileData.organization_id

  try {
    // Perform the sync
    const result = await syncGranolaNotes(orgId, user.id)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    // Handle GranolaAuthError specially - tell user to open Granola app
    if (error instanceof GranolaAuthError) {
      return NextResponse.json(
        {
          error: 'Granola authentication required',
          message: error.suggestedAction,
          tokenExpired: error.tokenExpired,
          type: 'auth_error',
        },
        { status: 401 }
      )
    }

    // Handle other errors
    console.error('[granola/sync] Sync failed:', error)

    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during sync',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/granola/sync
 *
 * Returns Granola sync status information:
 * - Whether Granola is available (credentials exist)
 * - Token status (valid, expired, or missing)
 * - Last sync time (from local cache if available)
 */
export async function GET() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in to check sync status' },
      { status: 401 }
    )
  }

  // Check if Granola credentials exist and token status
  let granolaAvailable = false
  let tokenStatus: 'valid' | 'expired' | 'missing' = 'missing'
  let tokenExpirationInfo: string | null = null

  try {
    const authPath = getGranolaAuthPath()
    const raw = await readFile(authPath, 'utf-8')
    const authData: GranolaAuth = JSON.parse(raw)

    if (authData.workos_tokens) {
      const tokens: WorkOSTokens = JSON.parse(authData.workos_tokens)

      if (tokens.access_token) {
        granolaAvailable = true

        if (isTokenExpired(tokens)) {
          tokenStatus = 'expired'
          tokenExpirationInfo = getExpirationInfo(tokens)
        } else {
          tokenStatus = 'valid'
          tokenExpirationInfo = getExpirationInfo(tokens)
        }
      }
    }
  } catch {
    // Granola credentials not found or malformed
    granolaAvailable = false
    tokenStatus = 'missing'
  }

  // Get local cache info if available
  let cacheInfo: {
    available: boolean
    lastModified?: string
    documentCount?: number
    ageMinutes?: number
    isStale?: boolean
  } = { available: false }

  if (await isCacheAvailable()) {
    const info = await getCacheInfo()
    if (info) {
      cacheInfo = {
        available: true,
        lastModified: info.lastModified.toISOString(),
        documentCount: info.documentCount,
        ageMinutes: Math.round(info.ageMinutes),
        isStale: info.isStale,
      }
    }
  }

  // Get last sync time from database for this user
  let lastSyncTime: string | null = null

  const { data: lastSync } = await supabase
    .from('meeting_notes')
    .select('synced_at')
    .eq('author_id', user.id)
    .not('synced_at', 'is', null)
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()

  const lastSyncData = lastSync as { synced_at?: string } | null
  if (lastSyncData?.synced_at) {
    lastSyncTime = lastSyncData.synced_at
  }

  return NextResponse.json({
    granola: {
      available: granolaAvailable,
      tokenStatus,
      tokenExpirationInfo,
    },
    cache: cacheInfo,
    lastSyncTime,
    canSync: granolaAvailable && tokenStatus === 'valid',
  })
}
