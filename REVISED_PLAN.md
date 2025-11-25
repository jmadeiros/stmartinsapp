# Revised Implementation Plan - Corrected Scope

**Date:** November 24, 2025
**Status:** Active Development

---

## ✅ What We Actually Have (Clarifications)

1. **Top Navigation** ✅ - Not sidebar (header with nav items)
2. **Feed/Dashboard** ✅ - Social feed with posts, events, projects
3. **Multi-org collaboration display** ✅ - Phase 1 complete
4. **Database schema** ✅ - All tables created

## ❌ What Needs to Be Built

### Terminology Corrections:
- ~~"Jobs Board"~~ → **"Opportunities"** (correct name)
- ~~"Community Board"~~ → **REMOVED from scope** (not building this)
- ~~"Lunch Menu section"~~ → **Goes inside "This Week in The Village"**
- ~~"Sidebar navigation"~~ → Header nav already exists ✅

---

## 🎯 Features to Build (Priority Order)

### Phase 1B: Core Content Pages (6 weeks)

#### 1. Opportunities Page
**What:** Full page for job listings and volunteer opportunities
**Priority:** CRITICAL
**Story Points:** 21

**Features:**
- Dedicated `/opportunities` page
- Post structure:
  - Title
  - Organization
  - Type (paid staff, volunteer, internship)
  - Description (rich text)
  - Requirements
  - Time commitment
  - Contact/application link
  - Closing date
- Filters: role type, organization, time commitment
- Search functionality
- "Save for later" bookmarks
- Auto-archive expired posts
- Create/edit opportunity form (Partner Staff+)

**User Stories:**
1. As a volunteer, I can browse opportunities by type (5 pts)
2. As a volunteer, I can search opportunities by keyword (3 pts)
3. As a volunteer, I can save opportunities for later (2 pts)
4. As Partner Staff, I can post a new opportunity (5 pts)
5. As Partner Staff, I can edit/close my opportunities (3 pts)
6. As a user, expired opportunities auto-archive (3 pts)

---

#### 2. Calendar Views
**What:** Proper calendar interface for events
**Priority:** CRITICAL
**Story Points:** 34

**Features:**
- Monthly calendar view (grid layout)
- Weekly calendar view
- List view (chronological)
- Color coding by organization or event type
- Click date to create event (quick create modal)
- Export individual events to .ics (Google/Outlook)
- View switching buttons (Month/Week/List)
- Weekly Timetable page (recurring activities)

**User Stories:**
1. As a user, I can view events in monthly calendar (8 pts)
2. As a user, I can view events in weekly calendar (5 pts)
3. As a user, I can view events in list format (3 pts)
4. As a user, I can switch between calendar views (2 pts)
5. As a user, I can see color-coded events by org (3 pts)
6. As a user, I can export events to my calendar (5 pts)
7. As a user, I can view recurring activities timetable (5 pts)
8. As an organizer, I can quick-create event by clicking date (3 pts)

---

#### 3. Meeting Notes Section
**What:** Repository for transparent meeting documentation
**Priority:** HIGH
**Story Points:** 21

**Features:**
- `/meeting-notes` page
- Organized by meeting series
- Note structure:
  - Meeting title & date
  - Attendees list (autocomplete from users)
  - Agenda items
  - Discussion summary
  - Action items with @mentions
  - Attachments (PDFs, docs)
- Rich text editor (TipTap or similar)
- Template system for recurring meetings
- Search by date, keyword, attendees
- Comments on notes
- Export to PDF
- Link notes to related events/posts

**User Stories:**
1. As St Martins Staff, I can create a meeting note (5 pts)
2. As St Martins Staff, I can use templates for notes (3 pts)
3. As a user, I can read meeting notes (2 pts)
4. As a user, I can search meeting notes (5 pts)
5. As a user, I can comment on meeting notes (3 pts)
6. As a user, I can @mention users in action items (3 pts)

---

#### 4. "This Week in The Village" Dashboard Widget
**What:** Highlights section on dashboard
**Priority:** HIGH
**Story Points:** 8

**Features:**
- Prominent card on dashboard (top section)
- Shows 3-5 pinned/priority items:
  - Urgent announcements (priority badge)
  - Upcoming events (next 7 days)
  - New opportunities posted
  - Recent meeting notes
  - **Lunch menu for current day** (embedded)
- Each item clickable to full detail
- Admins can pin/unpin items
- Red badges for urgent items

**User Stories:**
1. As a user, I see weekly highlights on dashboard (3 pts)
2. As a user, I see today's lunch menu in highlights (2 pts)
3. As an admin, I can pin/unpin items as priority (3 pts)

---

#### 5. Priority Alert Banner
**What:** Urgent notification banner at top of dashboard
**Priority:** HIGH
**Story Points:** 3

**Features:**
- Red/orange banner at top of dashboard
- Shows critical urgent announcements
- Example: "Kitchen closed for repairs"
- Dismissible (but reappears until admin removes alert)
- Only admins can create alerts
- Max 1-2 alerts at a time (prevent spam)

**User Stories:**
1. As an admin, I can create priority alerts (2 pts)
2. As a user, I see and can dismiss alerts (1 pt)

---

#### 6. Media Coverage Section
**What:** Showcase press about charities
**Priority:** MEDIUM
**Story Points:** 13

**Features:**
- `/media-coverage` page
- Card-based feed layout
- Article structure:
  - Title & publication name
  - Publication date
  - Summary/excerpt
  - Link to full article
  - Thumbnail image
  - Tags (charity, topic)
- Filter by charity, date, publication
- Featured articles at top (admin-curated)
- St Martins Staff can add entries

**User Stories:**
1. As St Martins Staff, I can add media coverage (5 pts)
2. As a user, I can browse media coverage (3 pts)
3. As a user, I can filter coverage by charity (2 pts)
4. As an admin, I can feature articles (3 pts)

---

#### 7. Global Search
**What:** Make header search bar functional
**Priority:** HIGH
**Story Points:** 21

**Features:**
- Search across all content types:
  - Posts
  - Events
  - Opportunities
  - Meeting notes
  - Users (directory)
- Filter results by type
- Recent searches
- Search suggestions/autocomplete
- Keyboard shortcut (/ to focus)
- Result preview cards

**User Stories:**
1. As a user, I can search across all content (8 pts)
2. As a user, I can filter search results by type (3 pts)
3. As a user, I can see search suggestions (5 pts)
4. As a user, I can use keyboard shortcuts for search (2 pts)
5. As a user, I see recent searches (3 pts)

---

#### 8. User Profiles & Directory
**What:** User profile pages and directory
**Priority:** MEDIUM
**Story Points:** 13

**Features:**
- `/profile/[userId]` page
- Profile displays:
  - Name, photo, role
  - Organization
  - Department/team
  - Contact info (email)
  - Recent activity (posts, comments)
- Edit own profile
- User directory `/directory`
- Filter by organization, role
- Search users
- Settings page for notifications

**User Stories:**
1. As a user, I can view other users' profiles (3 pts)
2. As a user, I can edit my own profile (3 pts)
3. As a user, I can browse user directory (3 pts)
4. As a user, I can configure notification settings (4 pts)

---

#### 9. File Attachments
**What:** Upload files to posts, events, notes
**Priority:** MEDIUM
**Story Points:** 21

**Features:**
- Supabase Storage integration
- Upload to:
  - Posts
  - Events (agendas, flyers)
  - Meeting notes (presentations, docs)
  - Opportunities (job descriptions)
- File types: PDF, DOCX, XLSX, PNG, JPG
- Max size: 10MB per file
- Max 5 files per item
- Preview images inline
- Download button for docs
- Drag-and-drop upload

**User Stories:**
1. As a user, I can upload files to posts (5 pts)
2. As a user, I can upload files to events (3 pts)
3. As a user, I can upload files to meeting notes (3 pts)
4. As a user, I can preview/download attachments (5 pts)
5. As a system, I validate file types and sizes (5 pts)

---

#### 10. Basic Admin Tools
**What:** Essential admin management features
**Priority:** HIGH
**Story Points:** 21

**Features:**
- `/admin` page (admin role only)
- User management:
  - List all users
  - Approve role assignments
  - Deactivate users
  - Change user roles
- Content moderation:
  - Review flagged posts
  - Remove inappropriate content
  - View flagged users
- Pin/unpin posts as priority
- Create lunch menu entries
- Create priority alerts
- Basic analytics:
  - User count
  - Post count
  - Active users today/week

**User Stories:**
1. As an admin, I can manage user roles (5 pts)
2. As an admin, I can moderate content (5 pts)
3. As an admin, I can pin posts as priority (2 pts)
4. As an admin, I can manage lunch menu (5 pts)
5. As an admin, I can view basic analytics (4 pts)

---

## 📊 Phase Breakdown

### Phase 1B: Core Pages (4 weeks - Sprint 1 & 2)
**Focus:** Get main content pages functional

**Sprint 1 (2 weeks - 40 pts):**
- ✅ Opportunities page (21 pts)
- ✅ "This Week" widget (8 pts)
- ✅ Priority alerts (3 pts)
- ✅ Basic admin tools (8 pts from 21)

**Sprint 2 (2 weeks - 42 pts):**
- ✅ Calendar views (34 pts)
- ✅ Remaining admin tools (8 pts)

---

### Phase 1C: Knowledge & Discovery (3 weeks - Sprint 3 & 4)
**Focus:** Meeting notes, search, profiles

**Sprint 3 (2 weeks - 42 pts):**
- ✅ Meeting Notes (21 pts)
- ✅ Global Search (21 pts)

**Sprint 4 (1 week - 26 pts):**
- ✅ User Profiles & Directory (13 pts)
- ✅ Media Coverage (13 pts)

---

### Phase 1D: Files & Polish (2 weeks - Sprint 5)
**Focus:** File handling and refinements

**Sprint 5 (2 weeks - 21 pts):**
- ✅ File Attachments (21 pts)

---

### Phase 2: Collaboration & Notifications (CURRENT - 1 week)
**Focus:** Complete current collaboration work

**Current Sprint (1 week - 10 pts):**
- ✅ Run database migration (1 pt)
- ✅ Regenerate types (1 pt)
- ✅ Wire up notifications dropdown (3 pts)
- ✅ Integrate express interest buttons (2 pts)
- ✅ Connect invite forms to actions (3 pts)

---

### Phase 3: Chat System (3 weeks)
**Focus:** Real-time communication

**Sprints 6-7 (3 weeks - 34 pts):**
- ✅ Chat UI component (8 pts)
- ✅ Real-time messaging (8 pts)
- ✅ Channels & DMs (8 pts)
- ✅ @mentions (5 pts)
- ✅ Reactions (3 pts)
- ✅ Message history (2 pts)

---

## 📅 Timeline Summary

| Phase | Duration | Story Points | Completion Date |
|-------|----------|--------------|-----------------|
| Phase 1A: Foundation | ✅ Done | - | Nov 24, 2025 |
| Phase 2: Collaboration | 1 week | 10 | Dec 1, 2025 |
| Phase 1B: Core Pages | 4 weeks | 82 | Dec 29, 2025 |
| Phase 1C: Knowledge | 3 weeks | 68 | Jan 19, 2026 |
| Phase 1D: Files | 2 weeks | 21 | Feb 2, 2026 |
| Phase 3: Chat | 3 weeks | 34 | Feb 23, 2026 |

**Total to MVP Launch:** ~13 weeks from now = **Mid-February 2026**

---

## 🎯 Immediate Next Steps (This Week)

1. ✅ Finish Phase 2 collaboration integration (1 week)
   - Run migration
   - Wire up notifications
   - Test invitation flow

2. 🚀 Start Phase 1B Sprint 1 (Next Monday)
   - Begin Opportunities page
   - Design "This Week" widget
   - Create priority alerts component

---

## 📋 Story Breakdown by Epic

### Epic 1: Opportunities (21 pts)
- [ ] Browse opportunities with filters (5 pts)
- [ ] Search opportunities (3 pts)
- [ ] Save opportunities (2 pts)
- [ ] Post new opportunity (5 pts)
- [ ] Edit/close opportunities (3 pts)
- [ ] Auto-archive expired (3 pts)

### Epic 2: Calendar (34 pts)
- [ ] Monthly view (8 pts)
- [ ] Weekly view (5 pts)
- [ ] List view (3 pts)
- [ ] View switching (2 pts)
- [ ] Color coding (3 pts)
- [ ] Export to .ics (5 pts)
- [ ] Weekly timetable (5 pts)
- [ ] Quick create (3 pts)

### Epic 3: Meeting Notes (21 pts)
- [ ] Create meeting note (5 pts)
- [ ] Use templates (3 pts)
- [ ] Read notes (2 pts)
- [ ] Search notes (5 pts)
- [ ] Comment on notes (3 pts)
- [ ] @mention in action items (3 pts)

### Epic 4: "This Week" Widget (8 pts)
- [ ] Display highlights (3 pts)
- [ ] Embed lunch menu (2 pts)
- [ ] Admin pin/unpin (3 pts)

### Epic 5: Priority Alerts (3 pts)
- [ ] Create alerts (2 pts)
- [ ] Dismiss alerts (1 pt)

### Epic 6: Media Coverage (13 pts)
- [ ] Add coverage (5 pts)
- [ ] Browse coverage (3 pts)
- [ ] Filter coverage (2 pts)
- [ ] Feature articles (3 pts)

### Epic 7: Global Search (21 pts)
- [ ] Search all content (8 pts)
- [ ] Filter results (3 pts)
- [ ] Search suggestions (5 pts)
- [ ] Keyboard shortcuts (2 pts)
- [ ] Recent searches (3 pts)

### Epic 8: User Profiles (13 pts)
- [ ] View profiles (3 pts)
- [ ] Edit own profile (3 pts)
- [ ] Browse directory (3 pts)
- [ ] Notification settings (4 pts)

### Epic 9: File Attachments (21 pts)
- [ ] Upload to posts (5 pts)
- [ ] Upload to events (3 pts)
- [ ] Upload to notes (3 pts)
- [ ] Preview/download (5 pts)
- [ ] Validation (5 pts)

### Epic 10: Admin Tools (21 pts)
- [ ] Manage user roles (5 pts)
- [ ] Moderate content (5 pts)
- [ ] Pin posts (2 pts)
- [ ] Manage lunch menu (5 pts)
- [ ] Basic analytics (4 pts)

### Epic 11: Collaboration (10 pts) - IN PROGRESS
- [x] Database migration (1 pt)
- [ ] Regenerate types (1 pt)
- [ ] Wire notifications (3 pts)
- [ ] Express interest (2 pts)
- [ ] Invitation forms (3 pts)

### Epic 12: Chat (34 pts) - FUTURE
- [ ] Chat UI (8 pts)
- [ ] Real-time messaging (8 pts)
- [ ] Channels & DMs (8 pts)
- [ ] @mentions (5 pts)
- [ ] Reactions (3 pts)
- [ ] Message history (2 pts)

---

## 🔥 Total Remaining Work

**Story Points:** 215 points
**Estimated Duration:** 13 weeks (at ~17 pts/week average)
**Target Launch:** Mid-February 2026

---

## 📝 Notes & Decisions

**Clarifications Made:**
- ✅ "Opportunities" not "Jobs Board"
- ✅ Community Board feature removed from scope
- ✅ Lunch menu goes in "This Week" widget
- ✅ Navigation is header-based, not sidebar
- ✅ Keeping chat for Phase 3

**Key Dependencies:**
- File attachments need Supabase Storage bucket setup
- Search needs to index existing content
- Admin tools need role-based access checks
- Chat needs Supabase Realtime setup

**Risk Mitigation:**
- Building in priority order (opportunities first)
- Each phase delivers user value
- Can launch after Phase 1D if needed (before chat)

---

**Last Updated:** November 24, 2025
**Status:** Active - Phase 2 finishing this week
**Next Milestone:** Start Phase 1B on December 2, 2025
