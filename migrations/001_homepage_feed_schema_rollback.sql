-- Rollback Migration: Homepage Social Feed Schema Updates
-- Description: Reverts changes made in 001_homepage_feed_schema.sql
-- Date: 2025-11-17

-- ============================================================================
-- ROLLBACK ORDER (reverse of migration)
-- ============================================================================

-- 1. Drop RLS policies
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view all interests" ON content_interests;
DROP POLICY IF EXISTS "Users can create their own interests" ON content_interests;
DROP POLICY IF EXISTS "Users can delete their own interests" ON content_interests;
DROP POLICY IF EXISTS "Users can view all commitments" ON support_commitments;
DROP POLICY IF EXISTS "Users can create their own commitments" ON support_commitments;
DROP POLICY IF EXISTS "Users can update their own commitments" ON support_commitments;

-- 2. Drop triggers
DROP TRIGGER IF EXISTS trigger_update_project_events_count ON events;
DROP TRIGGER IF EXISTS trigger_update_content_interested_count ON content_interests;
DROP TRIGGER IF EXISTS trigger_update_post_likes ON post_reactions;
DROP TRIGGER IF EXISTS trigger_update_post_comments ON post_comments;
DROP TRIGGER IF EXISTS set_updated_at ON projects;
DROP TRIGGER IF EXISTS set_updated_at ON support_commitments;

-- 3. Drop functions
DROP FUNCTION IF EXISTS update_project_events_count();
DROP FUNCTION IF EXISTS update_content_interested_count();
DROP FUNCTION IF EXISTS update_post_engagement_counts();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 4. Drop new tables
DROP TABLE IF EXISTS support_commitments CASCADE;
DROP TABLE IF EXISTS content_interests CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 5. Revert events table modifications
ALTER TABLE events
    DROP COLUMN IF EXISTS participants_referred,
    DROP COLUMN IF EXISTS interested_count,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS collaborating_org_ids,
    DROP COLUMN IF EXISTS needs,
    DROP COLUMN IF EXISTS parent_project_id,
    DROP COLUMN IF EXISTS cause;

-- 6. Revert posts table modifications
ALTER TABLE posts
    DROP COLUMN IF EXISTS comments_count,
    DROP COLUMN IF EXISTS likes_count,
    DROP COLUMN IF EXISTS image_url,
    DROP COLUMN IF EXISTS linked_project_id,
    DROP COLUMN IF EXISTS linked_event_id;

-- Make title required again
ALTER TABLE posts ALTER COLUMN title SET NOT NULL;

-- Revert to old post_category enum (if needed)
-- Note: This assumes old categories, adjust if different
DO $$ BEGIN
    DROP TYPE IF EXISTS post_category CASCADE;
    CREATE TYPE post_category AS ENUM (
        'announcement',
        'event',
        'job',
        'story',
        'general'
    );
    ALTER TABLE posts ALTER COLUMN category TYPE post_category USING 'general'::post_category;
    ALTER TABLE posts ALTER COLUMN category SET NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 7. Drop indexes
DROP INDEX IF EXISTS idx_posts_engagement;
DROP INDEX IF EXISTS idx_posts_linked_project;
DROP INDEX IF EXISTS idx_posts_linked_event;
DROP INDEX IF EXISTS idx_events_collaborating_orgs;
DROP INDEX IF EXISTS idx_events_status;
DROP INDEX IF EXISTS idx_events_cause;
DROP INDEX IF EXISTS idx_events_parent_project;
DROP INDEX IF EXISTS idx_projects_engagement;
DROP INDEX IF EXISTS idx_projects_collaborating_orgs;
DROP INDEX IF EXISTS idx_projects_created;
DROP INDEX IF EXISTS idx_projects_target_date;
DROP INDEX IF EXISTS idx_projects_cause;
DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_projects_organization;
DROP INDEX IF EXISTS idx_projects_author;
DROP INDEX IF EXISTS idx_support_commitments_status;
DROP INDEX IF EXISTS idx_support_commitments_type;
DROP INDEX IF EXISTS idx_support_commitments_content;
DROP INDEX IF EXISTS idx_support_commitments_org;
DROP INDEX IF EXISTS idx_support_commitments_user;
DROP INDEX IF EXISTS idx_content_interests_content;
DROP INDEX IF EXISTS idx_content_interests_org;
DROP INDEX IF EXISTS idx_content_interests_user;

-- 8. Remove migration tracking
DELETE FROM schema_migrations WHERE version = '001';

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
