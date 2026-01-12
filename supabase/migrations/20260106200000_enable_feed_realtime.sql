-- Enable Realtime for feed-related tables
-- This allows real-time updates for posts, comments, reactions, and RSVPs without page refresh
-- NOTE: Run `npx supabase db push` to apply this migration

-- Set REPLICA IDENTITY FULL for filtered realtime subscriptions
-- This is REQUIRED for realtime filters like `filter: org_id=eq.${orgId}` to work
-- Without REPLICA IDENTITY FULL, filtered subscriptions won't receive changes

-- Posts table - main feed content
ALTER TABLE IF EXISTS public.posts REPLICA IDENTITY FULL;

-- Post comments - comments on posts
ALTER TABLE IF EXISTS public.post_comments REPLICA IDENTITY FULL;

-- Post reactions - likes/reactions on posts
ALTER TABLE IF EXISTS public.post_reactions REPLICA IDENTITY FULL;

-- Event RSVPs - attendance tracking
ALTER TABLE IF EXISTS public.event_rsvps REPLICA IDENTITY FULL;

-- Project interest - collaboration interest tracking
ALTER TABLE IF EXISTS public.project_interest REPLICA IDENTITY FULL;

-- Event comments - comments on events
ALTER TABLE IF EXISTS public.event_comments REPLICA IDENTITY FULL;

-- Project comments - comments on projects
ALTER TABLE IF EXISTS public.project_comments REPLICA IDENTITY FULL;

-- Event reactions - reactions on events
ALTER TABLE IF EXISTS public.event_reactions REPLICA IDENTITY FULL;

-- Project reactions - reactions on projects
ALTER TABLE IF EXISTS public.project_reactions REPLICA IDENTITY FULL;

-- Add feed tables to the realtime publication
-- Using DO block to handle case where table is already in publication
DO $$
BEGIN
  -- posts
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'posts already in publication';
  END;

  -- post_comments
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'post_comments already in publication';
  END;

  -- post_reactions
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'post_reactions already in publication';
  END;

  -- event_rsvps
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'event_rsvps already in publication';
  END;

  -- project_interest
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_interest;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'project_interest already in publication';
  END;

  -- event_comments
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_comments;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'event_comments already in publication';
  END;

  -- project_comments
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_comments;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'project_comments already in publication';
  END;

  -- event_reactions
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_reactions;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'event_reactions already in publication';
  END;

  -- project_reactions
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_reactions;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'project_reactions already in publication';
  END;
END $$;

-- Note: On hosted Supabase, realtime permissions are managed internally
-- No explicit GRANT statements needed - the publication handles access
