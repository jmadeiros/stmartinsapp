-- Temporarily disable RLS for development
-- WARNING: Only use in development! Re-enable for production

BEGIN;

-- Disable RLS on main tables
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- You can also drop existing policies if needed:
-- DROP POLICY IF EXISTS "Users can view posts in their org" ON public.posts;
-- DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
-- etc.

COMMIT;

-- Verify RLS is disabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('posts', 'events', 'projects', 'user_profiles', 'organizations')
ORDER BY tablename;
