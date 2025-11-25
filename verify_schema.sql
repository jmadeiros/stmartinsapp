-- ============================================================================
-- Verify Schema After Simplification
-- ============================================================================

-- 1. List all tables
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. List all views
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'VIEW'
ORDER BY table_name;

-- 3. Check key tables exist
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN 'YES'
    ELSE 'NO'
  END as user_profiles_exists,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN 'YES'
    ELSE 'NO'
  END as organizations_exists,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN 'YES'
    ELSE 'NO'
  END as posts_exists,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN 'YES'
    ELSE 'NO'
  END as events_exists,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN 'YES'
    ELSE 'NO'
  END as projects_exists,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN 'YES'
    ELSE 'NO'
  END as chat_messages_exists;

-- 4. Check removed tables are gone
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN 'STILL EXISTS!'
    ELSE 'Removed'
  END as conversations_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN 'STILL EXISTS!'
    ELSE 'Removed'
  END as messages_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connection_requests') THEN 'STILL EXISTS!'
    ELSE 'Removed'
  END as connection_requests_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_memberships') THEN 'STILL EXISTS!'
    ELSE 'Removed'
  END as user_memberships_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_tasks') THEN 'STILL EXISTS!'
    ELSE 'Removed'
  END as project_tasks_status;

-- 5. Verify user_profiles has organization_id column
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('organization_id', 'role', 'user_id', 'display_name')
ORDER BY column_name;

-- 6. Count data in key tables
SELECT
  (SELECT COUNT(*) FROM public.posts) as posts_count,
  (SELECT COUNT(*) FROM public.events) as events_count,
  (SELECT COUNT(*) FROM public.projects) as projects_count,
  (SELECT COUNT(*) FROM public.user_profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.organizations) as orgs_count;
