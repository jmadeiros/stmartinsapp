-- Comprehensive RLS Policy Fix for All Social Feature Tables
-- This migration ensures all tables have proper RLS policies for:
-- - SELECT: Who can read records
-- - INSERT: Who can create records (with appropriate author/user checks)
-- - UPDATE: Who can update records (typically own records only)
-- - DELETE: Who can delete records (typically own records only)

-- ============================================================================
-- 1. POSTS TABLE
-- ============================================================================
-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
DROP POLICY IF EXISTS "Users can read posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

-- Authenticated users can read all posts
CREATE POLICY "posts_select_policy"
ON public.posts FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create posts (must be the author)
CREATE POLICY "posts_insert_policy"
ON public.posts FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

-- Users can update their own posts
CREATE POLICY "posts_update_policy"
ON public.posts FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Users can delete (soft delete) their own posts
CREATE POLICY "posts_delete_policy"
ON public.posts FOR DELETE TO authenticated
USING (author_id = auth.uid());

-- ============================================================================
-- 2. POST_COMMENTS TABLE
-- ============================================================================
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_comments_select_policy" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_insert_policy" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_update_policy" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_delete_policy" ON public.post_comments;
DROP POLICY IF EXISTS "Users can read comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;

-- Authenticated users can read all comments
CREATE POLICY "post_comments_select_policy"
ON public.post_comments FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create comments (must be the author)
CREATE POLICY "post_comments_insert_policy"
ON public.post_comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "post_comments_update_policy"
ON public.post_comments FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "post_comments_delete_policy"
ON public.post_comments FOR DELETE TO authenticated
USING (author_id = auth.uid());

-- ============================================================================
-- 3. POST_REACTIONS TABLE
-- ============================================================================
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_reactions_select_policy" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_insert_policy" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_delete_policy" ON public.post_reactions;
DROP POLICY IF EXISTS "View reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Create own reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Delete own reactions" ON public.post_reactions;

-- Authenticated users can read all reactions
CREATE POLICY "post_reactions_select_policy"
ON public.post_reactions FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create reactions (must be the user)
CREATE POLICY "post_reactions_insert_policy"
ON public.post_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own reactions
CREATE POLICY "post_reactions_delete_policy"
ON public.post_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 4. POST_MENTIONS TABLE
-- ============================================================================
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_mentions_select_policy" ON public.post_mentions;
DROP POLICY IF EXISTS "post_mentions_insert_policy" ON public.post_mentions;
DROP POLICY IF EXISTS "post_mentions_delete_policy" ON public.post_mentions;

-- Authenticated users can read all mentions
CREATE POLICY "post_mentions_select_policy"
ON public.post_mentions FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create mentions (for posts they authored)
-- Note: The post's author_id should match the current user
CREATE POLICY "post_mentions_insert_policy"
ON public.post_mentions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_id AND posts.author_id = auth.uid()
  )
);

-- Users can delete mentions they created (for their own posts)
CREATE POLICY "post_mentions_delete_policy"
ON public.post_mentions FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_id AND posts.author_id = auth.uid()
  )
);

-- ============================================================================
-- 5. NOTIFICATIONS TABLE
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

-- Users can read their own notifications (where they are the recipient)
CREATE POLICY "notifications_select_policy"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can create notifications for others (where they are the actor)
-- This allows User A to create a notification for User B when A comments on B's post
CREATE POLICY "notifications_insert_policy"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "notifications_update_policy"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_policy"
ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 6. EVENTS TABLE
-- ============================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;
DROP POLICY IF EXISTS "events_delete_policy" ON public.events;

-- Authenticated users can read all events
CREATE POLICY "events_select_policy"
ON public.events FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create events (must be the organizer)
CREATE POLICY "events_insert_policy"
ON public.events FOR INSERT TO authenticated
WITH CHECK (organizer_id = auth.uid());

-- Users can update events they organized
CREATE POLICY "events_update_policy"
ON public.events FOR UPDATE TO authenticated
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

-- Users can delete events they organized
CREATE POLICY "events_delete_policy"
ON public.events FOR DELETE TO authenticated
USING (organizer_id = auth.uid());

-- ============================================================================
-- 7. EVENT_RSVPS TABLE
-- ============================================================================
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_rsvps_select_policy" ON public.event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_insert_policy" ON public.event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_update_policy" ON public.event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_delete_policy" ON public.event_rsvps;

-- Authenticated users can read all RSVPs
CREATE POLICY "event_rsvps_select_policy"
ON public.event_rsvps FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create RSVPs (must be the user)
CREATE POLICY "event_rsvps_insert_policy"
ON public.event_rsvps FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own RSVPs
CREATE POLICY "event_rsvps_update_policy"
ON public.event_rsvps FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own RSVPs
CREATE POLICY "event_rsvps_delete_policy"
ON public.event_rsvps FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 8. PROJECTS TABLE
-- ============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;

-- Authenticated users can read all projects
CREATE POLICY "projects_select_policy"
ON public.projects FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create projects (must be the author)
CREATE POLICY "projects_insert_policy"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

-- Users can update projects they authored
CREATE POLICY "projects_update_policy"
ON public.projects FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Users can delete projects they authored
CREATE POLICY "projects_delete_policy"
ON public.projects FOR DELETE TO authenticated
USING (author_id = auth.uid());

-- ============================================================================
-- 9. PROJECT_INTEREST TABLE
-- ============================================================================
ALTER TABLE public.project_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_interest_select_policy" ON public.project_interest;
DROP POLICY IF EXISTS "project_interest_insert_policy" ON public.project_interest;
DROP POLICY IF EXISTS "project_interest_update_policy" ON public.project_interest;
DROP POLICY IF EXISTS "project_interest_delete_policy" ON public.project_interest;

-- Authenticated users can read all project interests
CREATE POLICY "project_interest_select_policy"
ON public.project_interest FOR SELECT TO authenticated
USING (true);

-- Authenticated users can express interest (must be the user)
CREATE POLICY "project_interest_insert_policy"
ON public.project_interest FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own interest expressions
CREATE POLICY "project_interest_update_policy"
ON public.project_interest FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own interest expressions
CREATE POLICY "project_interest_delete_policy"
ON public.project_interest FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 10. PROJECT_UPDATES TABLE
-- ============================================================================
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_updates_select_policy" ON public.project_updates;
DROP POLICY IF EXISTS "project_updates_insert_policy" ON public.project_updates;
DROP POLICY IF EXISTS "project_updates_update_policy" ON public.project_updates;
DROP POLICY IF EXISTS "project_updates_delete_policy" ON public.project_updates;

-- Authenticated users can read all project updates
CREATE POLICY "project_updates_select_policy"
ON public.project_updates FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create project updates (must be the author)
CREATE POLICY "project_updates_insert_policy"
ON public.project_updates FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

-- Users can update their own project updates
CREATE POLICY "project_updates_update_policy"
ON public.project_updates FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Users can delete their own project updates
CREATE POLICY "project_updates_delete_policy"
ON public.project_updates FOR DELETE TO authenticated
USING (author_id = auth.uid());

-- ============================================================================
-- 11. USER_PROFILES TABLE
-- ============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;

-- Authenticated users can read all profiles
CREATE POLICY "user_profiles_select_policy"
ON public.user_profiles FOR SELECT TO authenticated
USING (true);

-- Users can create their own profile
CREATE POLICY "user_profiles_insert_policy"
ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "user_profiles_update_policy"
ON public.user_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 12. USER_MEMBERSHIPS TABLE
-- ============================================================================
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_memberships_select_policy" ON public.user_memberships;
DROP POLICY IF EXISTS "user_memberships_insert_policy" ON public.user_memberships;
DROP POLICY IF EXISTS "user_memberships_update_policy" ON public.user_memberships;

-- Authenticated users can read all memberships (for org display purposes)
CREATE POLICY "user_memberships_select_policy"
ON public.user_memberships FOR SELECT TO authenticated
USING (true);

-- Users can create their own memberships
CREATE POLICY "user_memberships_insert_policy"
ON public.user_memberships FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own memberships
CREATE POLICY "user_memberships_update_policy"
ON public.user_memberships FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 13. ORGANIZATIONS TABLE
-- ============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;

-- Authenticated users can read all organizations
CREATE POLICY "organizations_select_policy"
ON public.organizations FOR SELECT TO authenticated
USING (true);

-- Note: Insert/Update/Delete for organizations should be admin-only
-- Consider adding admin-specific policies if needed

-- ============================================================================
-- 14. CHAT_MESSAGES TABLE
-- ============================================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_policy" ON public.chat_messages;

-- Authenticated users can read chat messages (for now, all messages - can be restricted later)
CREATE POLICY "chat_messages_select_policy"
ON public.chat_messages FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create messages (must be the sender)
CREATE POLICY "chat_messages_insert_policy"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own messages
CREATE POLICY "chat_messages_update_policy"
ON public.chat_messages FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "chat_messages_delete_policy"
ON public.chat_messages FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 15. ALERTS TABLE
-- ============================================================================
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alerts_select_policy" ON public.alerts;
DROP POLICY IF EXISTS "alerts_insert_policy" ON public.alerts;

-- Authenticated users can read alerts
CREATE POLICY "alerts_select_policy"
ON public.alerts FOR SELECT TO authenticated
USING (true);

-- Users can create alerts (must be the creator)
CREATE POLICY "alerts_insert_policy"
ON public.alerts FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- 16. EVENT_ATTACHMENTS TABLE (if exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_attachments' AND table_schema = 'public') THEN
    ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "event_attachments_select_policy" ON public.event_attachments;
    DROP POLICY IF EXISTS "event_attachments_insert_policy" ON public.event_attachments;

    CREATE POLICY "event_attachments_select_policy"
    ON public.event_attachments FOR SELECT TO authenticated
    USING (true);

    CREATE POLICY "event_attachments_insert_policy"
    ON public.event_attachments FOR INSERT TO authenticated
    WITH CHECK (uploaded_by = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 17. MEETING_NOTES TABLE (if exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_notes' AND table_schema = 'public') THEN
    ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "meeting_notes_select_policy" ON public.meeting_notes;
    DROP POLICY IF EXISTS "meeting_notes_insert_policy" ON public.meeting_notes;
    DROP POLICY IF EXISTS "meeting_notes_update_policy" ON public.meeting_notes;
    DROP POLICY IF EXISTS "meeting_notes_delete_policy" ON public.meeting_notes;

    CREATE POLICY "meeting_notes_select_policy"
    ON public.meeting_notes FOR SELECT TO authenticated
    USING (true);

    CREATE POLICY "meeting_notes_insert_policy"
    ON public.meeting_notes FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid());

    CREATE POLICY "meeting_notes_update_policy"
    ON public.meeting_notes FOR UPDATE TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

    CREATE POLICY "meeting_notes_delete_policy"
    ON public.meeting_notes FOR DELETE TO authenticated
    USING (author_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 18. ACTION_ITEMS TABLE (if exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'action_items' AND table_schema = 'public') THEN
    ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "action_items_select_policy" ON public.action_items;
    DROP POLICY IF EXISTS "action_items_insert_policy" ON public.action_items;
    DROP POLICY IF EXISTS "action_items_update_policy" ON public.action_items;

    CREATE POLICY "action_items_select_policy"
    ON public.action_items FOR SELECT TO authenticated
    USING (true);

    -- Anyone can create action items
    CREATE POLICY "action_items_insert_policy"
    ON public.action_items FOR INSERT TO authenticated
    WITH CHECK (true);

    -- Users assigned to an action item can update it
    CREATE POLICY "action_items_update_policy"
    ON public.action_items FOR UPDATE TO authenticated
    USING (assigned_to = auth.uid() OR assigned_to IS NULL)
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 19. USER_SETTINGS TABLE (if exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings' AND table_schema = 'public') THEN
    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "user_settings_select_policy" ON public.user_settings;
    DROP POLICY IF EXISTS "user_settings_insert_policy" ON public.user_settings;
    DROP POLICY IF EXISTS "user_settings_update_policy" ON public.user_settings;

    CREATE POLICY "user_settings_select_policy"
    ON public.user_settings FOR SELECT TO authenticated
    USING (user_id = auth.uid());

    CREATE POLICY "user_settings_insert_policy"
    ON public.user_settings FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

    CREATE POLICY "user_settings_update_policy"
    ON public.user_settings FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================
-- After running this migration, verify with:
-- 1. Run: npx tsx scripts/test-all-social-rls.ts
-- 2. All tests should pass
-- 3. Check Supabase Dashboard > Authentication > Policies

COMMENT ON POLICY "posts_select_policy" ON public.posts IS 'Authenticated users can read all posts';
COMMENT ON POLICY "posts_insert_policy" ON public.posts IS 'Users can create posts where they are the author';
COMMENT ON POLICY "post_comments_insert_policy" ON public.post_comments IS 'Users can create comments where they are the author';
COMMENT ON POLICY "notifications_insert_policy" ON public.notifications IS 'Users can create notifications for others where they are the actor';
