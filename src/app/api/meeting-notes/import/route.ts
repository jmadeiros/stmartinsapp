import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

/**
 * Meeting Notes Import API (Task 3.13)
 * Receives meeting notes from Granola via Zapier webhook
 *
 * Authentication: Bearer token in Authorization header
 * Expected: MEETING_NOTES_API_KEY environment variable
 */

// Validation schema for import request
const ImportSchema = z.object({
  meeting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  title: z.string().min(1, 'Title is required').max(500),
  summary: z.string().min(1, 'Summary is required'),
  action_items: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    assigned_to: z.string().optional() // Email or name for future matching
  })).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  org_id: z.string().uuid().optional() // Can be configured per API key later
})

type ImportRequest = z.infer<typeof ImportSchema>

export async function POST(request: NextRequest) {
  // Get API key from environment
  const expectedApiKey = process.env.MEETING_NOTES_API_KEY

  if (!expectedApiKey) {
    console.error('[meeting-notes/import] MEETING_NOTES_API_KEY not configured')
    return NextResponse.json(
      { success: false, error: 'API not configured' },
      { status: 500 }
    )
  }

  // Validate Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  const providedKey = authHeader.slice(7) // Remove "Bearer " prefix
  if (providedKey !== expectedApiKey) {
    console.error('[meeting-notes/import] Invalid API key provided')
    return NextResponse.json(
      { success: false, error: 'Invalid API key' },
      { status: 401 }
    )
  }

  // Parse and validate request body
  let body: ImportRequest
  try {
    const rawBody = await request.json()
    body = ImportSchema.parse(rawBody)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[meeting-notes/import] Validation error:', error.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('[meeting-notes/import] Parse error:', error)
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Create Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[meeting-notes/import] Missing Supabase credentials')
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Determine org_id - use provided or get from configuration
    let orgId = body.org_id

    if (!orgId) {
      // Default to first organization (for MVP)
      // In production, this would be configured per API key
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      if (!org) {
        return NextResponse.json(
          { success: false, error: 'No organization found' },
          { status: 400 }
        )
      }
      orgId = org.id
    }

    // Get a system user for author_id (first admin user of the org)
    const { data: adminUser } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (!adminUser) {
      // Fallback to any user in the org
      const { data: anyUser } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('organization_id', orgId)
        .limit(1)
        .single()

      if (!anyUser) {
        return NextResponse.json(
          { success: false, error: 'No users found in organization' },
          { status: 400 }
        )
      }
    }

    const authorId = adminUser?.user_id

    // Create the meeting note
    const { data: note, error: noteError } = await supabase
      .from('meeting_notes')
      .insert({
        title: body.title,
        content: body.summary,
        meeting_date: body.meeting_date,
        org_id: orgId,
        author_id: authorId,
        tags: body.tags.length > 0 ? body.tags : null,
        status: 'published',
        published_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (noteError) {
      console.error('[meeting-notes/import] Error creating note:', noteError)
      return NextResponse.json(
        { success: false, error: 'Failed to create meeting note' },
        { status: 500 }
      )
    }

    // Create action items
    let actionItemsCreated = 0
    if (body.action_items.length > 0) {
      const actionItemsData = body.action_items.map(item => ({
        note_id: note.id,
        title: item.title,
        description: item.description || null,
        due_date: item.due_date || null,
        assigned_to: null, // For MVP, no assignee matching
        status: 'open'
      }))

      const { data: actionItems, error: actionItemsError } = await supabase
        .from('action_items')
        .insert(actionItemsData)
        .select('id')

      if (actionItemsError) {
        console.error('[meeting-notes/import] Error creating action items:', actionItemsError)
        // Don't fail the whole request, note was created successfully
      } else {
        actionItemsCreated = actionItems?.length || 0
      }
    }

    console.log(`[meeting-notes/import] Created note ${note.id} with ${actionItemsCreated} action items`)

    return NextResponse.json({
      success: true,
      meeting_note_id: note.id,
      action_items_created: actionItemsCreated
    })

  } catch (error) {
    console.error('[meeting-notes/import] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
