# Missing Features - Gap Analysis

**Date:** November 24, 2025
**Status:** Critical features not yet implemented

This document tracks features specified in [PROJECT_SPECS.md](PROJECT_SPECS.md) that are NOT yet built.

---

## 🚨 Critical Missing Features (Phase 1 Spec)

### 1. Dashboard Components

#### ❌ "This Week in The Village" Section
**PRD Reference:** Section 4.2, lines 558-566
**Spec:**
- Card-based layout showing top 3-5 items:
  - Pinned announcements (red/priority badge)
  - Upcoming events (within 7 days)
  - New job postings
  - Recent meeting notes
- Each item clickable to full detail

**Current Status:** Not implemented
**Impact:** HIGH - Core dashboard feature for daily check-in journey
**Effort:** 5 story points

---

#### ❌ AI Summary Box (Bottom Left)
**PRD Reference:** Not explicitly in main PRD
**Spec:**
- Appears to be a dashboard widget
- Likely summarizes recent activity or highlights
- Bottom-left position in dashboard

**Current Status:** Not found in PRD - may be a newer requirement
**Impact:** MEDIUM - Nice-to-have, not blocking
**Effort:** 8 story points (needs AI integration)

---

#### ❌ Priority Alert Banner/Component
**PRD Reference:** Section 4.2, lines 73-76
**Spec:**
- Shows urgent pinned announcements at top
- Red/urgent badge visual indicator
- Example: "Kitchen will be closed Thursday for repairs"
- Dismissible but persists until addressed

**Current Status:** Not implemented
**Impact:** HIGH - Critical for urgent building-wide communication
**Effort:** 3 story points

---

#### ❌ Lunch Menu Preview Card
**PRD Reference:** Section 4.2, lines 574-577, Section 4.5
**Spec:**
- Current day's lunch menu
- Next 2 days preview
- "View Full Week" link
- Icons for dietary info (vegetarian, vegan, gluten-free)
- Management UI for admins to update

**Current Status:** Not implemented
**Impact:** MEDIUM - Important for daily routine
**Effort:** 8 story points (needs menu management)

---

#### ❌ Recent Activity Card
**PRD Reference:** Section 4.2, lines 584-587 (Phase 2)
**Spec:**
- Latest chat messages
- New job postings
- Recent uploads

**Current Status:** Not implemented (marked Phase 2 in PRD)
**Impact:** MEDIUM - Phase 2 feature
**Effort:** 5 story points

---

### 2. Jobs & Opportunities Page

#### ❌ Jobs & Volunteer Board
**PRD Reference:** Section 4.8, lines 748-771
**Spec:**
- Dedicated page/section for job listings
- Post structure:
  - Job title
  - Organization posting
  - Role type (paid staff, volunteer, internship)
  - Description (rich text)
  - Requirements/qualifications
  - Time commitment
  - Contact person/application link
  - Closing date
- Filters: role type, organization, commitment level
- Search by keyword
- "Save for later" bookmark feature
- Auto-archive expired posts

**Current Status:** ❌ COMPLETELY MISSING
**Impact:** CRITICAL - Key feature in user journey #3
**Effort:** 21 story points

**User Journey Impact:**
- Emma's journey (finding volunteer roles) completely blocked
- Job postings mentioned in dashboard highlights can't be accessed

---

### 3. Meeting Notes Section

#### ❌ Meeting Notes Archive
**PRD Reference:** Section 4.6, lines 682-711
**Spec:**
- Centralized repository for meeting transparency
- Organized by meeting type/series
- Note format:
  - Meeting title and date
  - Attendees list
  - Agenda items
  - Discussion summaries
  - Action items with assignees
  - Next meeting date
  - Attachments
- Template system
- Search by date, keyword, attendees
- Link related notes
- Export to PDF

**Current Status:** ❌ COMPLETELY MISSING
**Impact:** HIGH - Key transparency/collaboration feature
**Effort:** 21 story points

**User Journey Impact:**
- David's journey (sharing meeting notes) completely blocked
- Priya's journey (discovering partnerships) relies on searching meeting notes

---

### 4. Media Coverage Section

#### ❌ Media Coverage/Press Section
**PRD Reference:** Section 4.9, lines 773-795
**Spec:**
- Showcase press/news about charities
- Content structure:
  - Article title and publication
  - Publication date
  - Summary/excerpt
  - Link to full article
  - Thumbnail image
  - Tags (charity, topic)
- Card-based feed layout
- Filter by charity, date, publication
- Featured articles at top

**Current Status:** ❌ COMPLETELY MISSING
**Impact:** MEDIUM - Morale booster, not blocking core workflow
**Effort:** 13 story points

---

### 5. Calendar Features

#### ⚠️ Calendar Views - PARTIAL
**PRD Reference:** Section 4.4, lines 628-634

**Implemented:**
- ✅ Events display on feed

**Missing:**
- ❌ Monthly calendar view
- ❌ Weekly calendar view
- ❌ List view
- ❌ Weekly Timetable (recurring activities)
- ❌ Color coding by charity/category
- ❌ Export to Google/Outlook calendar
- ❌ Room booking integration

**Current Status:** Only basic event cards exist
**Impact:** HIGH - Users expect full calendar
**Effort:** 34 story points total

---

### 6. Community Board

#### ⚠️ Community Board - PARTIAL
**PRD Reference:** Section 4.3, lines 591-624

**Implemented:**
- ✅ Posts display on feed
- ✅ Post cards with categories

**Missing:**
- ❌ Dedicated Community Board page/view
- ❌ Post creation with rich text editor
- ❌ Post categories: Announcements, Events, Jobs, Stories, General
- ❌ Pinning system for admins
- ❌ Priority badges (urgent, pinned, new)
- ❌ Reactions (like, helpful, celebrate)
- ❌ Comments/threaded discussions
- ❌ Search & filter by category, date, author, tags
- ❌ Sort options (recent, popular, pinned first)
- ❌ Moderation tools (flag, remove)
- ❌ Target audience selection
- ❌ Expiry date for posts

**Current Status:** Basic feed only, not full community board
**Impact:** HIGH - Core content hub
**Effort:** 34 story points

---

### 7. Chat System

#### ⚠️ Community Chat - PLACEHOLDER ONLY
**PRD Reference:** Section 4.7, lines 715-745

**Implemented:**
- ✅ Database table exists (`chat_messages`)

**Missing:**
- ❌ Chat UI component
- ❌ Real-time message delivery (Supabase Realtime)
- ❌ Channel structure (#general, #events, #resources)
- ❌ Direct messages between users
- ❌ @mentions
- ❌ Emoji reactions
- ❌ Link previews
- ❌ Timestamp and read receipts
- ❌ Message history loading (last 50 messages)

**Current Status:** Database ready, no UI/functionality
**Impact:** HIGH - Key communication feature
**Effort:** 34 story points (Phase 3 in current plan)

---

### 8. Navigation & Layout

#### ⚠️ Sidebar Navigation - PARTIAL
**PRD Reference:** Section 5, lines 876-888

**Implemented:**
- ✅ Left sidebar exists in social header
- ✅ Dashboard link

**Missing:**
- ❌ Community Board link
- ❌ Events Calendar link
- ❌ Jobs & Volunteering link
- ❌ Community Chat link
- ❌ Lunch Menu link
- ❌ Meeting Notes link
- ❌ Media Coverage link
- ❌ Settings page
- ❌ Admin Panel

**Current Status:** Only basic navigation implemented
**Impact:** CRITICAL - Users can't access most features
**Effort:** 13 story points (routing + pages)

---

### 9. Personalization Features

#### ❌ Personalized Greeting
**PRD Reference:** Section 4.2, lines 553-556
**Spec:**
- "Good [morning/afternoon/evening], [First Name]!"
- Current date and time
- Optional weather widget (Phase 2)

**Current Status:** Shows generic "Hi there" in current dashboard
**Impact:** LOW - Nice polish but not critical
**Effort:** 2 story points

---

#### ❌ User Profile & Settings
**PRD Reference:** Section 4.1, lines 518-527

**Missing:**
- ❌ Profile page (view/edit)
- ❌ Profile photo upload
- ❌ Department/team info
- ❌ User directory
- ❌ Notification settings
- ❌ Session management UI

**Current Status:** No profile management
**Impact:** MEDIUM - Users expect to edit profiles
**Effort:** 13 story points

---

### 10. Admin Features

#### ❌ Admin Panel
**PRD Reference:** Throughout PRD, especially moderation sections

**Missing:**
- ❌ User management (approve roles, deactivate)
- ❌ Content moderation (flag review, remove posts)
- ❌ Analytics dashboard
- ❌ System settings configuration
- ❌ Pin/unpin posts
- ❌ Lunch menu management
- ❌ Meeting note templates

**Current Status:** No admin UI at all
**Impact:** HIGH - Can't operate platform without admin tools
**Effort:** 55 story points (Phase 5)

---

### 11. Search Functionality

#### ❌ Global Search
**PRD Reference:** Multiple user journeys rely on search

**Missing:**
- ❌ Search bar in header (exists in UI but not functional)
- ❌ Search across posts, events, meeting notes, jobs
- ❌ Filter results by content type
- ❌ Search by tags, author, date
- ❌ Command palette (Cmd+K) mentioned in competitive analysis

**Current Status:** Search UI exists but no functionality
**Impact:** HIGH - Discovery is limited without search
**Effort:** 21 story points

---

### 12. File Management

#### ❌ File Attachments
**PRD Reference:** Multiple sections mention attachments

**Missing:**
- ❌ File upload to Supabase Storage
- ❌ Attach files to posts
- ❌ Attach files to events
- ❌ Attach files to meeting notes
- ❌ Attach files to chat messages (Phase 2)
- ❌ File preview/download
- ❌ File size limits and validation

**Current Status:** No file handling implemented
**Impact:** MEDIUM - Important but can launch without
**Effort:** 21 story points

---

## 📊 Gap Analysis Summary

### By Priority

**CRITICAL (Blocking MVP Launch):**
1. Jobs & Volunteer Board (21 pts)
2. Community Board full page (34 pts)
3. Calendar views (34 pts)
4. Sidebar navigation links (13 pts)
5. Meeting Notes section (21 pts)
6. Priority Alert component (3 pts)
7. Admin basic tools (13 pts from full 55)

**Subtotal: 139 story points**

---

**HIGH (Should have for Phase 1):**
1. Chat system (34 pts) - *Moved to Phase 3*
2. Search functionality (21 pts)
3. "This Week" dashboard section (5 pts)
4. Lunch Menu (8 pts)
5. File attachments (21 pts)
6. User profiles (13 pts)

**Subtotal: 102 story points**

---

**MEDIUM (Nice to have):**
1. Media Coverage (13 pts)
2. AI Summary box (8 pts)
3. Recent Activity card (5 pts)
4. Personalized greeting (2 pts)

**Subtotal: 28 story points**

---

**TOTAL GAP: 269 story points**

This is approximately **7-8 full sprints** of work at 34-40 points per sprint.

---

## 🎯 Recommended Action Plan

### Option 1: Adjust Phase Definitions
**Recommendation:** Split current "Phase 1" into multiple actual phases

**Revised Phases:**

**Phase 1A: Core Feed (✅ DONE - 100%)**
- Dashboard with feed
- Post/event/project cards
- Multi-org collaboration display

**Phase 1B: Content Pages (🚨 CRITICAL - 0%)**
- Jobs & Volunteer Board
- Community Board page
- Calendar views
- Meeting Notes
- Navigation links
**Effort:** 6 weeks (139 pts)

**Phase 1C: Core Features (HIGH)**
- Priority alerts
- "This Week" highlights
- Lunch menu
- Basic search
- User profiles
**Effort:** 4 weeks (49 pts)

**Phase 2: Collaboration & Notifications (🚧 70% DONE)**
- *Continue current work*
**Effort:** 1 week remaining

**Phase 3: Chat System (⏳ PLANNED)**
- Real-time chat
**Effort:** 3 weeks (34 pts)

**Phase 4: Polish & Admin (⏳ PLANNED)**
- File attachments
- Media coverage
- Admin panel
- Advanced search
**Effort:** 4 weeks (62 pts)

---

### Option 2: Launch "Thin Slice" MVP
**Recommendation:** Launch with absolute minimum viable features

**Must-Have for Launch:**
1. Dashboard with feed ✅
2. Community Board page (simplified) - 13 pts
3. Jobs Board - 21 pts
4. Calendar list view - 8 pts
5. Navigation working - 8 pts
6. Priority alerts - 3 pts
**Total: 53 pts = 2 sprints**

**Defer Everything Else:**
- Meeting notes → Phase 2
- Full calendar views → Phase 2
- Chat → Phase 3
- Admin panel → Phase 4

---

### Option 3: Re-align with Original PRD
**Recommendation:** Build all specified Phase 1 features before calling it "Phase 1"

**This means:**
- Complete all 139 "critical" points
- This takes us from 50% → 100% of Phase 1
- Estimated: 6 more weeks
- Then proceed with Phase 2 collaboration

---

## 📝 Decision Required

**Question for Stakeholder:**

Looking at the PRD, we're calling the current state "Phase 1 complete" but we're actually missing major sections that users will expect:

1. **Jobs & Volunteer Board** - Emma's entire user journey depends on this
2. **Community Board** - Can only view feed, can't create/filter posts properly
3. **Calendar Views** - No month/week calendar, just event cards
4. **Meeting Notes** - David's transparency workflow completely blocked
5. **Lunch Menu** - Daily check-in journey mentions this

**Options:**
- **A)** Continue with current Phase 2 (collaboration), launch thin MVP with gaps
- **B)** Pause Phase 2, fill critical gaps first (6 weeks), then launch
- **C)** Re-define phases to be more realistic (current state = Phase 1A, not Phase 1)

**Recommendation:**
Option C - Rename current milestone to "Phase 1A: Foundation" and create Phase 1B to fill critical gaps. This sets honest expectations and maintains momentum on collaboration feature.

---

## 🔗 Related Documents

- [PROJECT_SPECS.md](PROJECT_SPECS.md) - Original specification
- [USER_STORIES.md](USER_STORIES.md) - User stories breakdown
- [MASTER_PLAN.md](MASTER_PLAN.md) - Current plan (needs updating based on this)
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Status tracking

---

**Created:** November 24, 2025
**Owner:** Development Team
**Status:** Requires stakeholder decision on path forward
