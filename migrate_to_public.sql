-- Migration: Move all tables from app schema to public schema
-- Run this in Supabase SQL Editor

BEGIN;

-- Step 1: Move all tables from app to public
ALTER TABLE app.organizations SET SCHEMA public;
ALTER TABLE app.profiles SET SCHEMA public;
ALTER TABLE app.organization_members SET SCHEMA public;
ALTER TABLE app.posts SET SCHEMA public;
ALTER TABLE app.post_reactions SET SCHEMA public;
ALTER TABLE app.post_comments SET SCHEMA public;
ALTER TABLE app.events SET SCHEMA public;
ALTER TABLE app.event_rsvps SET SCHEMA public;
ALTER TABLE app.projects SET SCHEMA public;
ALTER TABLE app.project_interests SET SCHEMA public;
ALTER TABLE app.partnerships SET SCHEMA public;
ALTER TABLE app.partnership_referrals SET SCHEMA public;
ALTER TABLE app.messages SET SCHEMA public;
ALTER TABLE app.message_participants SET SCHEMA public;
ALTER TABLE app.notifications SET SCHEMA public;
ALTER TABLE app.tags SET SCHEMA public;
ALTER TABLE app.post_tags SET SCHEMA public;
ALTER TABLE app.event_tags SET SCHEMA public;
ALTER TABLE app.project_tags SET SCHEMA public;
ALTER TABLE app.skills SET SCHEMA public;
ALTER TABLE app.profile_skills SET SCHEMA public;
ALTER TABLE app.activity_log SET SCHEMA public;
ALTER TABLE app.analytics_events SET SCHEMA public;
ALTER TABLE app.feedback SET SCHEMA public;
ALTER TABLE app.saved_items SET SCHEMA public;
ALTER TABLE app.user_settings SET SCHEMA public;

-- Step 2: Move all types (enums) from app to public
ALTER TYPE app.org_member_role SET SCHEMA public;
ALTER TYPE app.post_category SET SCHEMA public;
ALTER TYPE app.event_category SET SCHEMA public;
ALTER TYPE app.project_status SET SCHEMA public;
ALTER TYPE app.partnership_status SET SCHEMA public;
ALTER TYPE app.message_status SET SCHEMA public;
ALTER TYPE app.notification_type SET SCHEMA public;

-- Step 3: Move all functions from app to public (if any)
-- Add any custom functions here if they exist

-- Step 4: Update RLS policies (they move automatically with tables)
-- No action needed - RLS policies are part of the table

-- Step 5: Drop the now-empty app schema
DROP SCHEMA app;

COMMIT;

-- Verify migration
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname IN ('public', 'app')
ORDER BY schemaname, tablename;
