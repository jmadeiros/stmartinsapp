import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('URL:', supabaseUrl?.substring(0, 30) + '...')

async function testRsvp() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Testing RSVP functionality...')

  // Get an event
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, organizer_id, org_id')
    .limit(1)

  if (eventsError || !events?.length) {
    console.error('Failed to get event:', eventsError)
    return
  }

  const event = events[0]
  console.log('Found event:', event.title, '- ID:', event.id)

  // Check existing RSVPs for this event
  const { data: existingRsvps, error: rsvpError } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', event.id)

  console.log('Existing RSVPs for this event:', existingRsvps?.length || 0)
  if (rsvpError) {
    console.error('Error fetching RSVPs:', rsvpError)
  } else if (existingRsvps?.length) {
    console.log('RSVP data:', JSON.stringify(existingRsvps, null, 2))
  }

  // Check all RSVPs in the table
  const { data: allRsvps, count } = await supabase
    .from('event_rsvps')
    .select('*', { count: 'exact' })

  console.log('Total RSVPs in database:', count || allRsvps?.length || 0)
  if (allRsvps?.length) {
    console.log('All RSVPs:', JSON.stringify(allRsvps, null, 2))
  }
}

testRsvp().catch(console.error)
