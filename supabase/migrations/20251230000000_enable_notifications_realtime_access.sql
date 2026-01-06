-- Ensure Supabase Realtime can read notification rows when RLS is enabled
-- Without this grant, the Realtime server can't evaluate RLS and no events are delivered
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime') THEN
    GRANT USAGE ON SCHEMA public TO supabase_realtime;
    GRANT SELECT ON public.notifications TO supabase_realtime;
  END IF;
END $$;

-- Reassert replica identity for filtered subscriptions (safe if already set)
ALTER TABLE IF EXISTS public.notifications REPLICA IDENTITY FULL;

-- Keep notifications in the realtime publication (no-op if already present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END IF;
END $$;
