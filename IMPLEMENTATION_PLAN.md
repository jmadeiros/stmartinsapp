# The Village Hub - Phased Implementation Plan
## Development Roadmap & Timeline v1.0

---

## Table of Contents
1. [Implementation Philosophy](#1-implementation-philosophy)
2. [Phase 0: Setup & Foundation](#phase-0-setup--foundation-week-1)
3. [Phase 1: Core Platform](#phase-1-core-platform-mvp-weeks-2-6)
4. [Phase 2: Enhanced Features](#phase-2-enhanced-features-weeks-7-10)
5. [Phase 3: Advanced Features](#phase-3-advanced-features-weeks-11-14)
6. [Phase 4: Polish & Launch](#phase-4-polish--launch-weeks-15-16)
7. [Post-Launch Roadmap](#post-launch-roadmap)
8. [Resource Allocation](#resource-allocation)
9. [Risk Mitigation](#risk-mitigation)
10. [Testing Strategy](#testing-strategy)

---

## 1. Implementation Philosophy

### Agile Principles
- **Iterative Development:** Build in 1-2 week sprints
- **User Feedback:** Early demos with 2-3 pilot users per phase
- **MVP First:** Core features before enhancements
- **Continuous Deployment:** Deploy to staging weekly, production bi-weekly

### Priority Framework (MoSCoW)
- **Must Have:** Essential for launch (Phase 0-1)
- **Should Have:** Important but not critical (Phase 2)
- **Could Have:** Nice to have, enhance UX (Phase 3)
- **Won't Have (Yet):** Future roadmap (Post-launch)

### Technical Approach: Server Actions + API Routes

**We will use a hybrid approach:**

- **Next.js Server Actions** for simple form submissions and mutations
  - Creating posts, events, job listings
  - Updating user profiles
  - RSVP actions, reactions, comments
  - Benefits: Simpler code, automatic loading states, progressive enhancement

- **API Routes** for complex logic and external access
  - Complex queries with filtering/pagination
  - File uploads
  - Real-time chat endpoints (initial message fetch)
  - External integrations
  - Benefits: RESTful interface, easier testing, reusable by mobile apps

**Why Both?**
- Server Actions are the modern Next.js way for forms (simpler, less boilerplate)
- API Routes provide flexibility for complex operations and future API access
- Best of both worlds: Use the right tool for each job

**Example:**
```typescript
// Server Action for simple form submission
'use server'
export async function createPost(formData: FormData) {
  // Direct database access, simpler code
  const { data, error } = await supabase.from('posts').insert({...})
  revalidatePath('/board')
}

// API Route for complex query with pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // Complex filtering, pagination, response formatting
  return Response.json({ data, pagination })
}
```

### Success Criteria per Phase
- ✅ All features functional and tested
- ✅ No P0/P1 bugs remaining
- ✅ User acceptance testing passed
- ✅ Performance benchmarks met
- ✅ Documentation updated

---

## Phase 0: Setup & Foundation (Week 1)
**Goal:** Establish development environment and core infrastructure

### Tasks

#### 0.1 Project Initialization
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Install and configure ShadCN UI components
- [ ] Set up ESLint, Prettier, Husky
- [ ] Configure `tsconfig.json` with strict mode
- [ ] Create folder structure (per ARCHITECTURE.md)

**Time Estimate:** 4 hours

---

#### 0.2 Supabase Setup
- [ ] Create Supabase project (production + staging)
- [ ] Configure authentication providers:
  - [ ] Microsoft OAuth (Azure AD app registration)
  - [ ] Google OAuth (Google Cloud Console)
- [ ] Set up Supabase Storage buckets:
  - `avatars`, `posts`, `events`, `meeting-notes`, `media`
- [ ] Configure storage policies (RLS)
- [ ] Generate Supabase types: `npx supabase gen types typescript`

**Time Estimate:** 4 hours

---

#### 0.3 Database Schema Implementation
- [ ] Run initial migration (`001_initial_schema.sql`)
- [ ] Create all tables, enums, indexes
- [ ] Implement Row Level Security policies
- [ ] Create triggers for `updated_at` columns
- [ ] Test RLS policies with different user roles
- [ ] Run seed data script for development

**Time Estimate:** 6 hours

---

#### 0.4 Authentication Foundation
- [ ] Install `@supabase/auth-helpers-nextjs`
- [ ] Create Supabase client utilities (`lib/supabase/client.ts`, `server.ts`)
- [ ] Implement middleware for route protection
- [ ] Create auth API routes (`/api/auth/*`)
- [ ] Build login page with OAuth buttons
- [ ] Build callback page for OAuth redirect
- [ ] Test OAuth flow end-to-end

**Time Estimate:** 6 hours

---

#### 0.5 Base Layout & Navigation
- [ ] Create root layout with providers (QueryClient, Theme)
- [ ] Build responsive Sidebar component
- [ ] Build Header component with search, notifications, profile
- [ ] Implement mobile navigation (hamburger menu)
- [ ] Create Loading and Error boundaries
- [ ] Set up theme system (light/dark mode)

**Time Estimate:** 8 hours

---

#### 0.6 DevOps & CI/CD
- [ ] Set up GitHub repository
- [ ] Create Vercel project (link to GitHub)
- [ ] Configure environment variables in Vercel
- [ ] Set up GitHub Actions for linting and type-checking
- [ ] Configure Sentry for error tracking
- [ ] Set up Plausible Analytics

**Time Estimate:** 4 hours

---

**Phase 0 Total:** ~32 hours (~1 week for 1 developer)

**Deliverables:**
- ✅ Functional dev environment
- ✅ Auth working (login/logout)
- ✅ Database schema live
- ✅ Base layout and navigation
- ✅ CI/CD pipeline operational

---

## Phase 1: Core Platform (MVP) (Weeks 2-6)
**Goal:** Build minimum viable product with essential features

### Sprint 1: Dashboard & User Management (Week 2)

#### 1.1 Dashboard Page
- [ ] Create dashboard route (`/dashboard/page.tsx`)
- [ ] Implement "This Week's Highlights" section
  - [ ] Fetch pinned posts
  - [ ] Fetch upcoming events (next 7 days)
- [ ] Build quick access cards:
  - [ ] Latest Announcements preview
  - [ ] Lunch Menu preview
  - [ ] Upcoming Events preview
- [ ] Add personalized greeting with user name
- [ ] Implement skeleton loading states

**Time Estimate:** 12 hours

---

#### 1.2 User Profile & Settings
- [ ] Build user profile page (`/dashboard/settings/profile`)
- [ ] Create profile edit form (name, bio, phone, job title)
- [ ] Implement avatar upload with cropping
- [ ] Build user settings page (`/dashboard/settings`)
  - [ ] Notification preferences
  - [ ] Theme selection
- [ ] Create `/api/users` endpoints
- [ ] Implement user search/directory page

**Time Estimate:** 10 hours

---

**Sprint 1 Total:** 22 hours

---

### Sprint 2: Community Board (Week 3)

#### 1.3 Posts List & Filters
- [ ] Create community board page (`/dashboard/board`)
- [ ] Implement post card component
- [ ] Add category filter (pills/dropdown)
- [ ] Implement sorting (pinned first, then chronological)
- [ ] Add infinite scroll pagination
- [ ] Implement search functionality
- [ ] Create `/api/posts` GET endpoint
- [ ] Add loading skeletons

**Time Estimate:** 10 hours

---

#### 1.4 Create & View Posts
- [ ] Build "Create Post" dialog/modal
- [ ] Implement rich text editor (TipTap or Lexical)
- [ ] Add category selection
- [ ] Implement tag input
- [ ] Create post detail page (`/dashboard/board/[id]`)
- [ ] Display post with full content
- [ ] **Implement post creation using Server Action** (simpler than API route for forms)
- [ ] Create `/api/posts` GET endpoint for fetching with filters
- [ ] Add form validation (Zod schemas - shared between client and server)

**Implementation Note:** Use Server Action for `createPost` mutation, API Route for GET queries. Server Actions provide simpler code for form submissions with automatic revalidation.

**Time Estimate:** 12 hours

---

#### 1.5 Post Interactions
- [ ] Build comment section component
- [ ] Implement threaded replies
- [ ] Add emoji reactions (like, helpful, celebrate)
- [ ] Create reaction counter display
- [ ] **Use Server Actions for comment/reaction submissions** (instant feedback)
- [ ] Use API Routes for fetching comments with pagination
- [ ] Add optimistic UI updates with TanStack Query

**Implementation Note:** Server Actions for mutations (add comment, toggle reaction), API Routes for queries (fetch comments list). Enables progressive enhancement and simpler code.

**Time Estimate:** 10 hours

---

#### 1.6 Post Management
- [ ] Add "Pin Post" button (St Martins staff/admin only)
- [ ] Implement post editing (author/admin)
- [ ] Add delete post with confirmation
- [ ] Create admin moderation view
- [ ] Implement PATCH and DELETE endpoints

**Time Estimate:** 6 hours

---

**Sprint 2 Total:** 38 hours

---

### Sprint 3: Events Calendar (Week 4-5)

#### 1.7 Calendar Views
- [ ] Install calendar library (e.g., `react-big-calendar` or custom)
- [ ] Create calendar page (`/dashboard/calendar`)
- [ ] Implement monthly view
- [ ] Implement weekly view
- [ ] Implement list view
- [ ] Add date navigation (prev/next month)
- [ ] Implement `/api/events` GET endpoint with date filtering

**Time Estimate:** 14 hours

---

#### 1.8 Event Creation & Details
- [ ] Build "Create Event" dialog
- [ ] Implement event form with date/time pickers
- [ ] Add recurring event options (RRULE)
- [ ] Create event detail page (`/dashboard/calendar/[id]`)
- [ ] Display event with location, description, attachments
- [ ] Implement `/api/events` POST endpoint
- [ ] Add validation for date ranges

**Time Estimate:** 12 hours

---

#### 1.9 Weekly Timetable
- [ ] Create weekly timetable page (`/dashboard/calendar/timetable`)
- [ ] Build grid view (time slots x days)
- [ ] Display recurring activities
- [ ] Make it print-friendly (CSS)
- [ ] Add admin edit mode

**Time Estimate:** 8 hours

---

#### 1.10 Event Attachments
- [ ] Implement file upload for events
- [ ] Display attachment list on event details
- [ ] Create download links
- [ ] Implement `/api/events/[id]/attachments` endpoint

**Time Estimate:** 6 hours

---

**Sprint 3 Total:** 40 hours

---

### Sprint 4: Essential Pages (Week 6)

#### 1.11 Lunch Menu
- [ ] Create lunch menu page (`/dashboard/menu`)
- [ ] Build week view (Mon-Fri cards)
- [ ] Highlight current day
- [ ] Add admin edit mode (simple form)
- [ ] Store menu data in database (new table: `lunch_menus`)
- [ ] Create `/api/lunch-menu` endpoints

**Time Estimate:** 8 hours

---

#### 1.12 Jobs Board
- [ ] Create jobs board page (`/dashboard/jobs`)
- [ ] Build job listing cards with filters (role type, org)
- [ ] Create job detail page (`/dashboard/jobs/[id]`)
- [ ] Build "Post Job" form (Partner staff+)
- [ ] Implement `/api/jobs` endpoints
- [ ] Add auto-expiration for jobs past closing date

**Time Estimate:** 10 hours

---

#### 1.13 Meeting Notes Archive
- [ ] Create meeting notes page (`/dashboard/notes`)
- [ ] List notes by series and date
- [ ] Create note detail page
- [ ] Build "Add Meeting Note" form (St Martins staff+)
- [ ] Display action items prominently
- [ ] Implement `/api/meeting-notes` endpoints

**Time Estimate:** 10 hours

---

#### 1.14 Basic Chat (Phase 1 Simple Version)
- [ ] Create chat page (`/dashboard/chat`)
- [ ] List available channels (General, Events, Resources)
- [ ] Build message list component (reverse chronological)
- [ ] Implement message input with send button
- [ ] Add real-time message updates (Supabase Realtime)
- [ ] Implement `/api/chat` endpoints
- [ ] Add @mention detection (basic)

**Time Estimate:** 14 hours

---

**Sprint 4 Total:** 42 hours

---

**Phase 1 Total:** ~142 hours (~5.5 weeks for 1 developer working 25-30 hrs/week)

**Deliverables:**
- ✅ Fully functional dashboard
- ✅ Community board with posts, comments, reactions
- ✅ Events calendar (month, week, list views)
- ✅ Lunch menu display
- ✅ Jobs board
- ✅ Meeting notes archive
- ✅ Basic real-time chat
- ✅ User profiles and settings

**Milestone: MVP LAUNCH to Pilot Users (5-10 users for beta testing)**

---

## Phase 2: Enhanced Features (Weeks 7-10)
**Goal:** Add polish, improve UX, and implement secondary features

### Sprint 5: Notifications & Search (Week 7)

#### 2.1 Notification System
- [ ] Create notifications table in database
- [ ] Build notification icon with badge (header)
- [ ] Implement notification dropdown/panel
- [ ] Add notification types:
  - [ ] @mentions in posts/comments/chat
  - [ ] Replies to your comments
  - [ ] Event reminders (1 hour before)
  - [ ] New posts in followed categories
- [ ] Create `/api/dashboard/notifications` endpoints
- [ ] Mark as read functionality
- [ ] Add email notifications (opt-in)

**Time Estimate:** 12 hours

---

#### 2.2 Global Search
- [ ] Implement search bar in header
- [ ] Create search results page (`/dashboard/search`)
- [ ] Search across posts, events, users, jobs
- [ ] Add filters by content type
- [ ] Highlight search terms in results
- [ ] Implement PostgreSQL full-text search
- [ ] Create `/api/search` endpoint

**Time Estimate:** 10 hours

---

**Sprint 5 Total:** 22 hours

---

### Sprint 6: Media Coverage & Enhancements (Week 8)

#### 2.3 Media Coverage Section
- [ ] Create media coverage page (`/dashboard/media`)
- [ ] Build article card component with thumbnail
- [ ] Implement filters (org, date, tags)
- [ ] Create article detail view
- [ ] Build "Add Article" form (St Martins staff+)
- [ ] Implement `/api/media-coverage` endpoints
- [ ] Add featured articles section

**Time Estimate:** 10 hours

---

#### 2.4 Enhanced Chat Features
- [ ] Add emoji reactions to messages
- [ ] Implement message editing/deletion
- [ ] Add "user is typing..." indicator
- [ ] Show online presence (green dot)
- [ ] Add file sharing in chat (images, PDFs)
- [ ] Implement chat search
- [ ] Add pinned messages per channel

**Time Estimate:** 12 hours

---

#### 2.5 Organization Management
- [ ] Create organizations management page (admin only)
- [ ] List all charities with logos
- [ ] Add/edit organization details
- [ ] Assign color codes for visual distinction
- [ ] Create `/api/organizations` endpoints

**Time Estimate:** 6 hours

---

**Sprint 6 Total:** 28 hours

---

### Sprint 7: Admin Panel & Analytics (Week 9)

#### 2.6 Admin Dashboard
- [ ] Create admin panel (`/dashboard/admin`)
- [ ] Build user management table
  - [ ] Approve/reject new users
  - [ ] Change user roles
  - [ ] Deactivate users
- [ ] Add system stats dashboard
  - [ ] User growth chart
  - [ ] Content activity (posts, events, messages)
  - [ ] Most active users/orgs
- [ ] Create admin-specific API endpoints

**Time Estimate:** 12 hours

---

#### 2.7 Content Analytics
- [ ] Add view tracking to posts and events
- [ ] Build analytics dashboard for St Martins staff
- [ ] Show popular posts, trending topics
- [ ] Export data to CSV
- [ ] Implement privacy-friendly analytics

**Time Estimate:** 8 hours

---

**Sprint 7 Total:** 20 hours

---

### Sprint 8: UX Polish (Week 10)

#### 2.8 Animations & Micro-interactions
- [ ] Add page transitions (Framer Motion)
- [ ] Implement smooth scroll
- [ ] Add skeleton loaders everywhere
- [ ] Animate card hover states
- [ ] Add toast notifications for actions
- [ ] Implement optimistic UI updates across app
- [ ] Add loading states for all buttons

**Time Estimate:** 10 hours

---

#### 2.9 Accessibility Improvements
- [ ] Audit with Lighthouse and aXe
- [ ] Ensure keyboard navigation works everywhere
- [ ] Add ARIA labels to all interactive elements
- [ ] Improve color contrast ratios
- [ ] Add focus indicators
- [ ] Test with screen reader (NVDA/JAWS)

**Time Estimate:** 8 hours

---

#### 2.10 Mobile Optimization
- [ ] Test all pages on mobile devices
- [ ] Fix layout issues
- [ ] Optimize touch targets (min 44px)
- [ ] Implement mobile-specific navigation
- [ ] Test on iOS Safari and Chrome Android
- [ ] Add PWA manifest for "Add to Home Screen"

**Time Estimate:** 10 hours

---

**Sprint 8 Total:** 28 hours

---

**Phase 2 Total:** ~98 hours (~4 weeks for 1 developer)

**Deliverables:**
- ✅ Notification system
- ✅ Global search
- ✅ Media coverage section
- ✅ Enhanced chat features
- ✅ Admin panel
- ✅ Polished UX with animations
- ✅ Accessibility compliant
- ✅ Mobile-optimized

**Milestone: BETA LAUNCH to All 50 Initial Users**

---

## Phase 3: Advanced Features (Weeks 11-14)
**Goal:** Add advanced functionality and integrations

### Sprint 9: Advanced Calendaring (Week 11)

#### 3.1 Calendar Enhancements
- [ ] Add iCal export (.ics files)
- [ ] Implement calendar subscriptions (public URL)
- [ ] Add recurring event exceptions ("delete this instance only")
- [ ] Implement event color coding by organization
- [ ] Add calendar filtering by org/category
- [ ] Implement drag-and-drop event rescheduling

**Time Estimate:** 12 hours

---

#### 3.2 Event RSVP System
- [ ] Add RSVP buttons to events (Going, Maybe, Can't Go)
- [ ] Track attendee list per event
- [ ] Send RSVP confirmation emails
- [ ] Display attendee count on event cards
- [ ] Add capacity limits (optional)
- [ ] Create RSVP management for organizers

**Time Estimate:** 10 hours

---

**Sprint 9 Total:** 22 hours

---

### Sprint 10: Resource Booking (Week 12)

#### 3.3 Room Booking System
- [ ] Create resources table (meeting rooms, equipment)
- [ ] Build resource management page (admin)
- [ ] Implement booking calendar view
- [ ] Add booking form with time slots
- [ ] Detect booking conflicts
- [ ] Send booking confirmations
- [ ] Create `/api/bookings` endpoints

**Time Estimate:** 14 hours

---

#### 3.4 Kitchen Cleanup Rota
- [ ] Create rota management page
- [ ] Build weekly assignment grid
- [ ] Allow users to swap shifts
- [ ] Send reminder notifications
- [ ] Track completion status

**Time Estimate:** 8 hours

---

**Sprint 10 Total:** 22 hours

---

### Sprint 11: Integrations (Week 13)

#### 3.5 Email Integration
- [ ] Set up email service (Resend or SendGrid)
- [ ] Create email templates (branded HTML)
- [ ] Implement digest emails (daily/weekly summary)
- [ ] Send event reminders via email
- [ ] Send notification emails (opt-in)
- [ ] Add unsubscribe functionality

**Time Estimate:** 10 hours

---

#### 3.6 Calendar Import/Export
- [ ] Import events from Google Calendar (OAuth)
- [ ] Import events from Outlook Calendar
- [ ] Two-way sync (future enhancement)
- [ ] Handle recurring events correctly
- [ ] Map event fields

**Time Estimate:** 12 hours

---

**Sprint 11 Total:** 22 hours

---

### Sprint 12: Advanced Admin Tools (Week 14)

#### 3.7 Audit Logging
- [ ] Create audit_logs table
- [ ] Log all admin actions (user role changes, deletions)
- [ ] Log content moderation actions
- [ ] Build audit log viewer (admin only)
- [ ] Add filtering and search

**Time Estimate:** 8 hours

---

#### 3.8 Content Moderation Tools
- [ ] Implement user flagging system
- [ ] Create moderation queue
- [ ] Add content warning/hiding
- [ ] Build user suspension functionality
- [ ] Create appeal system

**Time Estimate:** 10 hours

---

#### 3.9 Bulk Operations
- [ ] Bulk user import (CSV)
- [ ] Bulk event creation
- [ ] Bulk email sending
- [ ] Export all data to JSON/CSV

**Time Estimate:** 8 hours

---

**Sprint 12 Total:** 26 hours

---

**Phase 3 Total:** ~92 hours (~4 weeks for 1 developer)

**Deliverables:**
- ✅ Advanced calendar features (RSVP, export, sync)
- ✅ Resource booking system
- ✅ Email notifications and digests
- ✅ Calendar integrations
- ✅ Audit logging
- ✅ Advanced moderation tools

**Milestone: FEATURE COMPLETE**

---

## Phase 4: Polish & Launch (Weeks 15-16)
**Goal:** Final QA, performance optimization, and production launch

### Sprint 13: Testing & Bug Fixes (Week 15)

#### 4.1 Comprehensive Testing
- [ ] Write unit tests for critical functions (Jest)
- [ ] E2E testing with Playwright (key user flows)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Performance testing (Lighthouse, WebPageTest)
- [ ] Load testing (50+ concurrent users)
- [ ] Security audit (OWASP checklist)

**Time Estimate:** 16 hours

---

#### 4.2 Bug Bash
- [ ] Fix all P0/P1 bugs
- [ ] Triage and fix P2 bugs
- [ ] Document known P3 bugs for post-launch
- [ ] Test all user roles thoroughly
- [ ] Test RLS policies with different users

**Time Estimate:** 12 hours

---

**Sprint 13 Total:** 28 hours

---

### Sprint 14: Launch Preparation (Week 16)

#### 4.3 Performance Optimization
- [ ] Optimize images (WebP, correct sizing)
- [ ] Implement lazy loading for heavy components
- [ ] Analyze bundle size, remove unused code
- [ ] Add database query caching (Redis - optional)
- [ ] Optimize SQL queries (add indexes if needed)
- [ ] Enable Next.js production optimizations
- [ ] Configure CDN caching headers

**Time Estimate:** 10 hours

---

#### 4.4 Documentation & Training
- [ ] Write user guide (screenshots, walkthroughs)
- [ ] Create admin documentation
- [ ] Record video tutorials (5-10 mins each)
- [ ] Prepare training session slides
- [ ] Write FAQ document
- [ ] Create support email templates

**Time Estimate:** 12 hours

---

#### 4.5 Launch Checklist
- [ ] Final data migration (if any)
- [ ] Set up production monitoring (Sentry, Plausible)
- [ ] Configure backup strategy (Supabase auto-backups)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Create incident response plan
- [ ] Prepare launch announcement
- [ ] Schedule training session with users
- [ ] Deploy to production
- [ ] Smoke test all features in production
- [ ] Announce to all users

**Time Estimate:** 8 hours

---

**Sprint 14 Total:** 30 hours

---

**Phase 4 Total:** ~58 hours (~2 weeks for 1 developer)

**Deliverables:**
- ✅ All bugs fixed
- ✅ Performance optimized
- ✅ Documentation complete
- ✅ User training delivered
- ✅ Production deployment successful

**Milestone: 🚀 PRODUCTION LAUNCH**

---

## Post-Launch Roadmap

### Month 1-2: Stabilization
- Monitor error rates and performance
- Fix bugs reported by users
- Gather user feedback via surveys
- Make quick improvements to UX pain points
- Optimize based on real usage patterns

### Month 3-4: Enhancements
- Implement top user feature requests
- Add advanced search filters
- Enhance mobile app experience (PWA improvements)
- Add more notification customization
- Implement saved searches/filters

### Month 5-6: Scaling
- Upgrade to paid Supabase tier if needed
- Implement Redis caching for performance
- Add more admin analytics and reports
- Create public API for integrations
- Consider native mobile app (React Native)

### Year 2: Advanced Features
- Multi-language support (i18n)
- Advanced workflow automation
- Integration with charity management systems
- Custom charity-specific modules
- Fundraising/donation features

---

## Resource Allocation

### Team Size Assumptions
**Phase 0-1:** 1 Full-stack Developer (primary)
**Phase 2-3:** 1 Full-stack Developer + 1 Part-time Designer/QA
**Phase 4:** 1 Full-stack Developer + 1 QA Tester

### Time Estimates Summary

| Phase | Duration | Hours | Effort (1 FTE) |
|-------|----------|-------|----------------|
| **Phase 0** | 1 week | 32h | 1 week |
| **Phase 1** | 5 weeks | 142h | 5.5 weeks |
| **Phase 2** | 4 weeks | 98h | 4 weeks |
| **Phase 3** | 4 weeks | 92h | 4 weeks |
| **Phase 4** | 2 weeks | 58h | 2 weeks |
| **TOTAL** | **16 weeks** | **422h** | **~4 months** |

**Note:** These are development hours. With project management, meetings, and unexpected issues, expect 5-6 months for a single developer working part-time (20-25 hrs/week).

---

## Risk Mitigation

### High-Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth setup issues | High | Test early (Phase 0), have fallback email auth |
| Supabase RLS complexity | Medium | Thorough testing, document policies clearly |
| Real-time chat scaling | Medium | Monitor performance, have fallback to polling |
| User adoption low | High | Pilot with 5-10 champions, gather feedback early |
| Scope creep | High | Strict phase adherence, document "nice to haves" for post-launch |
| Calendar data import | Medium | Allocate buffer time, test with sample data first |

### Contingency Plans
- **Timeline Slips:** Phase 2 and 3 features can be deprioritized
- **Technical Blockers:** Consult Supabase/Next.js communities early
- **Resource Constraints:** Phase 3 can be post-launch if needed

---

## Testing Strategy

### Testing Pyramid

```
         /\
        /E2E\        10% - Critical user flows (login, post, chat)
       /------\
      /  API   \     30% - API endpoints, database queries
     /----------\
    / Unit Tests \   60% - Utility functions, validations, components
   /--------------\
```

### Test Types

**Unit Tests (Jest + React Testing Library):**
- Utility functions (validations, formatters)
- React component logic
- Hooks

**Integration Tests:**
- API route handlers
- Database queries with test database
- Supabase RLS policies

**E2E Tests (Playwright) - Phase 4:**
- User login flow
- Create post
- Create event
- Send chat message
- Admin user management

### Test Coverage Goals
- **Phase 1:** 40% coverage (core functions)
- **Phase 2:** 60% coverage
- **Phase 3-4:** 70%+ coverage

---

## Definition of Done (DoD)

A feature is "done" when:
- ✅ Code is written and committed
- ✅ Code is reviewed (self-review or peer review)
- ✅ Tests are written and passing
- ✅ Documentation is updated
- ✅ UI is responsive (mobile + desktop)
- ✅ Accessibility checked (keyboard nav, screen reader)
- ✅ Deployed to staging and manually tested
- ✅ No P0/P1 bugs remaining

---

## Sprint Ceremonies (If Working with Team)

**Weekly Sprint Planning (Monday):**
- Review previous sprint
- Plan current week's tasks
- Identify blockers

**Daily Standup (Async for solo dev):**
- What did I do yesterday?
- What will I do today?
- Any blockers?

**Sprint Demo (Friday):**
- Demo completed features to stakeholders
- Gather feedback
- Adjust backlog

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Next Review:** After Phase 1 completion
