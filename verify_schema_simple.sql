-- ============================================================================
-- Simple Schema Verification - Single Query Result
-- ============================================================================

-- Create a comprehensive verification result
WITH
  table_list AS (
    SELECT
      array_agg(table_name ORDER BY table_name) as tables
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ),
  view_list AS (
    SELECT
      array_agg(table_name ORDER BY table_name) as views
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'VIEW'
  ),
  table_counts AS (
    SELECT
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'VIEW') as total_views
  ),
  key_tables_check AS (
    SELECT
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') as has_user_profiles,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') as has_organizations,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') as has_posts,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') as has_events,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') as has_projects,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') as has_chat_messages
  ),
  removed_tables_check AS (
    SELECT
      NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') as conversations_removed,
      NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') as messages_removed,
      NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connection_requests') as connection_requests_removed,
      NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_memberships') as user_memberships_removed,
      NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_tasks') as project_tasks_removed
  ),
  profile_columns_check AS (
    SELECT
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'organization_id') as has_organization_id,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role') as has_role,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'user_id') as has_user_id
  ),
  data_counts AS (
    SELECT
      (SELECT COUNT(*) FROM public.posts) as posts_count,
      (SELECT COUNT(*) FROM public.events) as events_count,
      (SELECT COUNT(*) FROM public.projects) as projects_count,
      (SELECT COUNT(*) FROM public.user_profiles) as profiles_count,
      (SELECT COUNT(*) FROM public.organizations) as orgs_count,
      (SELECT COUNT(*) FROM public.chat_messages) as chat_count
  )
SELECT
  jsonb_build_object(
    'schema_counts', jsonb_build_object(
      'total_tables', tc.total_tables,
      'total_views', tc.total_views
    ),
    'all_tables', tl.tables,
    'all_views', vl.views,
    'key_tables_exist', jsonb_build_object(
      'user_profiles', kt.has_user_profiles,
      'organizations', kt.has_organizations,
      'posts', kt.has_posts,
      'events', kt.has_events,
      'projects', kt.has_projects,
      'chat_messages', kt.has_chat_messages
    ),
    'removed_tables', jsonb_build_object(
      'conversations', rt.conversations_removed,
      'messages', rt.messages_removed,
      'connection_requests', rt.connection_requests_removed,
      'user_memberships', rt.user_memberships_removed,
      'project_tasks', rt.project_tasks_removed
    ),
    'user_profiles_schema', jsonb_build_object(
      'has_organization_id', pc.has_organization_id,
      'has_role', pc.has_role,
      'has_user_id', pc.has_user_id
    ),
    'data_counts', jsonb_build_object(
      'posts', dc.posts_count,
      'events', dc.events_count,
      'projects', dc.projects_count,
      'profiles', dc.profiles_count,
      'organizations', dc.orgs_count,
      'chat_messages', dc.chat_count
    ),
    'verification_status', CASE
      WHEN tc.total_tables = 17
        AND tc.total_views = 2
        AND kt.has_user_profiles AND kt.has_organizations AND kt.has_posts AND kt.has_events AND kt.has_projects AND kt.has_chat_messages
        AND rt.conversations_removed AND rt.messages_removed AND rt.connection_requests_removed AND rt.user_memberships_removed AND rt.project_tasks_removed
        AND pc.has_organization_id AND pc.has_role AND pc.has_user_id
      THEN 'PASS'
      ELSE 'FAIL'
    END
  ) as verification_result
FROM table_list tl, view_list vl, table_counts tc, key_tables_check kt, removed_tables_check rt, profile_columns_check pc, data_counts dc;
