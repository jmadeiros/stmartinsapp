-- ============================================================================
-- The Village Hub - Complete Database Migration
-- ============================================================================
-- This script creates all tables, enums, indexes, RLS policies, and seed data
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'st_martins_staff', 'partner_staff', 'volunteer');
CREATE TYPE post_category AS ENUM ('announcement', 'event', 'job', 'story', 'general');
CREATE TYPE reaction_type AS ENUM ('like', 'helpful', 'celebrate');
CREATE TYPE event_category AS ENUM ('meeting', 'social', 'workshop', 'building_event', 'other');
CREATE TYPE job_role_type AS ENUM ('paid_staff', 'volunteer', 'internship');
CREATE TYPE channel_type AS ENUM ('public', 'private', 'org');

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Organizations Table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'volunteer',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  avatar_url TEXT,
  bio TEXT,
  phone VARCHAR(20),
  job_title VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Posts Table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category post_category NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_at TIMESTAMP WITH TIME ZONE,
  pinned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Post Comments Table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Post Reactions Table
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id, reaction_type)
);

-- Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  category event_category NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Event Attachments Table
CREATE TABLE event_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Jobs Table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  job_type job_role_type NOT NULL,
  time_commitment VARCHAR(100),
  requirements TEXT,
  contact_email VARCHAR(255),
  contact_name VARCHAR(100),
  application_url TEXT,
  closing_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Meeting Notes Table
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meeting_series VARCHAR(200),
  meeting_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  attendees TEXT[],
  agenda TEXT,
  notes TEXT NOT NULL,
  action_items JSONB,
  next_meeting_date DATE,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Media Coverage Table
CREATE TABLE media_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  publication_name VARCHAR(200),
  publication_date DATE,
  article_url TEXT NOT NULL,
  summary TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Chat Channels Table
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  channel_type channel_type NOT NULL DEFAULT 'public',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  mentions UUID[],
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- User Settings Table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  notification_frequency VARCHAR(50) DEFAULT 'realtime',
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

-- Organizations indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(is_active);

-- Posts indexes
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_organization ON posts(organization_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_pinned ON posts(is_pinned, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_created ON posts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_expires ON posts(expires_at) WHERE expires_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_posts_board_query ON posts(category, is_pinned DESC, created_at DESC) WHERE deleted_at IS NULL;

-- Post comments indexes
CREATE INDEX idx_comments_post ON post_comments(post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON post_comments(author_id);
CREATE INDEX idx_comments_parent ON post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Post reactions indexes
CREATE INDEX idx_reactions_post ON post_reactions(post_id, reaction_type);
CREATE INDEX idx_reactions_user ON post_reactions(user_id);

-- Events indexes
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_organization ON events(organization_id);
CREATE INDEX idx_events_start ON events(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_calendar_range ON events(start_time, end_time) WHERE deleted_at IS NULL;

-- Event attachments indexes
CREATE INDEX idx_event_attachments_event ON event_attachments(event_id);

-- Jobs indexes
CREATE INDEX idx_jobs_organization ON jobs(organization_id);
CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_active ON jobs(is_active, closing_date) WHERE deleted_at IS NULL;

-- Meeting notes indexes
CREATE INDEX idx_notes_author ON meeting_notes(author_id);
CREATE INDEX idx_notes_date ON meeting_notes(meeting_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_series ON meeting_notes(meeting_series, meeting_date DESC);

-- Media coverage indexes
CREATE INDEX idx_media_organization ON media_coverage(organization_id);
CREATE INDEX idx_media_date ON media_coverage(publication_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_featured ON media_coverage(is_featured) WHERE is_featured = true AND deleted_at IS NULL;
CREATE INDEX idx_media_tags ON media_coverage USING GIN(tags);

-- Chat channels indexes
CREATE INDEX idx_channels_slug ON chat_channels(slug);
CREATE INDEX idx_channels_type ON chat_channels(channel_type);
CREATE INDEX idx_channels_org ON chat_channels(organization_id) WHERE organization_id IS NOT NULL;

-- Chat messages indexes
CREATE INDEX idx_messages_channel ON chat_messages(channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_user ON chat_messages(user_id);
CREATE INDEX idx_messages_parent ON chat_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- ============================================================================
-- 4. CREATE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_notes_updated_at BEFORE UPDATE ON meeting_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_coverage_updated_at BEFORE UPDATE ON media_coverage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_channels_updated_at BEFORE UPDATE ON chat_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Organizations: Everyone can read, only admins can modify
CREATE POLICY "Everyone can view organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Everyone can view active users, users can update own profile
CREATE POLICY "Users can view active users"
  ON users FOR SELECT
  TO authenticated
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Posts: All authenticated users can view, partner_staff+ can create
CREATE POLICY "Users can view all posts"
  ON posts FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Partner staff and above can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'st_martins_staff', 'partner_staff')
    )
  );

CREATE POLICY "Authors and admins can update posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'st_martins_staff'))
  );

CREATE POLICY "Authors and admins can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Post Comments: All can view, all can create, author can update/delete
CREATE POLICY "Users can view comments"
  ON post_comments FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Users can create comments"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON post_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Post Reactions: All can view and manage own reactions
CREATE POLICY "Users can view reactions"
  ON post_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own reactions"
  ON post_reactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Events: All can view, partner_staff+ can create
CREATE POLICY "Users can view events"
  ON events FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Partner staff and above can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'st_martins_staff', 'partner_staff')
    )
  );

CREATE POLICY "Organizers and admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    organizer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'st_martins_staff'))
  );

-- Event Attachments: Inherit from events
CREATE POLICY "Users can view event attachments"
  ON event_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event organizers can manage attachments"
  ON event_attachments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attachments.event_id
      AND (
        events.organizer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'st_martins_staff'))
      )
    )
  );

-- Jobs: All can view, partner_staff+ can post
CREATE POLICY "Users can view active jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Partner staff and above can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    posted_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'st_martins_staff', 'partner_staff')
    )
  );

CREATE POLICY "Job posters and admins can update jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    posted_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'st_martins_staff'))
  );

-- Meeting Notes: All can view, st_martins_staff+ can create
CREATE POLICY "Users can view meeting notes"
  ON meeting_notes FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "St Martins staff and admins can create notes"
  ON meeting_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'st_martins_staff')
    )
  );

CREATE POLICY "Note authors and admins can update notes"
  ON meeting_notes FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Media Coverage: All can view, partner_staff+ can submit
CREATE POLICY "Users can view media coverage"
  ON media_coverage FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Partner staff and above can submit media coverage"
  ON media_coverage FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'st_martins_staff', 'partner_staff')
    )
  );

CREATE POLICY "Submitters and admins can update media coverage"
  ON media_coverage FOR UPDATE
  TO authenticated
  USING (
    submitted_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'st_martins_staff'))
  );

-- Chat Channels: Public channels visible to all, org channels to org members
CREATE POLICY "Users can view accessible channels"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    channel_type = 'public' OR
    (channel_type = 'org' AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ))
  );

-- Chat Messages: Visible if channel is accessible
CREATE POLICY "Users can view messages in accessible channels"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        channel_type = 'public' OR
        (channel_type = 'org' AND organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        channel_type = 'public' OR
        (channel_type = 'org' AND organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        ))
      )
    )
  );

-- User Settings: Users manage own settings
CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7. INSERT SEED DATA
-- ============================================================================

-- Insert default organizations
INSERT INTO organizations (id, name, slug, description, primary_color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'St Martins Housing Trust', 'st-martins', 'Primary building management organization', '#3B82F6'),
  ('00000000-0000-0000-0000-000000000002', 'Example Charity', 'example-charity', 'Example charity organization', '#EF4444');

-- Note: Chat channels will be created after first user login
-- Default channels to create via your app:
-- - General: Building-wide general discussion
-- - Events: Event coordination and planning  
-- - Resources: Shared resources discussion

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Log in via OAuth (Microsoft or Google)
-- 2. Run this SQL to make yourself admin:
--    UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
-- 3. Create default chat channels (General, Events, Resources) via your app
-- ============================================================================
