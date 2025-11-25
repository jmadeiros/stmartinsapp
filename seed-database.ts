import { createClient } from '@supabase/supabase-js'
import type { Database } from './src/lib/database.types'

async function seedDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🌱 Starting database seed...')

  const testOrgId = '00000000-0000-0000-0000-000000000001'
  // Create fake org IDs for collaborating organizations (for demo purposes)
  const partnerOrg1Id = '00000000-0000-0000-0000-000000000002'
  const partnerOrg2Id = '00000000-0000-0000-0000-000000000003'

  // Get test user
  const { data: users } = await supabase.auth.admin.listUsers()
  const testUser = users?.users?.find(u => u.email === 'test@stmartins.dev')

  if (!testUser) {
    console.error('❌ Test user not found. Please create it first.')
    process.exit(1)
  }

  const testUserId = testUser.id
  console.log('✓ Found test user:', testUser.email)

  // Create partner organizations for collaboration demo
  console.log('🏢 Creating partner organizations...')
  const { error: orgsError } = await supabase.from('organizations').upsert([
    {
      id: partnerOrg1Id,
      name: 'Youth Action Network',
      slug: 'youth-action-network',
      description: 'Supporting youth development programs',
      is_active: true,
    },
    {
      id: partnerOrg2Id,
      name: 'Community Arts Trust',
      slug: 'community-arts-trust',
      description: 'Promoting arts in the community',
      is_active: true,
    },
  ], { onConflict: 'id' })

  if (orgsError) {
    console.error('❌ Error creating orgs:', orgsError)
  } else {
    console.log('✓ Created 2 partner organizations')
  }

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await supabase.from('posts').delete().eq('org_id', testOrgId)
  await supabase.from('events').delete().eq('org_id', testOrgId)
  await supabase.from('projects').delete().eq('org_id', testOrgId)

  // Seed posts
  console.log('📝 Creating posts...')
  const { error: postsError } = await supabase.from('posts').insert([
    {
      org_id: testOrgId,
      author_id: testUserId,
      category: 'wins',
      content: 'Just completed our community garden expansion! 🌱 With help from 15 volunteers, we added 20 new raised beds and a greenhouse. Already seeing interest from 3 schools wanting to use it for education programs.',
    },
    {
      org_id: testOrgId,
      author_id: testUserId,
      category: 'general',
      content: 'Quick update on the library renovation project - we\'re at 67% of our fundraising goal! The new children\'s section design is looking amazing. Thanks to everyone who\'s contributed so far.',
    },
    {
      org_id: testOrgId,
      author_id: testUserId,
      category: 'opportunities',
      title: 'Seeking: Grant Writer for Youth Program',
      content: 'We\'re looking for an experienced grant writer to help secure funding for our after-school mentorship program. Estimated 10-15 hours over the next month. This could unlock £50k in funding to serve 100+ young people.',
    },
    {
      org_id: testOrgId,
      author_id: testUserId,
      category: 'questions',
      content: 'Has anyone worked with the council on event permits for outdoor festivals? We\'re planning a community celebration in June and would love to learn from others\' experiences.',
    },
    {
      org_id: testOrgId,
      author_id: testUserId,
      category: 'learnings',
      content: 'Big learning from our recent fundraiser: sending personalized thank-you videos increased repeat donations by 40%! Tool we used: Loom for quick recordings. Game changer for donor retention.',
    },
  ])

  if (postsError) {
    console.error('❌ Error creating posts:', postsError)
  } else {
    console.log('✓ Created 5 posts')
  }

  // Seed events
  console.log('📅 Creating events...')
  const { data: eventsData, error: eventsError } = await supabase.from('events').insert([
    {
      org_id: testOrgId,
      organizer_id: testUserId,
      title: 'Community Food Drive',
      description: 'Monthly food collection for local families in need. We partner with 3 food banks and typically collect 200+ items.',
      location: 'St Martins Community Centre',
      start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours later
      cause: 'hunger',
      volunteers_needed: 8,
    },
    {
      org_id: testOrgId,
      organizer_id: testUserId,
      title: 'Charity Fun Run 5K',
      description: 'Annual 5K run/walk to raise funds for youth programs. Family-friendly route through Victoria Park. Refreshments and medals for all finishers!',
      location: 'Victoria Park, Main Entrance',
      start_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month from now
      end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      cause: 'youth',
      volunteers_needed: 20,
      seeking_partners: true,
      collaborating_orgs: [partnerOrg1Id, partnerOrg2Id],
    },
    {
      org_id: testOrgId,
      organizer_id: testUserId,
      title: 'Skills Workshop: Social Media for Nonprofits',
      description: 'Free 2-hour workshop covering Instagram, Facebook, and LinkedIn strategies for charities. Bring your questions!',
      location: 'Online via Zoom',
      start_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      cause: 'education',
    },
  ])

  if (eventsError) {
    console.error('❌ Error creating events:', eventsError)
  } else {
    console.log('✓ Created 3 events', eventsData ? `(returned ${eventsData.length} rows)` : '(no data returned)')
  }

  // Seed projects
  console.log('🚀 Creating projects...')
  const { data: projectsData, error: projectsError } = await supabase.from('projects').insert([
    {
      org_id: testOrgId,
      author_id: testUserId,
      title: 'Community Mural Project',
      description: 'Creating a vibrant mural celebrating local history and diversity on the High Street wall.',
      impact_goal: 'Complete a 30ft x 15ft mural engaging 50+ community members by spring 2025',
      cause: 'arts',
      progress_current: 35,
      progress_target: 100,
      progress_unit: 'percent',
      volunteers_needed: 15,
      seeking_partners: true,
      collaborators: [partnerOrg1Id],
      interested_orgs: [partnerOrg2Id],
    },
    {
      org_id: testOrgId,
      author_id: testUserId,
      title: 'Elder Care Companion Program',
      description: 'Matching volunteers with isolated seniors for weekly visits, reducing loneliness and improving wellbeing.',
      impact_goal: 'Support 50 seniors with regular companionship visits',
      cause: 'seniors',
      progress_current: 12,
      progress_target: 50,
      progress_unit: 'seniors',
      volunteers_needed: 25,
      collaborators: [partnerOrg2Id],
    },
  ])

  if (projectsError) {
    console.error('❌ Error creating projects:', projectsError)
  } else {
    console.log('✓ Created 2 projects', projectsData ? `(returned ${projectsData.length} rows)` : '(no data returned)')
  }

  console.log('\n✨ Database seeded successfully!')
  console.log(`\n📊 Summary:
  - 5 posts
  - 3 events
  - 2 projects
  - Test org: ${testOrgId}
  - Test user: ${testUser.email}
`)
}

seedDatabase().catch(console.error)
