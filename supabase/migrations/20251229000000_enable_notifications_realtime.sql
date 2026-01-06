-- Enable Realtime for notifications table
-- This allows real-time notification updates without page refresh
-- NOTE: Run `npx supabase db push` to apply this migration

-- Set REPLICA IDENTITY FULL for filtered realtime subscriptions
-- This is REQUIRED for realtime filters like `filter: user_id=eq.${userId}` to work
-- Without REPLICA IDENTITY FULL, filtered subscriptions won't receive changes
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add notifications table to the realtime publication
-- Using DO block to handle case where table is already in publication
DO $$
BEGIN
  -- notifications
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'notifications already in publication';
  END;
END $$;
