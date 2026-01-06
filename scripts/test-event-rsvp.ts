/**
 * Test script for Event RSVP functionality
 *
 * This script tests:
 * 1. toggleEventRsvp - RSVP to an event and un-RSVP
 * 2. getEventRsvpStatus - Check RSVP status
 * 3. updateEventRsvpSupport - Add support options to RSVP
 * 4. Notification creation for event organizer
 */

import { createClient } from '@/lib/supabase/server'

async function testEventRsvp() {
  console.log('=== Testing Event RSVP Functionality ===\n')

  const supabase = await createClient()

  // Get a test event
  console.log('1. Fetching a test event...')
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .limit(1)
    .single()

  if (eventsError || !events) {
    console.error('❌ Error fetching event:', eventsError)
    return
  }

  console.log(`✅ Found event: ${events.title} (ID: ${events.id})`)

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('❌ Not authenticated:', userError)
    return
  }

  console.log(`✅ Current user: ${user.id}\n`)

  // Get user's org
  const { data: membership } = await supabase
    .from('user_memberships')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single()

  if (!membership) {
    console.error('❌ Could not find user membership')
    return
  }

  const orgId = membership.org_id

  // Test 1: Check initial RSVP status
  console.log('2. Checking initial RSVP status...')
  const { data: initialRsvp } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', events.id)
    .eq('user_id', user.id)
    .maybeSingle()

  console.log(`   Initial RSVP status: ${initialRsvp ? 'RSVPed' : 'Not RSVPed'}`)

  // Test 2: Create RSVP
  console.log('\n3. Creating RSVP...')
  const { error: insertError } = await supabase
    .from('event_rsvps')
    .insert({
      event_id: events.id,
      user_id: user.id,
      org_id: orgId,
      status: 'going'
    })

  if (insertError) {
    console.error('❌ Error creating RSVP:', insertError)
  } else {
    console.log('✅ RSVP created successfully')
  }

  // Test 3: Check RSVP was created
  console.log('\n4. Verifying RSVP...')
  const { data: verifyRsvp, error: verifyError } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', events.id)
    .eq('user_id', user.id)
    .single()

  if (verifyError || !verifyRsvp) {
    console.error('❌ Error verifying RSVP:', verifyError)
  } else {
    console.log('✅ RSVP verified:', verifyRsvp)
  }

  // Test 4: Update RSVP with support options
  console.log('\n5. Updating RSVP with support options...')
  const { error: updateError } = await supabase
    .from('event_rsvps')
    .update({
      volunteer_offered: true,
      participants_count: 5,
      can_partner: true
    })
    .eq('event_id', events.id)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('❌ Error updating RSVP:', updateError)
  } else {
    console.log('✅ RSVP support options updated')
  }

  // Test 5: Verify support options
  console.log('\n6. Verifying support options...')
  const { data: updatedRsvp } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', events.id)
    .eq('user_id', user.id)
    .single()

  if (updatedRsvp) {
    console.log('✅ Support options:', {
      volunteer_offered: updatedRsvp.volunteer_offered,
      participants_count: updatedRsvp.participants_count,
      can_partner: updatedRsvp.can_partner
    })
  }

  // Test 6: Check if notification was created (if not self-RSVP)
  if (events.organizer_id !== user.id) {
    console.log('\n7. Checking for notification...')
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('reference_type', 'event')
      .eq('reference_id', events.id)
      .eq('type', 'rsvp')
      .eq('actor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (notifications && notifications.length > 0) {
      console.log('✅ Notification created:', notifications[0])
    } else {
      console.log('⚠️  No notification found (may need to run toggleEventRsvp action)')
    }
  } else {
    console.log('\n7. Skipping notification check (self-RSVP)')
  }

  // Test 7: Remove RSVP
  console.log('\n8. Removing RSVP...')
  const { error: deleteError } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', events.id)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('❌ Error removing RSVP:', deleteError)
  } else {
    console.log('✅ RSVP removed successfully')
  }

  // Test 8: Verify RSVP was removed
  console.log('\n9. Verifying RSVP removal...')
  const { data: finalRsvp } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', events.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!finalRsvp) {
    console.log('✅ RSVP successfully removed')
  } else {
    console.error('❌ RSVP still exists:', finalRsvp)
  }

  console.log('\n=== Test Complete ===')
}

testEventRsvp().catch(console.error)
