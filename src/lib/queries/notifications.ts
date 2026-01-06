import type { RealtimeChannel } from '@supabase/supabase-js'
import type { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/collaboration.types'

/**
 * Subscribe to real-time notification updates for a user
 *
 * This enables instant notification delivery instead of polling.
 * RLS policies ensure users only receive their own notifications.
 *
 * IMPORTANT: The notifications table must have:
 * 1. REPLICA IDENTITY FULL set (for filtered subscriptions to work)
 * 2. Be added to the supabase_realtime publication
 *
 * Run the migration: 20251229010000_fix_realtime_replica_identity.sql
 */
export function subscribeToUserNotifications(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  onInsert: (notification: Notification) => void,
  onUpdate: (notification: Notification) => void
): RealtimeChannel {
  console.log('[Notifications Realtime] Creating subscription for user:', userId)

  const channel = supabase.channel(`notifications:${userId}`)

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        console.log('[Notifications Realtime] INSERT received:', payload)
        onInsert(payload.new as Notification)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        console.log('[Notifications Realtime] UPDATE received:', payload)
        onUpdate(payload.new as Notification)
      }
    )
    .subscribe((status, err) => {
      console.log('[Notifications Realtime] Subscription status:', status, 'for user:', userId)
      if (err) {
        console.error('[Notifications Realtime] Subscription error:', err)
        console.error('[Notifications Realtime] This may be due to:')
        console.error('  1. REPLICA IDENTITY FULL not set on notifications table')
        console.error('  2. Table not in supabase_realtime publication')
        console.error('  3. RLS policies blocking access')
      }
      if (status === 'SUBSCRIBED') {
        console.log('[Notifications Realtime] Successfully subscribed! Waiting for notifications...')
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('[Notifications Realtime] Channel error - check Supabase Realtime configuration')
        console.error('  Run: ALTER TABLE public.notifications REPLICA IDENTITY FULL;')
      }
      if (status === 'TIMED_OUT') {
        console.error('[Notifications Realtime] Subscription timed out - check network or Supabase status')
      }
    })

  return channel
}
