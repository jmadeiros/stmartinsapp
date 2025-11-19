-- ============================================================================
-- The Village Hub - Complete Database Migration (Revised)
-- ============================================================================
-- Architecture:
--   - Uses 'app' schema for application tables
--   - Integrates with Supabase auth.users (OAuth)
--   - Separate typed tables (not polymorphic)
--   - Unified feed via VIEW
--   - Complete RLS policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE APP SCHEMA
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS app;

-- Set search path so we can use tables without 'app.' prefix in this file
SET search_path TO app, public;

-- ============================================================================
-- 2. CREATE ENUMS
-- ============================================================================

CREATE TYPE app.user_role AS ENUM ('admin', 'st_martins_staff', 'partner_staff', 'volunteer');
CREATE TYPE app.post_category AS ENUM ('update', 'announcement', 'discussion', 'story');
CREATE TYPE app.reaction_type AS ENUM ('like', 'helpful', 'celebrate');
CREATE TYPE app.event_category AS ENUM ('meeting', 'social', 'workshop', 'building_event', 'other');
CREATE TYPE app.job_type AS ENUM ('paid_staff', 'volunteer', 'internship');
CREATE TYPE app.conversation_type AS ENUM ('direct', 'group', 'org_channel');
CREATE TYPE app.message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE app.calendar_event_type AS ENUM ('meeting', 'event', 'deadline', 'reminder');
CREATE TYPE app.calendar_visibility AS ENUM ('public', 'org_only', 'private');
CREATE TYPE app.meeting_note_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE app.project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

-- ============================================================================
-- 3. CREATE CORE TABLES
-- ============================================================================

-- Organizations Table
CREATE TABLE app.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  mission TEXT,
  founded_date DATE,
  size_range TEXT,
  cause_areas TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB,
  social_links JSONB,
  primary_color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Profiles (extends auth.users)
CREATE TABLE app.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  job_title TEXT,
  phone TEXT,
  skills TEXT[],
  interests TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  linkedin_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'network', -- 'public', 'network', 'org_only'
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Memberships (links users to organizations with roles)
CREATE TABLE app.user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  role app.user_role NOT NULL DEFAULT 'volunteer',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE(user_id, org_id)
);

-- User Settings
CREATE TABLE app.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  notification_frequency TEXT DEFAULT 'realtime',
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. POSTS & INTERACTIONS
-- ============================================================================

-- Posts Table
CREATE TABLE app.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  category app.post_category NOT NULL DEFAULT 'update',
  tags TEXT[], -- ['win', 'opportunity', 'question', 'learning', 'intro']
  image_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Post Comments
CREATE TABLE app.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES app.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES app.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Post Reactions
CREATE TABLE app.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES app.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type app.reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- ============================================================================
-- 5. EVENTS
-- ============================================================================

-- Events Table
CREATE TABLE app.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  virtual_link TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  category app.event_category NOT NULL DEFAULT 'other',
  cause TEXT,
  collaborating_orgs UUID[], -- Array of org IDs
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  volunteers_needed INTEGER,
  seeking_partners BOOLEAN DEFAULT false,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Event RSVPs
CREATE TABLE app.event_rsvps (
  event_id UUID NOT NULL REFERENCES app.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested', -- 'interested', 'going', 'not_going'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Event Attachments
CREATE TABLE app.event_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES app.events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. PROJECTS
-- ============================================================================

-- Projects Table
CREATE TABLE app.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_goal TEXT,
  cause TEXT,
  service_area TEXT,
  target_date TIMESTAMPTZ,
  status app.project_status NOT NULL DEFAULT 'planning',
  progress_current INTEGER DEFAULT 0,
  progress_target INTEGER,
  progress_unit TEXT,
  volunteers_needed INTEGER,
  fundraising_goal TEXT,
  seeking_partners BOOLEAN DEFAULT false,
  partner_orgs UUID[], -- Array of org IDs
  interested_orgs UUID[], -- Array of org IDs that expressed interest
  collaborators UUID[], -- Array of user IDs
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Project Tasks/Milestones
CREATE TABLE app.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  due_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Project Updates/Logs
CREATE TABLE app.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT DEFAULT 'progress', -- 'progress', 'milestone', 'challenge', 'success'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Interest Tracking
CREATE TABLE app.project_interest (
  project_id UUID NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, org_id)
);

-- ============================================================================
-- 7. JOBS BOARD
-- ============================================================================

-- Jobs Table
CREATE TABLE app.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type app.job_type NOT NULL,
  time_commitment TEXT,
  requirements TEXT,
  contact_email TEXT,
  contact_name TEXT,
  application_url TEXT,
  closing_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 8. MEETING NOTES
-- ============================================================================

-- Meeting Notes
CREATE TABLE app.meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  status app.meeting_note_status NOT NULL DEFAULT 'draft',
  meeting_date DATE,
  calendar_event_id UUID, -- Optional link to calendar event (added later)
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Meeting Attendees
CREATE TABLE app.meeting_attendees (
  note_id UUID NOT NULL REFERENCES app.meeting_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'attendee', -- 'organizer', 'attendee', 'note_taker'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, user_id)
);

-- Action Items from Meetings
CREATE TABLE app.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES app.meeting_notes(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Meeting Note Comments
CREATE TABLE app.meeting_note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES app.meeting_notes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. CALENDAR SYSTEM
-- ============================================================================

-- Calendar Events (separate from feed events)
CREATE TABLE app.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type app.calendar_event_type NOT NULL DEFAULT 'meeting',
  visibility app.calendar_visibility NOT NULL DEFAULT 'org_only',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  virtual_link TEXT,
  all_day BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  color TEXT,
  linked_feed_event_id UUID REFERENCES app.events(id), -- Link to feed event if applicable
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

-- Calendar Event Participants
CREATE TABLE app.calendar_participants (
  event_id UUID NOT NULL REFERENCES app.calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  rsvp_status TEXT NOT NULL DEFAULT 'invited', -- 'invited', 'accepted', 'declined', 'tentative'
  role TEXT DEFAULT 'attendee', -- 'organizer', 'attendee', 'optional'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  PRIMARY KEY (event_id, user_id)
);

-- Calendar Event Reminders
CREATE TABLE app.calendar_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES app.calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  minutes_before INTEGER NOT NULL,
  sent_at TIMESTAMPTZ
);

-- ============================================================================
-- 10. CHAT SYSTEM
-- ============================================================================

-- Conversations (direct messages, group chats, org channels)
CREATE TABLE app.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type app.conversation_type NOT NULL DEFAULT 'direct',
  name TEXT,
  description TEXT,
  org_id UUID REFERENCES app.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived BOOLEAN NOT NULL DEFAULT false
);

-- Conversation Participants
CREATE TABLE app.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES app.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'member', 'admin'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages
CREATE TABLE app.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES app.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  reply_to_id UUID REFERENCES app.messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Message Reactions
CREATE TABLE app.message_reactions (
  message_id UUID NOT NULL REFERENCES app.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- Unread Count Tracking
CREATE TABLE app.conversation_unread (
  conversation_id UUID NOT NULL REFERENCES app.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_id UUID REFERENCES app.messages(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ============================================================================
-- 11. PEOPLE DIRECTORY
-- ============================================================================

-- Connection Requests (for networking)
CREATE TABLE app.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (from_user_id, to_user_id)
);

-- ============================================================================
-- 12. ALERTS & NOTIFICATIONS
-- ============================================================================

-- Alerts (building-wide or org-specific announcements)
CREATE TABLE app.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES app.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'urgent'
  target_orgs UUID[], -- null = all orgs
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed_at TIMESTAMPTZ
);

-- ============================================================================
-- 13. CREATE INDEXES
-- ============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON app.organizations(slug);
CREATE INDEX idx_organizations_active ON app.organizations(is_active);

-- User Profiles
CREATE INDEX idx_user_profiles_visibility ON app.user_profiles(visibility);
CREATE INDEX idx_user_profiles_last_active ON app.user_profiles(last_active_at DESC);

-- User Memberships
CREATE INDEX idx_user_memberships_user ON app.user_memberships(user_id);
CREATE INDEX idx_user_memberships_org ON app.user_memberships(org_id);
CREATE INDEX idx_user_memberships_role ON app.user_memberships(role);
CREATE INDEX idx_user_memberships_primary ON app.user_memberships(user_id, is_primary) WHERE is_primary = true;

-- Posts
CREATE INDEX idx_posts_author ON app.posts(author_id);
CREATE INDEX idx_posts_org ON app.posts(org_id);
CREATE INDEX idx_posts_category ON app.posts(category);
CREATE INDEX idx_posts_tags ON app.posts USING GIN(tags);
CREATE INDEX idx_posts_created ON app.posts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_pinned ON app.posts(is_pinned, created_at DESC) WHERE deleted_at IS NULL;

-- Post Comments
CREATE INDEX idx_post_comments_post ON app.post_comments(post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_post_comments_author ON app.post_comments(author_id);
CREATE INDEX idx_post_comments_parent ON app.post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Post Reactions
CREATE INDEX idx_post_reactions_post ON app.post_reactions(post_id, reaction_type);
CREATE INDEX idx_post_reactions_user ON app.post_reactions(user_id);

-- Events
CREATE INDEX idx_events_organizer ON app.events(organizer_id);
CREATE INDEX idx_events_org ON app.events(org_id);
CREATE INDEX idx_events_start ON app.events(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_category ON app.events(category);
CREATE INDEX idx_events_calendar_range ON app.events(start_time, end_time) WHERE deleted_at IS NULL;

-- Event RSVPs
CREATE INDEX idx_event_rsvps_event ON app.event_rsvps(event_id, status);
CREATE INDEX idx_event_rsvps_user ON app.event_rsvps(user_id);

-- Projects
CREATE INDEX idx_projects_author ON app.projects(author_id);
CREATE INDEX idx_projects_org ON app.projects(org_id);
CREATE INDEX idx_projects_status ON app.projects(status);
CREATE INDEX idx_projects_created ON app.projects(created_at DESC) WHERE deleted_at IS NULL;

-- Project Tasks
CREATE INDEX idx_project_tasks_project ON app.project_tasks(project_id, status, order_index);
CREATE INDEX idx_project_tasks_assigned ON app.project_tasks(assigned_to, status);

-- Jobs
CREATE INDEX idx_jobs_org ON app.jobs(org_id);
CREATE INDEX idx_jobs_posted_by ON app.jobs(posted_by);
CREATE INDEX idx_jobs_type ON app.jobs(job_type);
CREATE INDEX idx_jobs_active ON app.jobs(is_active, closing_date) WHERE deleted_at IS NULL;

-- Meeting Notes
CREATE INDEX idx_meeting_notes_org ON app.meeting_notes(org_id, meeting_date DESC);
CREATE INDEX idx_meeting_notes_author ON app.meeting_notes(author_id);
CREATE INDEX idx_meeting_notes_status ON app.meeting_notes(status);
CREATE INDEX idx_meeting_notes_tags ON app.meeting_notes USING GIN(tags);

-- Action Items
CREATE INDEX idx_action_items_assigned ON app.action_items(assigned_to, status, due_date);
CREATE INDEX idx_action_items_note ON app.action_items(note_id);

-- Calendar Events
CREATE INDEX idx_calendar_events_org ON app.calendar_events(org_id, starts_at);
CREATE INDEX idx_calendar_events_created_by ON app.calendar_events(created_by, starts_at);
CREATE INDEX idx_calendar_events_time_range ON app.calendar_events(starts_at, ends_at) WHERE cancelled_at IS NULL;

-- Calendar Participants
CREATE INDEX idx_calendar_participants_user ON app.calendar_participants(user_id, event_id);
CREATE INDEX idx_calendar_participants_event ON app.calendar_participants(event_id, rsvp_status);

-- Conversations
CREATE INDEX idx_conversations_org ON app.conversations(org_id, created_at DESC);
CREATE INDEX idx_conversations_type ON app.conversations(type);

-- Messages
CREATE INDEX idx_messages_conversation ON app.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON app.messages(sender_id, created_at DESC);

-- Conversation Unread
CREATE INDEX idx_conversation_unread_user ON app.conversation_unread(user_id, unread_count DESC) WHERE unread_count > 0;

-- Connection Requests
CREATE INDEX idx_connection_requests_to_user ON app.connection_requests(to_user_id, status);
CREATE INDEX idx_connection_requests_from_user ON app.connection_requests(from_user_id, created_at DESC);

-- ============================================================================
-- 14. CREATE UNIFIED FEED VIEW
-- ============================================================================

CREATE VIEW app.feed AS
  SELECT
    id,
    'post' as type,
    title,
    org_id,
    author_id,
    created_at,
    updated_at
  FROM app.posts
  WHERE deleted_at IS NULL
UNION ALL
  SELECT
    id,
    'event' as type,
    title,
    org_id,
    organizer_id as author_id,
    created_at,
    updated_at
  FROM app.events
  WHERE deleted_at IS NULL
UNION ALL
  SELECT
    id,
    'project' as type,
    title,
    org_id,
    author_id,
    created_at,
    updated_at
  FROM app.projects
  WHERE deleted_at IS NULL
UNION ALL
  SELECT
    id,
    'meeting_note' as type,
    title,
    org_id,
    author_id,
    created_at,
    updated_at
  FROM app.meeting_notes
  WHERE status = 'published'
ORDER BY created_at DESC;

-- ============================================================================
-- 15. CREATE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION app.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON app.organizations
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON app.user_profiles
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON app.user_settings
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON app.posts
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON app.post_comments
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON app.events
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_event_rsvps_updated_at BEFORE UPDATE ON app.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON app.projects
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON app.jobs
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_meeting_notes_updated_at BEFORE UPDATE ON app.meeting_notes
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_meeting_note_comments_updated_at BEFORE UPDATE ON app.meeting_note_comments
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON app.calendar_events
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON app.conversations
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

CREATE TRIGGER update_conversation_unread_updated_at BEFORE UPDATE ON app.conversation_unread
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at();

-- Function to auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION app.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO app.user_profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO app.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION app.create_user_profile();

-- ============================================================================
-- 16. HELPER FUNCTIONS
-- ============================================================================

-- Get user's organizations
CREATE OR REPLACE FUNCTION app.member_orgs(p_user_id UUID)
RETURNS TABLE (org_id UUID, role app.user_role) AS $$
BEGIN
  RETURN QUERY
  SELECT um.org_id, um.role
  FROM app.user_memberships um
  WHERE um.user_id = p_user_id AND um.left_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Start a conversation
CREATE OR REPLACE FUNCTION app.start_conversation(
  p_participant_user_ids UUID[],
  p_org_id UUID,
  p_type app.conversation_type DEFAULT 'direct',
  p_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_user_id UUID;
BEGIN
  INSERT INTO app.conversations (type, name, org_id, created_by)
  VALUES (p_type, p_name, p_org_id, auth.uid())
  RETURNING id INTO v_conversation_id;

  FOREACH v_user_id IN ARRAY p_participant_user_ids LOOP
    INSERT INTO app.conversation_participants (conversation_id, user_id, org_id)
    VALUES (v_conversation_id, v_user_id, p_org_id);
  END LOOP;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RSVP to calendar event
CREATE OR REPLACE FUNCTION app.rsvp_calendar_event(
  p_event_id UUID,
  p_org_id UUID,
  p_status TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO app.calendar_participants (event_id, user_id, org_id, rsvp_status, responded_at)
  VALUES (p_event_id, auth.uid(), p_org_id, p_status, now())
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    rsvp_status = p_status,
    responded_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete action item
CREATE OR REPLACE FUNCTION app.complete_action_item(p_action_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE app.action_items
  SET status = 'completed', completed_at = now()
  WHERE id = p_action_id
    AND (assigned_to = auth.uid() OR EXISTS (
      SELECT 1 FROM app.meeting_notes mn
      WHERE mn.id = action_items.note_id AND mn.author_id = auth.uid()
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Express interest in a project
CREATE OR REPLACE FUNCTION app.express_project_interest(
  p_project_id UUID,
  p_org_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO app.project_interest (project_id, org_id, user_id)
  VALUES (p_project_id, p_org_id, auth.uid())
  ON CONFLICT (project_id, org_id) DO NOTHING;

  -- Update interested_orgs array
  UPDATE app.projects
  SET interested_orgs = array_append(
    COALESCE(interested_orgs, ARRAY[]::UUID[]),
    p_org_id
  )
  WHERE id = p_project_id
    AND NOT (p_org_id = ANY(COALESCE(interested_orgs, ARRAY[]::UUID[])));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE app.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.project_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.meeting_note_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.calendar_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.calendar_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.conversation_unread ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.alerts ENABLE ROW LEVEL SECURITY;

-- Organizations: All authenticated users can view active orgs
CREATE POLICY "Authenticated users view organizations"
  ON app.organizations FOR SELECT
  TO authenticated
  USING (is_active = true);

-- User Profiles: Users view based on visibility settings
CREATE POLICY "Users view network profiles"
  ON app.user_profiles FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'network' AND EXISTS (
      SELECT 1 FROM app.user_memberships um1
      JOIN app.user_memberships um2 ON um1.org_id = um2.org_id
      WHERE um1.user_id = auth.uid() AND um2.user_id = user_profiles.user_id
        AND um1.left_at IS NULL AND um2.left_at IS NULL
    ))
  );

CREATE POLICY "Users update own profile"
  ON app.user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Memberships: Users view their own and same-org memberships
CREATE POLICY "Users view memberships"
  ON app.user_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
  );

-- User Settings: Users manage only their own settings
CREATE POLICY "Users manage own settings"
  ON app.user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Posts: Org members can view, authors can update/delete
CREATE POLICY "Org members view posts"
  ON app.posts FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
  );

CREATE POLICY "Org members create posts"
  ON app.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
  );

CREATE POLICY "Authors update own posts"
  ON app.posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors delete own posts"
  ON app.posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Post Comments: Same as posts
CREATE POLICY "Org members view comments"
  ON app.post_comments FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM app.posts p
      WHERE p.id = post_comments.post_id
        AND p.org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Org members create comments"
  ON app.post_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app.posts p
      WHERE p.id = post_id
        AND p.org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Authors update own comments"
  ON app.post_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Post Reactions: Org members can react
CREATE POLICY "Org members view reactions"
  ON app.post_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app.posts p
      WHERE p.id = post_reactions.post_id
        AND p.org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Org members create reactions"
  ON app.post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM app.posts p
      WHERE p.id = post_id
        AND p.org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Users delete own reactions"
  ON app.post_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Events: Org members can view, organizers can manage
CREATE POLICY "Org members view events"
  ON app.events FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
  );

CREATE POLICY "Org members create events"
  ON app.events FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
  );

CREATE POLICY "Organizers update events"
  ON app.events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Event RSVPs: Org members can RSVP
CREATE POLICY "Org members view rsvps"
  ON app.event_rsvps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app.events e
      WHERE e.id = event_rsvps.event_id
        AND e.org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Org members create rsvps"
  ON app.event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM app.events e
      WHERE e.id = event_id
        AND e.org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
    )
  );

CREATE POLICY "Users update own rsvps"
  ON app.event_rsvps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Projects: Similar to events
CREATE POLICY "Org members view projects"
  ON app.projects FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
  );

CREATE POLICY "Org members create projects"
  ON app.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
  );

CREATE POLICY "Authors update projects"
  ON app.projects FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Jobs: Org members view, org admins/staff create
CREATE POLICY "Org members view jobs"
  ON app.jobs FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_active = true
  );

CREATE POLICY "Org staff create jobs"
  ON app.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM app.member_orgs(auth.uid())
      WHERE role IN ('admin', 'st_martins_staff', 'partner_staff')
    )
  );

CREATE POLICY "Job posters update jobs"
  ON app.jobs FOR UPDATE
  TO authenticated
  USING (posted_by = auth.uid())
  WITH CHECK (posted_by = auth.uid());

-- Meeting Notes: Org members view published, authors manage
CREATE POLICY "Org members view published notes"
  ON app.meeting_notes FOR SELECT
  TO authenticated
  USING (
    (status = 'published' AND org_id IN (SELECT org_id FROM app.member_orgs(auth.uid())))
    OR author_id = auth.uid()
  );

CREATE POLICY "Org members create notes"
  ON app.meeting_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
  );

CREATE POLICY "Authors update notes"
  ON app.meeting_notes FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Calendar Events: Org members + invitees
CREATE POLICY "Users view calendar events"
  ON app.calendar_events FOR SELECT
  TO authenticated
  USING (
    cancelled_at IS NULL
    AND (
      visibility = 'public'
      OR (visibility = 'org_only' AND org_id IN (SELECT org_id FROM app.member_orgs(auth.uid())))
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM app.calendar_participants cp
        WHERE cp.event_id = calendar_events.id AND cp.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Org members create calendar events"
  ON app.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM app.member_orgs(auth.uid()))
  );

CREATE POLICY "Creators update calendar events"
  ON app.calendar_events FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Conversations: Participants only
CREATE POLICY "Participants view conversations"
  ON app.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

-- Messages: Participants can view and send
CREATE POLICY "Participants view messages"
  ON app.messages FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM app.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants send messages"
  ON app.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM app.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Senders update own messages"
  ON app.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Connection Requests: Both parties can view
CREATE POLICY "Users view connection requests"
  ON app.connection_requests FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

CREATE POLICY "Users create connection requests"
  ON app.connection_requests FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Recipients respond to requests"
  ON app.connection_requests FOR UPDATE
  TO authenticated
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- ============================================================================
-- 18. GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA app TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA app TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;

-- ============================================================================
-- 19. SEED DATA (Optional - for development)
-- ============================================================================

-- Create St Martin's organization
INSERT INTO app.organizations (id, name, slug, description, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'St Martin''s Hub', 'st-martins', 'The Village Hub building management', true)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
--   1. Run this in Supabase SQL Editor
--   2. Set up OAuth providers in Supabase Auth settings
--   3. Update frontend to use 'app' schema queries
--   4. Generate TypeScript types: supabase gen types typescript
-- ============================================================================
