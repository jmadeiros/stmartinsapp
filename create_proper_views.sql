-- ============================================================================
-- Create Proper Views for MVP
-- ============================================================================
-- This removes the jobs table and jobs_board view, and creates proper views:
-- - feed (already exists - unified feed)
-- - opportunities (opportunity posts)
-- - events_view (upcoming events with RSVP counts)
-- - projects_view (active projects with interest counts)
-- - people (team members in organization)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DROP JOBS TABLE AND OLD JOBS_BOARD VIEW
-- ============================================================================

DROP VIEW IF EXISTS public.jobs_board CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;

-- ============================================================================
-- 2. CREATE OPPORTUNITIES VIEW
-- ============================================================================

CREATE VIEW public.opportunities AS
SELECT
  p.id,
  p.org_id,
  p.author_id,
  p.title,
  p.content as description,
  p.image_url,
  p.created_at,
  p.updated_at,
  p.is_pinned,
  p.view_count,
  -- Count reactions
  (SELECT COUNT(*) FROM public.post_reactions pr WHERE pr.post_id = p.id) as reaction_count,
  -- Count comments
  (SELECT COUNT(*) FROM public.post_comments pc WHERE pc.post_id = p.id AND pc.deleted_at IS NULL) as comment_count
FROM public.posts p
WHERE p.category = 'opportunities'
  AND p.deleted_at IS NULL
ORDER BY p.is_pinned DESC, p.created_at DESC;

-- ============================================================================
-- 3. CREATE CALENDAR VIEW
-- ============================================================================

CREATE VIEW public.calendar AS
SELECT
  e.id,
  e.org_id,
  e.organizer_id,
  e.title,
  e.description,
  e.location,
  e.start_time,
  e.end_time,
  e.volunteers_needed,
  e.seeking_partners,
  e.created_at,
  e.updated_at,
  -- Count RSVPs
  (SELECT COUNT(*) FROM public.event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as going_count,
  (SELECT COUNT(*) FROM public.event_rsvps er WHERE er.event_id = e.id AND er.status = 'interested') as interested_count,
  -- Check if event is upcoming
  CASE WHEN e.start_time > now() THEN true ELSE false END as is_upcoming
FROM public.events e
WHERE e.deleted_at IS NULL
ORDER BY e.start_time ASC;

-- ============================================================================
-- 4. CREATE PROJECTS VIEW
-- ============================================================================

CREATE VIEW public.projects_view AS
SELECT
  p.id,
  p.org_id,
  p.author_id,
  p.title,
  p.description,
  p.impact_goal,
  p.cause,
  p.service_area,
  p.target_date,
  p.status,
  p.progress_current,
  p.progress_target,
  p.progress_unit,
  p.volunteers_needed,
  p.fundraising_goal,
  p.seeking_partners,
  p.created_at,
  p.updated_at,
  -- Calculate progress percentage
  CASE
    WHEN p.progress_target > 0 THEN ROUND((p.progress_current::numeric / p.progress_target::numeric) * 100)
    ELSE 0
  END as progress_percentage,
  -- Count interested users
  (SELECT COUNT(*) FROM public.project_interest pi WHERE pi.project_id = p.id) as interest_count,
  -- Count updates
  (SELECT COUNT(*) FROM public.project_updates pu WHERE pu.project_id = p.id) as update_count
FROM public.projects p
WHERE p.deleted_at IS NULL
ORDER BY p.created_at DESC;

-- ============================================================================
-- 5. CREATE PEOPLE VIEW
-- ============================================================================

CREATE VIEW public.people AS
SELECT
  up.user_id as id,
  up.full_name,
  up.bio,
  up.avatar_url,
  up.job_title,
  up.phone,
  up.skills,
  up.interests,
  up.contact_email,
  up.contact_phone,
  up.linkedin_url,
  up.visibility,
  up.organization_id,
  up.role,
  up.created_at,
  up.updated_at,
  up.last_active_at,
  o.name as organization_name,
  -- Count posts by user
  (SELECT COUNT(*) FROM public.posts p WHERE p.author_id = up.user_id AND p.deleted_at IS NULL) as post_count,
  -- Count projects by user
  (SELECT COUNT(*) FROM public.projects pr WHERE pr.author_id = up.user_id AND pr.deleted_at IS NULL) as project_count,
  -- Count events organized
  (SELECT COUNT(*) FROM public.events e WHERE e.organizer_id = up.user_id AND e.deleted_at IS NULL) as event_count
FROM public.user_profiles up
LEFT JOIN public.organizations o ON o.id = up.organization_id
ORDER BY up.full_name ASC;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all views
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'VIEW'
ORDER BY table_name;

-- Should show 5 views:
-- 1. calendar (upcoming events with RSVPs)
-- 2. feed (unified posts/events/projects)
-- 3. opportunities (opportunity posts)
-- 4. people (team members)
-- 5. projects_view (active projects)
