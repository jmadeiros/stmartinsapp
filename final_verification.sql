-- ============================================================================
-- Final Schema Verification After All Migrations
-- ============================================================================

-- 1. Count tables and views
SELECT
  table_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type IN ('BASE TABLE', 'VIEW')
GROUP BY table_type
ORDER BY table_type;

-- 2. List all views
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'VIEW'
ORDER BY table_name;

-- 3. List all tables
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 4. Verify key tables removed
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN 'REMOVED'
    ELSE 'STILL EXISTS!'
  END as jobs_table,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_memberships') THEN 'REMOVED'
    ELSE 'STILL EXISTS!'
  END as user_memberships_table,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN 'REMOVED'
    ELSE 'STILL EXISTS!'
  END as conversations_table;

-- 5. Verify user_profiles has correct columns
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('organization_id', 'role', 'full_name')
ORDER BY column_name;

-- 6. Data counts
SELECT
  'posts' as table_name,
  COUNT(*) as count
FROM public.posts
UNION ALL
SELECT
  'events' as table_name,
  COUNT(*) as count
FROM public.events
UNION ALL
SELECT
  'projects' as table_name,
  COUNT(*) as count
FROM public.projects
UNION ALL
SELECT
  'user_profiles' as table_name,
  COUNT(*) as count
FROM public.user_profiles
UNION ALL
SELECT
  'organizations' as table_name,
  COUNT(*) as count
FROM public.organizations
UNION ALL
SELECT
  'chat_messages' as table_name,
  COUNT(*) as count
FROM public.chat_messages;

-- 7. Test each view works
SELECT 'feed' as view_name, COUNT(*) as row_count FROM public.feed
UNION ALL
SELECT 'calendar' as view_name, COUNT(*) as row_count FROM public.calendar
UNION ALL
SELECT 'opportunities' as view_name, COUNT(*) as row_count FROM public.opportunities
UNION ALL
SELECT 'people' as view_name, COUNT(*) as row_count FROM public.people
UNION ALL
SELECT 'projects_view' as view_name, COUNT(*) as row_count FROM public.projects_view;

-- 8. Final summary
SELECT
  jsonb_build_object(
    'total_tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
    'total_views', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'VIEW'),
    'posts', (SELECT COUNT(*) FROM public.posts),
    'events', (SELECT COUNT(*) FROM public.events),
    'projects', (SELECT COUNT(*) FROM public.projects),
    'profiles', (SELECT COUNT(*) FROM public.user_profiles),
    'organizations', (SELECT COUNT(*) FROM public.organizations),
    'schema_status', CASE
      WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') = 16
        AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'VIEW') = 5
        AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs')
        AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_memberships')
      THEN 'PERFECT ✓'
      ELSE 'CHECK NEEDED'
    END
  ) as final_verification;
