import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  console.log('[DEV-SEED] Starting seed data creation...')

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[DEV-SEED] Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json({ error: 'Missing Supabase URL' }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[DEV-SEED] Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Missing service role key' }, { status: 500 })
    }

    console.log('[DEV-SEED] Creating admin client...')
    // Use service role client to bypass RLS
    const supabaseAdmin = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const testUserId = (await supabaseAdmin.auth.admin.listUsers())?.data?.users?.find(u => u.email === 'test@stmartins.dev')?.id
    const testOrgId = '00000000-0000-0000-0000-000000000001'

    if (!testUserId) {
      return NextResponse.json({ error: 'Test user not found. Run /api/dev-login first.' }, { status: 404 })
    }

    console.log('[DEV-SEED] Creating sample posts...')

    // Clear existing sample data first
    await supabaseAdmin.from('posts').delete().eq('org_id', testOrgId)
    await supabaseAdmin.from('events').delete().eq('org_id', testOrgId)
    await supabaseAdmin.from('projects').delete().eq('org_id', testOrgId)

    // Create 5 sample posts with different categories
    const posts = [
      {
        org_id: testOrgId,
        author_id: testUserId,
        category: 'wins',
        content: 'Just completed our community garden expansion! We now have 20 new plots available for families. The turnout at Saturday\'s planting day was incredible - over 50 volunteers showed up! 🌱',
      },
      {
        org_id: testOrgId,
        author_id: testUserId,
        category: 'general',
        content: 'Quick update on the library renovation: Phase 1 (children\'s section) is complete! The new reading nook and interactive learning space are now open. Phase 2 starts next month.',
      },
      {
        org_id: testOrgId,
        author_id: testUserId,
        category: 'questions',
        content: 'Does anyone know a good local electrician? We need to install additional outdoor lighting around the community center. Looking for recommendations!',
      },
      {
        org_id: testOrgId,
        author_id: testUserId,
        category: 'opportunities',
        content: 'Thinking about expanding our weekly farmers market to include local artisans and crafters. What does everyone think? Should we keep it food-focused or open it up to more vendors?',
      },
      {
        org_id: testOrgId,
        author_id: testUserId,
        category: 'general',
        content: 'IMPORTANT: The community center will be closed next Thursday (Dec 19) for annual maintenance and deep cleaning. We\'ll reopen Friday morning. Thanks for your understanding!',
      }
    ]

    const { data: createdPosts, error: postsError } = await supabaseAdmin
      .from('posts')
      .insert(posts as any)
      .select()

    if (postsError) {
      console.error('[DEV-SEED] Error creating posts:', postsError)
      return NextResponse.json({ error: 'Failed to create posts' }, { status: 500 })
    }

    console.log('[DEV-SEED] Creating sample events...')

    // Create 3 sample events
    const events = [
      {
        org_id: testOrgId,
        organizer_id: testUserId,
        title: 'Community Food Drive & Distribution',
        description: 'Join us for our monthly food drive! We\'ll be collecting non-perishable items and distributing food boxes to families in need. Volunteers welcome - we need help with sorting, packing, and distribution.',
        location: 'St Martin\'s Community Center - Main Hall',
        start_time: '2024-12-15T09:00:00Z',
        end_time: '2024-12-15T15:00:00Z',
        volunteers_needed: 25,
        seeking_partners: true,
      },
      {
        org_id: testOrgId,
        organizer_id: testUserId,
        title: 'Holiday Lights Installation Workshop',
        description: 'Learn how to safely install holiday lights and decorations! Our facilities team will teach best practices for outdoor lighting, ladder safety, and energy-efficient displays. Hot cocoa provided!',
        location: 'Community Center - Workshop Room',
        start_time: '2024-12-18T18:00:00Z',
        end_time: '2024-12-18T20:00:00Z',
        volunteers_needed: 5,
      },
      {
        org_id: testOrgId,
        organizer_id: testUserId,
        title: 'New Year Community Potluck',
        description: 'Ring in 2025 with your neighbors! Bring a dish to share (serves 8-10) and join us for food, games, and fellowship. Kid-friendly activities starting at 6pm, adult social hour at 8pm.',
        location: 'St Martin\'s Hub - Rooftop Garden',
        start_time: '2024-12-31T18:00:00Z',
        end_time: '2025-01-01T00:00:00Z',
      }
    ]

    const { data: createdEvents, error: eventsError } = await supabaseAdmin
      .from('events')
      .insert(events as any)
      .select()

    if (eventsError) {
      console.error('[DEV-SEED] Error creating events:', eventsError)
      return NextResponse.json({ error: 'Failed to create events' }, { status: 500 })
    }

    console.log('[DEV-SEED] Creating sample projects...')

    // Create 2 sample projects
    const projects = [
      {
        org_id: testOrgId,
        author_id: testUserId,
        title: 'Community Mural Project',
        description: 'Transform our community center\'s blank wall into a vibrant mural celebrating our neighborhood\'s diversity and history! We\'re seeking artists, designers, and anyone interested in contributing ideas or helping with painting.',
        impact_goal: 'Create a 30ft x 15ft mural by spring 2025',
        cause: 'beautification',
        progress_current: 35,
        progress_target: 100,
        progress_unit: 'percent',
        volunteers_needed: 15,
        seeking_partners: true,
      },
      {
        org_id: testOrgId,
        author_id: testUserId,
        title: 'Youth Mentorship Program',
        description: 'Launch a structured mentorship program pairing local professionals with teens (ages 14-18) interested in career exploration. Looking for mentors in tech, healthcare, trades, arts, and business.',
        impact_goal: 'Match 50 teens with mentors by February 2025',
        cause: 'education',
        progress_current: 12,
        progress_target: 50,
        progress_unit: 'matches',
        volunteers_needed: 20,
        seeking_partners: true,
      }
    ]

    const { data: createdProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .insert(projects as any)
      .select()

    if (projectsError) {
      console.error('[DEV-SEED] Error creating projects:', projectsError)
      return NextResponse.json({ error: 'Failed to create projects' }, { status: 500 })
    }

    console.log('[DEV-SEED] Seed data created successfully!')

    return NextResponse.json({
      success: true,
      message: 'Sample data created',
      data: {
        posts: createdPosts?.length || 0,
        events: createdEvents?.length || 0,
        projects: createdProjects?.length || 0
      }
    })
  } catch (error) {
    console.error('[DEV-SEED] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
