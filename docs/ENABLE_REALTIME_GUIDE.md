# Supabase Realtime Setup Guide for Chat Tables

This guide provides step-by-step instructions to enable Supabase Realtime for the chat tables in The Village Hub application.

## Overview

Supabase Realtime uses PostgreSQL's built-in replication functionality to broadcast database changes to connected clients. To enable Realtime for your chat tables, you need to:

1. Add tables to the Realtime publication
2. Ensure RLS policies are properly configured
3. Set up client-side subscriptions

## Current Chat Tables

The following tables need Realtime enabled:
- `public.conversations` - Direct messages and group chats
- `public.messages` - Individual chat messages
- `public.conversation_participants` - Chat membership
- `public.conversation_unread` - Unread message counts

## Method 1: Enable via Supabase Dashboard (Recommended)

### Step 1: Access the Database Replication Settings

1. Go to your Supabase project dashboard at `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`
2. Click on **Database** in the left sidebar
3. Click on **Replication** in the sub-menu

### Step 2: Enable Realtime for Chat Tables

You'll see a list of all your database tables. For each of the following tables, enable Realtime replication:

#### Enable for `conversations` table:
1. Find `public.conversations` in the table list
2. Toggle the switch in the "Realtime" column to **ON** (it will turn green)
3. Confirm the action if prompted

#### Enable for `messages` table:
1. Find `public.messages` in the table list
2. Toggle the switch in the "Realtime" column to **ON**
3. Confirm the action if prompted

#### Enable for `conversation_unread` table:
1. Find `public.conversation_unread` in the table list
2. Toggle the switch in the "Realtime" column to **ON**
3. Confirm the action if prompted

#### Enable for `conversation_participants` table:
1. Find `public.conversation_participants` in the table list
2. Toggle the switch in the "Realtime" column to **ON**
3. Confirm the action if prompted

### Step 3: Verify Realtime is Enabled

After enabling, you should see all four tables with green "ON" toggles in the Realtime column.

## Method 2: Enable via SQL Editor (Alternative)

If you prefer to enable Realtime using SQL, you can use the Supabase Dashboard SQL Editor:

### Step 1: Open SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Run the Publication Commands

Copy and paste the following SQL and click **Run**:

```sql
-- Add chat tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_unread;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
```

### Step 3: Verify Publication

Run this query to verify the tables were added:

```sql
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
AND tablename IN ('conversations', 'messages', 'conversation_unread', 'conversation_participants');
```

You should see all four tables listed in the results.

## Method 3: Enable via Supabase CLI (For Migrations)

**Important Note:** This method does NOT work with local migrations run via `supabase db push` because the `supabase_realtime` publication doesn't exist in local development environments. This is why the commands are commented out in your migration file.

However, you can create a migration that will be applied when deployed to your hosted Supabase project:

### Create a Realtime Migration

Create a new migration file:

```bash
npx supabase migration new enable_chat_realtime
```

Add this content to the new migration file:

```sql
-- Enable Realtime for chat tables
-- Note: This will only work when applied to hosted Supabase (not local dev)

BEGIN;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversation_unread;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversation_participants;

COMMIT;
```

### Deploy the Migration

Push the migration to your hosted project:

```bash
npx supabase db push
```

**Note:** You may see errors when running this locally, but it will work when deployed to your hosted Supabase project.

## RLS Considerations for Realtime

### How RLS Works with Realtime

Realtime subscriptions **respect RLS policies**. This means:

1. Users will only receive Realtime updates for rows they have SELECT permission for
2. The RLS policies are evaluated using the authenticated user's JWT token
3. Even if a row is inserted, users won't receive the update unless their RLS policies allow them to SELECT it

### Current RLS Policies (Already Configured)

Your chat tables already have proper RLS policies configured:

#### Conversations Table
- Users can only see conversations they're participants in
- Policies use `EXISTS` checks against `conversation_participants`

#### Messages Table
- Users can only see messages in conversations they're participants in
- Policies check membership before allowing access

#### Conversation Unread Table
- Users can only see their own unread counts
- Policies check `user_id = auth.uid()`

#### Conversation Participants Table
- Users can only see participants in conversations they're members of

### Security Best Practices

1. **Always use RLS with Realtime** - Never disable RLS on tables with Realtime enabled
2. **Test subscriptions with multiple users** - Verify users only receive updates they should see
3. **Use filters in subscriptions** - Add additional client-side filters for performance:

```typescript
supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}` // Client-side filter
    },
    (payload) => {
      // Handle new message
    }
  )
  .subscribe()
```

## Client-Side Implementation

### Basic Message Subscription

Here's how to subscribe to new messages in a conversation:

```typescript
import { createClient } from '@/lib/supabase/client'

export function useMessageSubscription(conversationId: string) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message:', payload.new)
          // Add message to UI
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])
}
```

### Subscribe to All User Conversations

For the conversations list page:

```typescript
import { createClient } from '@/lib/supabase/client'

export function useConversationsSubscription(userId: string) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('user-conversations')
      .on(
        'postgres_changes',
        {
          event: '*', // All events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversations'
        },
        async (payload) => {
          // Verify user is a participant (RLS already filters, this is extra safety)
          const { data: isParticipant } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', payload.new.id)
            .eq('user_id', userId)
            .single()

          if (isParticipant) {
            console.log('Conversation updated:', payload)
            // Update conversations list
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
```

### Subscribe to Unread Counts

For real-time unread count updates:

```typescript
import { createClient } from '@/lib/supabase/client'

export function useUnreadCountSubscription(userId: string) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('unread-counts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_unread',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Unread count changed:', payload)
          // Update unread badge
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
```

## Testing Realtime

### Step 1: Verify Realtime is Working

Use the Supabase Dashboard to test:

1. Go to **Database** → **Replication**
2. Click on one of your enabled tables (e.g., `messages`)
3. You should see a "Subscribe to changes" option
4. Open your application in another tab and send a message
5. Watch for the update to appear in the Dashboard

### Step 2: Test RLS Filtering

1. Create two test users (User A and User B)
2. Create a conversation between them
3. Have User A subscribe to messages
4. Send a message as User B
5. Verify User A receives the update
6. Create a separate conversation (User B and User C)
7. Send a message in that conversation
8. Verify User A does NOT receive that update (RLS filtering)

### Step 3: Monitor Realtime Logs

In the Supabase Dashboard:

1. Go to **Logs** → **Realtime**
2. Watch for subscription events
3. Look for any errors or warnings

## Troubleshooting

### Issue: "supabase_realtime publication does not exist" (Local Dev)

**Solution:** This is expected behavior. The `supabase_realtime` publication only exists in hosted Supabase projects, not in local development. Either:
- Enable Realtime via the Dashboard on your hosted project
- Accept that Realtime won't work in local dev (use polling as fallback)

### Issue: Not Receiving Realtime Updates

**Check:**
1. Is the table added to the publication? (Verify in Dashboard → Replication)
2. Are RLS policies allowing SELECT on the rows? (Test with SQL queries)
3. Is the client subscribed to the correct channel?
4. Is the user authenticated? (Realtime requires valid JWT)
5. Check browser console for subscription errors

### Issue: Receiving Updates for Wrong User's Data

**Check:**
1. RLS policies are enabled on the table
2. RLS policies are using `auth.uid()` correctly
3. User's JWT token is valid and not expired
4. Test RLS policies with `SELECT` queries first

### Issue: High Database Load from Realtime

**Solutions:**
1. Use client-side filters in subscriptions (e.g., `filter: 'conversation_id=eq.123'`)
2. Subscribe to specific events instead of all events (use `event: 'INSERT'` not `event: '*'`)
3. Unsubscribe from channels when components unmount
4. Consider using Presence for user online status instead of database polling

## Performance Optimization

### 1. Use Specific Event Filters

Instead of:
```typescript
.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, ...)
```

Use:
```typescript
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ...)
```

### 2. Add Column Filters

For large tables:
```typescript
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  },
  ...
)
```

### 3. Reuse Channels

Don't create multiple subscriptions to the same table. Reuse a single channel:

```typescript
const channel = supabase.channel('chat')
  .on('postgres_changes', { /* messages config */ }, handleMessage)
  .on('postgres_changes', { /* unread config */ }, handleUnread)
  .subscribe()
```

### 4. Clean Up Subscriptions

Always unsubscribe when components unmount:

```typescript
useEffect(() => {
  const channel = supabase.channel('chat').subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## Alternative Approaches

### 1. Postgres Triggers + Edge Functions

For complex business logic, you can:
1. Use Postgres triggers to detect changes
2. Call Supabase Edge Functions
3. Use Edge Functions to send webhooks or push notifications

**Pros:** More control over what gets sent
**Cons:** More complex, requires additional infrastructure

### 2. Polling (Fallback for Local Dev)

For local development without Realtime:

```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(50)

    // Update messages
  }, 3000) // Poll every 3 seconds

  return () => clearInterval(interval)
}, [conversationId])
```

**Pros:** Works in local dev
**Cons:** Higher database load, not real-time

### 3. Supabase Broadcast (for Ephemeral Data)

For typing indicators or online status (not persisted to DB):

```typescript
const channel = supabase.channel('room1')

// Send typing indicator
channel.send({
  type: 'broadcast',
  event: 'typing',
  payload: { user_id: userId, typing: true }
})

// Receive typing indicators
channel.on('broadcast', { event: 'typing' }, (payload) => {
  console.log('User typing:', payload)
})
```

**Pros:** No database writes, very fast
**Cons:** Not persisted, doesn't respect RLS

## Summary Checklist

- [ ] Enable Realtime for `conversations` table (Dashboard or SQL)
- [ ] Enable Realtime for `messages` table (Dashboard or SQL)
- [ ] Enable Realtime for `conversation_unread` table (Dashboard or SQL)
- [ ] Enable Realtime for `conversation_participants` table (Dashboard or SQL)
- [ ] Verify RLS policies are enabled on all tables
- [ ] Test Realtime subscriptions with multiple users
- [ ] Verify RLS filtering works (users only see their data)
- [ ] Implement client-side subscriptions in React components
- [ ] Add proper cleanup (unsubscribe) in useEffect hooks
- [ ] Test in production environment (Realtime doesn't work in local dev)
- [ ] Monitor Realtime logs for errors
- [ ] Add error handling for subscription failures

## Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [RLS with Realtime](https://supabase.com/docs/guides/realtime/postgres-changes#rls-with-realtime)
- [Client-side Subscriptions](https://supabase.com/docs/reference/javascript/subscribe)

## Next Steps

1. Enable Realtime via the Dashboard (Method 1 recommended)
2. Implement the client-side subscription hooks shown above
3. Test with multiple users to verify RLS is working correctly
4. Add error handling and loading states
5. Monitor performance and optimize filters as needed

---

**Last Updated:** December 15, 2025
**Project:** The Village Hub - Chat Feature
