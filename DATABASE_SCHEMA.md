# The Village Hub - Database Schema
## Complete Database Design & SQL Migrations v1.0

---

## Table of Contents
1. [Schema Overview](#1-schema-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Table Definitions](#3-table-definitions)
4. [Enums](#4-enums)
5. [Row Level Security Policies](#5-row-level-security-policies)
6. [Indexes](#6-indexes)
7. [Functions & Triggers](#7-functions--triggers)
8. [Sample Queries](#8-sample-queries)
9. [Migration Scripts](#9-migration-scripts)

---

## 1. Schema Overview

### Database: PostgreSQL 15+
### Schema: `public`

**Total Tables:** 13

**Core Entity Tables:**
- `users` - User accounts and profiles
- `organizations` - Charity organizations in The Village Hub
- `posts` - Community board posts
- `events` - Event calendar entries
- `jobs` - Job and volunteer postings
- `meeting_notes` - Repository of meeting notes
- `media_coverage` - Press/media articles

**Relational Tables:**
- `post_comments` - Comments on posts
- `post_reactions` - Emoji reactions to posts
- `event_attachments` - Files attached to events
- `chat_channels` - Chat channel definitions
- `chat_messages` - Chat message history
- `user_settings` - User preferences

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────┴────────┐         ┌──────────────────┐
│     users       │────────►│  user_settings   │
└────────┬────────┘   1:1   └──────────────────┘
         │ 1
         │
         ├──────────────┬──────────────┬──────────────┬──────────────┐
         │ N            │ N            │ N            │ N            │ N
         │              │              │              │              │
┌────────┴────────┐ ┌──┴───────────┐ ┌┴──────────┐ ┌─┴──────────┐ ┌┴──────────────┐
│     posts       │ │    events    │ │   jobs    │ │meeting_notes│ │media_coverage │
└────────┬────────┘ └──┬───────────┘ └───────────┘ └─────────────┘ └───────────────┘
         │ 1           │ 1
         │             │
         ├─────────────┤
         │ N           │ N
         │             │
┌────────┴────────┐ ┌──┴──────────────┐
│ post_comments   │ │event_attachments│
└─────────────────┘ └─────────────────┘
         │
         │ N
         │
┌────────┴────────┐
│ post_reactions  │
└─────────────────┘


┌─────────────────┐         ┌─────────────────┐
│  chat_channels  │────────►│  chat_messages  │
└─────────────────┘   1:N   └─────────────────┘
         │                           │
         │ N                         │ N
         └───────────────┬───────────┘
                         │ 1
                    ┌────┴────┐
                    │  users  │
                    └─────────┘
```

---

## 3. Table Definitions

### 3.1 Users Table

```sql
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

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

COMMENT ON TABLE users IS 'User accounts with role-based access';
COMMENT ON COLUMN users.role IS 'One of: admin, st_martins_staff, partner_staff, volunteer';
COMMENT ON COLUMN users.is_active IS 'Soft delete flag - inactive users cannot login';
```

---

### 3.2 Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7), -- Hex color code
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(is_active);

COMMENT ON TABLE organizations IS 'Charity organizations housed in The Village Hub';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN organizations.primary_color IS 'Brand color for visual identification (e.g., #3B82F6)';
```

---

### 3.3 Posts Table

```sql
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
  tags TEXT[], -- Array of tag strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_organization ON posts(organization_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_pinned ON posts(is_pinned, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_created ON posts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_expires ON posts(expires_at) WHERE expires_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_posts_tags ON posts USING GIN(tags); -- For array search

COMMENT ON TABLE posts IS 'Community board posts with categories and pinning';
COMMENT ON COLUMN posts.category IS 'One of: announcement, event, job, story, general';
COMMENT ON COLUMN posts.is_pinned IS 'Pinned posts appear at top of board';
COMMENT ON COLUMN posts.expires_at IS 'Auto-archive date (optional)';
COMMENT ON COLUMN posts.tags IS 'Array of lowercase tags for filtering';
```

---

### 3.4 Post Comments Table

```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For threading
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_post_comments_post ON post_comments(post_id, created_at);
CREATE INDEX idx_post_comments_author ON post_comments(author_id);
CREATE INDEX idx_post_comments_parent ON post_comments(parent_comment_id);

COMMENT ON TABLE post_comments IS 'Threaded comments on posts';
COMMENT ON COLUMN post_comments.parent_comment_id IS 'NULL for top-level comments, references parent for replies';
```

---

### 3.5 Post Reactions Table

```sql
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  UNIQUE(post_id, user_id, reaction_type) -- One reaction type per user per post
);

-- Indexes
CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user ON post_reactions(user_id);

COMMENT ON TABLE post_reactions IS 'Emoji reactions to posts (like, helpful, celebrate)';
```

---

### 3.6 Events Table

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT, -- RRULE format (RFC 5545)
  parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE, -- For recurring instances
  color VARCHAR(7), -- Hex color for calendar display
  category event_category,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_organization ON events(organization_id);
CREATE INDEX idx_events_start_time ON events(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_date_range ON events(start_time, end_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_recurring ON events(is_recurring, parent_event_id);

COMMENT ON TABLE events IS 'Calendar events with optional recurrence';
COMMENT ON COLUMN events.recurrence_rule IS 'RRULE string (e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR)';
COMMENT ON COLUMN events.parent_event_id IS 'Links recurring instances to parent event';
COMMENT ON COLUMN events.category IS 'One of: meeting, social, workshop, building_event';
```

---

### 3.7 Event Attachments Table

```sql
CREATE TABLE event_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER, -- Bytes
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_event_attachments_event ON event_attachments(event_id);

COMMENT ON TABLE event_attachments IS 'Files attached to events (flyers, agendas, etc.)';
```

---

### 3.8 Jobs Table

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  role_type job_role_type NOT NULL,
  time_commitment VARCHAR(100), -- e.g., "10 hours/week", "Full-time"
  requirements TEXT,
  contact_name VARCHAR(100),
  contact_email VARCHAR(255),
  application_url TEXT,
  closing_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_jobs_organization ON jobs(organization_id);
CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_jobs_role_type ON jobs(role_type);
CREATE INDEX idx_jobs_active ON jobs(is_active, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_closing_date ON jobs(closing_date) WHERE is_active = true;

COMMENT ON TABLE jobs IS 'Job and volunteer opportunity postings';
COMMENT ON COLUMN jobs.role_type IS 'One of: paid_staff, volunteer, internship';
COMMENT ON COLUMN jobs.is_active IS 'Set to false after closing_date or manual deactivation';
```

---

### 3.9 Meeting Notes Table

```sql
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_series VARCHAR(100) NOT NULL, -- e.g., "Monday Partner Meetings"
  meeting_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendees TEXT[], -- Array of user names or IDs
  agenda TEXT,
  discussion_summary TEXT,
  action_items JSONB, -- Array of {description, assignee, due_date}
  next_meeting_date DATE,
  attachments JSONB, -- Array of {file_name, file_url}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_meeting_notes_series ON meeting_notes(meeting_series, meeting_date DESC);
CREATE INDEX idx_meeting_notes_date ON meeting_notes(meeting_date DESC);
CREATE INDEX idx_meeting_notes_organizer ON meeting_notes(organizer_id);
CREATE INDEX idx_meeting_notes_action_items ON meeting_notes USING GIN(action_items);

COMMENT ON TABLE meeting_notes IS 'Repository of meeting notes for transparency';
COMMENT ON COLUMN meeting_notes.action_items IS 'JSON array of action items with assignee and due date';
```

---

### 3.10 Media Coverage Table

```sql
CREATE TABLE media_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  publication_name VARCHAR(200) NOT NULL,
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

-- Indexes
CREATE INDEX idx_media_coverage_organization ON media_coverage(organization_id);
CREATE INDEX idx_media_coverage_pub_date ON media_coverage(publication_date DESC);
CREATE INDEX idx_media_coverage_featured ON media_coverage(is_featured, publication_date DESC);
CREATE INDEX idx_media_coverage_tags ON media_coverage USING GIN(tags);

COMMENT ON TABLE media_coverage IS 'Press and media articles about Village Hub charities';
COMMENT ON COLUMN media_coverage.is_featured IS 'Featured articles shown prominently';
```

---

### 3.11 Chat Channels Table

```sql
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  channel_type channel_type NOT NULL DEFAULT 'public',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- For org-specific channels
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_chat_channels_slug ON chat_channels(slug);
CREATE INDEX idx_chat_channels_type ON chat_channels(channel_type);
CREATE INDEX idx_chat_channels_organization ON chat_channels(organization_id);

COMMENT ON TABLE chat_channels IS 'Chat channel definitions';
COMMENT ON COLUMN chat_channels.channel_type IS 'One of: public, private, org (organization-specific)';
```

---

### 3.12 Chat Messages Table

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[], -- Array of mentioned user IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_chat_messages_channel ON chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_mentions ON chat_messages USING GIN(mentions);

COMMENT ON TABLE chat_messages IS 'Persistent chat message history';
COMMENT ON COLUMN chat_messages.mentions IS 'Array of user IDs mentioned with @';
```

---

### 3.13 User Settings Table

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  notification_preferences JSONB DEFAULT '{}', -- Granular notification settings
  theme VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_user_settings_user ON user_settings(user_id);

COMMENT ON TABLE user_settings IS 'User preferences and notification settings';
COMMENT ON COLUMN user_settings.notification_preferences IS 'JSON object with per-feature notification toggles';
```

---

## 4. Enums

```sql
-- User roles with hierarchy
CREATE TYPE user_role AS ENUM (
  'admin',
  'st_martins_staff',
  'partner_staff',
  'volunteer'
);

-- Post categories
CREATE TYPE post_category AS ENUM (
  'announcement',
  'event',
  'job',
  'story',
  'general'
);

-- Reaction types (emoji-based)
CREATE TYPE reaction_type AS ENUM (
  'like',
  'helpful',
  'celebrate'
);

-- Event categories
CREATE TYPE event_category AS ENUM (
  'meeting',
  'social',
  'workshop',
  'building_event',
  'other'
);

-- Job role types
CREATE TYPE job_role_type AS ENUM (
  'paid_staff',
  'volunteer',
  'internship'
);

-- Chat channel types
CREATE TYPE channel_type AS ENUM (
  'public',
  'private',
  'org' -- Organization-specific
);
```

---

## 5. Row Level Security Policies

### Enable RLS on All Tables

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
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
```

---

### Users Table Policies

```sql
-- Users can view all other active users
CREATE POLICY "Users viewable by authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (is_active = true AND deleted_at IS NULL);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can insert/delete users
CREATE POLICY "Only admins can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
```

---

### Posts Table Policies

```sql
-- All authenticated users can view non-deleted posts
CREATE POLICY "Posts viewable by authenticated users"
  ON posts FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Partner staff and above can create posts
CREATE POLICY "Partner staff can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'st_martins_staff', 'partner_staff')
    )
  );

-- Authors, admins, and St Martins staff can update posts
CREATE POLICY "Authors and admins can update posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'st_martins_staff')
    )
  );

-- Only admins and St Martins staff can delete posts
CREATE POLICY "Admins can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'st_martins_staff')
    )
  );
```

---

### Post Comments Policies

```sql
-- All authenticated users can view comments
CREATE POLICY "Comments viewable by authenticated users"
  ON post_comments FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Partner staff and above can comment
CREATE POLICY "Partner staff can comment"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'st_martins_staff', 'partner_staff')
    )
  );

-- Authors can update/delete own comments
CREATE POLICY "Authors can manage own comments"
  ON post_comments FOR ALL
  TO authenticated
  USING (author_id = auth.uid());
```

---

### Events Table Policies

```sql
-- All authenticated users can view events
CREATE POLICY "Events viewable by authenticated users"
  ON events FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Partner staff and above can create events
CREATE POLICY "Partner staff can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'st_martins_staff', 'partner_staff')
    )
  );

-- Organizers and admins can update/delete events
CREATE POLICY "Organizers and admins can manage events"
  ON events FOR ALL
  TO authenticated
  USING (
    organizer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'st_martins_staff')
    )
  );
```

---

### Chat Policies

```sql
-- Users can view public channels and org-specific channels for their org
CREATE POLICY "Users can view accessible channels"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    channel_type = 'public' OR
    (channel_type = 'org' AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ))
  );

-- Users can view messages in channels they have access to
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

-- All authenticated users can send messages to public channels
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
```

---

### User Settings Policies

```sql
-- Users can only view and manage their own settings
CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## 6. Indexes

**Performance-Critical Indexes:**

```sql
-- Composite index for posts board main query
CREATE INDEX idx_posts_board_query ON posts(category, is_pinned DESC, created_at DESC)
  WHERE deleted_at IS NULL;

-- Composite index for events calendar range queries
CREATE INDEX idx_events_calendar_range ON events(start_time, end_time)
  WHERE deleted_at IS NULL
  INCLUDE (title, location, organizer_id);

-- Full-text search index for posts (Phase 2)
CREATE INDEX idx_posts_fts ON posts USING gin(to_tsvector('english', title || ' ' || content))
  WHERE deleted_at IS NULL;

-- Chat message pagination index
CREATE INDEX idx_chat_messages_pagination ON chat_messages(channel_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

---

## 7. Functions & Triggers

### Auto-Update `updated_at` Timestamp

```sql
-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (Repeat for all tables with updated_at)
```

---

### Auto-Expire Posts

```sql
-- Function to soft-delete expired posts (run via cron job)
CREATE OR REPLACE FUNCTION expire_old_posts()
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET deleted_at = NOW()
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Schedule this function with pg_cron or external scheduler
```

---

### Update Channel Last Message Time

```sql
-- Trigger to update chat_channels.last_message_at when new message arrives
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_channels
  SET last_message_at = NEW.created_at
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_channel_last_message_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_channel_last_message();
```

---

### Calculate Post Reaction Counts

```sql
-- Materialized view for post reaction counts (Phase 2 optimization)
CREATE MATERIALIZED VIEW post_reaction_counts AS
SELECT
  post_id,
  reaction_type,
  COUNT(*) as count
FROM post_reactions
GROUP BY post_id, reaction_type;

CREATE UNIQUE INDEX idx_post_reaction_counts ON post_reaction_counts(post_id, reaction_type);

-- Refresh function (call after reactions change)
CREATE OR REPLACE FUNCTION refresh_post_reaction_counts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY post_reaction_counts;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. Sample Queries

### Get Dashboard Highlights

```sql
-- Fetch pinned posts and upcoming events for dashboard
WITH pinned_posts AS (
  SELECT
    'post' as type,
    p.id,
    p.title,
    p.category,
    p.created_at as timestamp,
    u.full_name as author_name,
    o.name as organization_name
  FROM posts p
  JOIN users u ON p.author_id = u.id
  LEFT JOIN organizations o ON p.organization_id = o.id
  WHERE p.is_pinned = true
    AND p.deleted_at IS NULL
  ORDER BY p.pinned_at DESC
  LIMIT 3
),
upcoming_events AS (
  SELECT
    'event' as type,
    e.id,
    e.title,
    e.category,
    e.start_time as timestamp,
    u.full_name as organizer_name,
    o.name as organization_name
  FROM events e
  JOIN users u ON e.organizer_id = u.id
  LEFT JOIN organizations o ON e.organization_id = o.id
  WHERE e.start_time > NOW()
    AND e.start_time < NOW() + INTERVAL '7 days'
    AND e.deleted_at IS NULL
  ORDER BY e.start_time ASC
  LIMIT 3
)
SELECT * FROM pinned_posts
UNION ALL
SELECT * FROM upcoming_events
ORDER BY timestamp DESC;
```

---

### Get Community Board with Pagination

```sql
-- Fetch posts with author details, reaction counts, and comment counts
SELECT
  p.*,
  json_build_object(
    'id', u.id,
    'full_name', u.full_name,
    'avatar_url', u.avatar_url,
    'organization', o.name
  ) as author,
  (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id AND deleted_at IS NULL) as comment_count,
  (SELECT json_object_agg(reaction_type, count)
   FROM (
     SELECT reaction_type, COUNT(*) as count
     FROM post_reactions
     WHERE post_id = p.id
     GROUP BY reaction_type
   ) reactions
  ) as reactions
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.deleted_at IS NULL
  AND ($1::post_category IS NULL OR p.category = $1)
ORDER BY p.is_pinned DESC, p.created_at DESC
LIMIT $2 OFFSET $3;
```

---

### Get Events for Calendar Month View

```sql
-- Fetch all events in a given month
SELECT
  e.*,
  json_build_object(
    'id', u.id,
    'full_name', u.full_name,
    'organization', o.name
  ) as organizer,
  COALESCE(
    json_agg(
      json_build_object(
        'file_name', ea.file_name,
        'file_url', ea.file_url
      )
    ) FILTER (WHERE ea.id IS NOT NULL),
    '[]'
  ) as attachments
FROM events e
JOIN users u ON e.organizer_id = u.id
LEFT JOIN organizations o ON e.organization_id = o.id
LEFT JOIN event_attachments ea ON e.id = ea.event_id
WHERE e.deleted_at IS NULL
  AND e.start_time >= $1::date -- Start of month
  AND e.start_time < $2::date  -- Start of next month
GROUP BY e.id, u.id, o.id, o.name
ORDER BY e.start_time ASC;
```

---

### Get Chat Messages with Pagination (Reverse Chronological)

```sql
-- Fetch last 50 messages before a given timestamp (for infinite scroll)
SELECT
  cm.*,
  json_build_object(
    'id', u.id,
    'full_name', u.full_name,
    'avatar_url', u.avatar_url
  ) as user
FROM chat_messages cm
JOIN users u ON cm.user_id = u.id
WHERE cm.channel_id = $1
  AND cm.deleted_at IS NULL
  AND ($2::timestamp IS NULL OR cm.created_at < $2) -- Cursor for pagination
ORDER BY cm.created_at DESC
LIMIT 50;
```

---

## 9. Migration Scripts

### Initial Migration (001_initial_schema.sql)

```sql
-- This is the master migration that creates all tables, types, indexes, and policies
-- Execute this file against a fresh Supabase database

BEGIN;

-- 1. Create enums
CREATE TYPE user_role AS ENUM ('admin', 'st_martins_staff', 'partner_staff', 'volunteer');
CREATE TYPE post_category AS ENUM ('announcement', 'event', 'job', 'story', 'general');
CREATE TYPE reaction_type AS ENUM ('like', 'helpful', 'celebrate');
CREATE TYPE event_category AS ENUM ('meeting', 'social', 'workshop', 'building_event', 'other');
CREATE TYPE job_role_type AS ENUM ('paid_staff', 'volunteer', 'internship');
CREATE TYPE channel_type AS ENUM ('public', 'private', 'org');

-- 2. Create tables (in dependency order)
-- [Include all CREATE TABLE statements from section 3 above]

-- 3. Create indexes
-- [Include all CREATE INDEX statements from section 6 above]

-- 4. Create functions and triggers
-- [Include all function/trigger statements from section 7 above]

-- 5. Enable RLS
-- [Include all ALTER TABLE ENABLE RLS statements from section 5 above]

-- 6. Create RLS policies
-- [Include all CREATE POLICY statements from section 5 above]

COMMIT;
```

---

### Seed Data Script (seed.sql)

```sql
-- Seed data for development and testing

BEGIN;

-- Insert default organizations
INSERT INTO organizations (id, name, slug, description, primary_color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'St Martins Housing Trust', 'st-martins', 'Primary building management organization', '#3B82F6'),
  ('00000000-0000-0000-0000-000000000002', 'Charity Alpha', 'charity-alpha', 'Description of Charity Alpha', '#EF4444'),
  ('00000000-0000-0000-0000-000000000003', 'Charity Beta', 'charity-beta', 'Description of Charity Beta', '#10B981');

-- Insert test users (passwords handled by Supabase Auth separately)
INSERT INTO users (id, email, full_name, role, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'admin@villagehub.org', 'Admin User', 'admin', NULL),
  ('00000000-0000-0000-0000-000000000011', 'staff@stmartins.org', 'St Martins Staff', 'st_martins_staff', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000012', 'partner@alpha.org', 'Partner Staff', 'partner_staff', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000013', 'volunteer@example.com', 'Volunteer User', 'volunteer', '00000000-0000-0000-0000-000000000003');

-- Insert default chat channels
INSERT INTO chat_channels (id, name, slug, description, channel_type, created_by) VALUES
  ('00000000-0000-0000-0000-000000000020', 'General', 'general', 'Building-wide general discussion', 'public', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000021', 'Events', 'events', 'Event coordination and planning', 'public', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000022', 'Resources', 'resources', 'Shared resources discussion', 'public', '00000000-0000-0000-0000-000000000010');

-- Insert sample post
INSERT INTO posts (author_id, title, content, category, is_pinned) VALUES
  ('00000000-0000-0000-0000-000000000011', 'Welcome to The Village Hub!', 'This is the internal communications platform for all charities in our building. Feel free to share updates, coordinate events, and connect with other organizations!', 'announcement', true);

-- Insert sample event
INSERT INTO events (organizer_id, title, description, location, start_time, end_time, category) VALUES
  ('00000000-0000-0000-0000-000000000011', 'Monday Partner Meeting', 'Weekly meeting for all partner charities', 'Conference Room A', NOW() + INTERVAL '3 days' + TIME '10:00', NOW() + INTERVAL '3 days' + TIME '11:30', 'meeting');

COMMIT;
```

---

## Data Import from Existing Supabase DB

If you have existing calendar data in another Supabase database:

```sql
-- Example migration script to import events from old database
-- Run this after connecting to OLD database

-- Export events to CSV
COPY (
  SELECT
    title,
    description,
    location,
    start_time,
    end_time,
    -- Map old fields to new schema
  FROM old_events_table
  WHERE is_active = true
) TO '/tmp/events_export.csv' WITH CSV HEADER;

-- Then import into new database:
-- COPY events (title, description, location, start_time, end_time, organizer_id, organization_id)
-- FROM '/tmp/events_export.csv' WITH CSV HEADER;
```

**Note:** You'll need to provide details about the existing Supabase DB schema for accurate import scripts.

---

## Database Size Estimates

**For 100 users over 1 year:**

| Table | Est. Rows | Est. Size |
|-------|-----------|-----------|
| users | 100 | 50 KB |
| posts | 500 | 500 KB |
| post_comments | 2,000 | 1 MB |
| events | 300 | 200 KB |
| chat_messages | 50,000 | 25 MB |
| jobs | 100 | 100 KB |
| meeting_notes | 50 | 200 KB |
| **Total** | | **~30 MB** |

**Supabase Free Tier:** 500 MB database + 1 GB file storage (sufficient for Phase 1)

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Next Review:** After initial data migration
