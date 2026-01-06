import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecentItems() {
  console.log('\n=== Recent Events (last 5) ===')
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, org_id, organizer_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (eventsError) console.error('Events error:', eventsError)
  else console.table(events)

  console.log('\n=== Recent Projects (last 5) ===')
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, org_id, author_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (projectsError) console.error('Projects error:', projectsError)
  else console.table(projects)

  console.log('\n=== Sarah User Profile ===')
  const { data: sarah, error: sarahError } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, organization_id')
    .ilike('full_name', '%sarah%')
    .limit(1)

  if (sarahError) console.error('Sarah error:', sarahError)
  else console.table(sarah)

  // Check what org_id the dashboard would use
  if (sarah && sarah[0]) {
    console.log('\n=== Events for Sarah org_id ===')
    const { data: sarahEvents } = await supabase
      .from('events')
      .select('id, title, org_id')
      .eq('org_id', sarah[0].organization_id)
      .order('created_at', { ascending: false })
      .limit(5)
    console.table(sarahEvents)
  }
}

checkRecentItems()
