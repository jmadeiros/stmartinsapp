# The Village Hub - Master Project Plan

**Last Updated:** November 24, 2025
**Project Status:** 50% Complete - Phase 2 In Progress
**Next Milestone:** Complete Phase 2 Collaboration (2 weeks)

---

## 📋 Quick Navigation

- [Project Overview](#project-overview)
- [Current Status Summary](#current-status-summary)
- [Development Phases](#development-phases)
- [Sprint Breakdown](#sprint-breakdown)
- [Technical Architecture](#technical-architecture)
- [Deployment Roadmap](#deployment-roadmap)
- [Related Documents](#related-documents)

---

## 🎯 Project Overview

### What We're Building
A Next.js 14 full-stack internal communications platform for multiple charity organizations sharing The Village Hub building. Think **Slack + LinkedIn + Asana** specifically designed for nonprofit collaboration.

### Business Goals
1. **Reduce coordination time** by 50% (replace email/poster communication)
2. **Increase cross-org collaboration** - 3+ joint projects in first 3 months
3. **Improve resource utilization** - 80% shared space booking coverage
4. **Build community** - 70% weekly active user rate

### Success Metrics
- **Adoption:** 80% of staff onboarded within 2 weeks of launch
- **Engagement:** 50% of users post/comment weekly
- **Collaboration:** 20+ cross-org events/projects in first quarter
- **Satisfaction:** NPS score > 40

### Users & Scale
- **Initial:** 50 users (5 organizations)
- **6 months:** 100+ users (8-10 organizations)
- **Roles:** Admins (2-3), St Martins Staff (5-10), Partner Staff (30-70), Volunteers (10-30)

---

## 📊 Current Status Summary

### Overall Progress: **50% Complete**

| Component | Status | Progress | Notes |
|-----------|--------|----------|-------|
| **Foundation** | ✅ Done | 100% | Next.js, TypeScript, Tailwind, Supabase |
| **Authentication** | ✅ Done | 100% | Dev login working, OAuth ready |
| **Database Schema** | ✅ Done | 95% | All tables created, migrations ready |
| **Social Feed** | ✅ Done | 95% | Posts, events, projects displaying |
| **Events System** | 🚧 Partial | 60% | RSVP UI done, backend needs work |
| **Projects System** | 🚧 Partial | 60% | Progress tracking done, tasks pending |
| **Collaboration** | 🚧 Active | 40% | Phase 2 components built, integration pending |
| **Notifications** | 🚧 Active | 30% | Component built, needs wiring |
| **Chat** | ⏳ Planned | 0% | Single channel, Phase 3 |
| **Calendar View** | ⏳ Planned | 0% | Phase 4 |
| **User Directory** | ⏳ Planned | 0% | Phase 4 |
| **Search** | ⏳ Planned | 0% | Phase 5 |
| **Admin Panel** | ⏳ Planned | 0% | Phase 5 |

### What's Working Right Now
✅ You can create a test user and log in
✅ Dashboard loads with real data from Supabase
✅ Feed shows posts, events, and projects with filters
✅ Multi-org collaborations display correctly
✅ Create dialogs for events/projects with invite fields

### What's In Progress (This Sprint)
🚧 Collaboration invitations system
🚧 Notification bell dropdown
🚧 Express interest in collaboration
🚧 Accept/decline invitation actions

### What's Blocked
❌ Database migration not run yet (user action required)
❌ Type generation pending migration
❌ Components need user auth context integration

---

## 🗓️ Development Phases

### Phase 1: Foundation & Core Feed (✅ COMPLETE)
**Duration:** 4 weeks
**Status:** 100% - Completed Nov 20, 2025

**Deliverables:**
- [x] Project setup (Next.js 14, TypeScript, Tailwind)
- [x] Supabase integration (auth, database)
- [x] Database schema (26 tables)
- [x] Dev login system
- [x] Social feed UI (3-column layout)
- [x] Post cards with categories
- [x] Event cards with RSVP UI
- [x] Project cards with progress
- [x] Multi-org collaboration display

**Key Files:**
- `/src/app/(authenticated)/dashboard/` - Main dashboard
- `/src/components/social/` - Feed components
- `/src/lib/database.types.ts` - Type definitions
- `seed-database.ts` - Test data

---

### Phase 2: Collaboration & Notifications (🚧 IN PROGRESS - 70% DONE)
**Duration:** 2 weeks
**Status:** 70% - Components built, integration pending
**Target Completion:** December 8, 2025

**User Stories Completed:**
- [x] As an organizer, I can invite specific organizations to collaborate
- [x] As an admin, I receive notifications when invited
- [x] As an admin, I can accept/decline invitations
- [x] As a user, I can express interest in open collaborations
- [x] As an organizer, I get notified of interest expressions

**Technical Deliverables:**
- [x] `collaboration_invitations` table
- [x] `notifications` table
- [x] 6 server actions (invite, respond, express interest, fetch, mark read)
- [x] MultiSelect UI component
- [x] Invite collaborators field in create forms
- [x] Express Interest button component
- [x] Notifications dropdown component

**Integration Checklist:**
- [ ] Run database migration in Supabase
- [ ] Regenerate TypeScript types
- [ ] Add user context provider (userId, orgId)
- [ ] Wire notifications dropdown to header
- [ ] Connect express interest buttons to cards
- [ ] Connect create forms to invitation actions
- [ ] Fetch real organization list for invite selector
- [ ] Test end-to-end invitation flow

**Acceptance Criteria:**
- User can invite orgs when creating event/project
- Invitee sees notification in bell dropdown
- Invitee can accept/decline
- Accepted invitation adds org to collaborators array
- Non-collaborator can express interest
- Organizer sees interest notification

**Story Points:** 36 points
**Documents:** [PHASE_2_SUMMARY.md](PHASE_2_SUMMARY.md), [COLLABORATION_FEATURE.md](COLLABORATION_FEATURE.md)

---

### Phase 3: Chat & Real-time Features (⏳ NEXT UP)
**Duration:** 2 weeks
**Target Start:** December 9, 2025
**Status:** Not started

**Key Features:**
- Single-channel chat for building-wide communication
- Real-time message updates (Supabase Realtime)
- Typing indicators
- Message reactions
- File attachments (images, PDFs)
- @mentions with notifications

**User Stories (21 points):**
1. Send messages to building chat (3 pts)
2. See messages in real-time (5 pts)
3. React to messages with emojis (2 pts)
4. Upload images/files to chat (5 pts)
5. @mention users to notify them (3 pts)
6. Search chat history (3 pts)

**Technical Tasks:**
- Create chat UI component
- Implement Supabase Realtime subscriptions
- Add file upload to Supabase Storage
- Create mention parser and notification trigger
- Add message search endpoint

**Dependencies:**
- Phase 2 notifications system must be complete
- Supabase Storage bucket setup required

---

### Phase 4: Calendar & Directory (⏳ PLANNED)
**Duration:** 2-3 weeks
**Target Start:** December 23, 2025

**Key Features:**
- Month/week/day calendar views
- Drag-and-drop event scheduling
- Room booking system
- User directory with profiles
- Organization directory
- Advanced search & filtering

**User Stories (34 points):**
1. View events in calendar format (5 pts)
2. Book shared spaces (8 pts)
3. See room availability (3 pts)
4. Browse user directory (5 pts)
5. View user profiles (3 pts)
6. View organization profiles (5 pts)
7. Search users/orgs (5 pts)

---

### Phase 5: Admin & Polish (⏳ PLANNED)
**Duration:** 2 weeks
**Target Start:** January 13, 2026

**Key Features:**
- Admin dashboard with analytics
- User management (invite, deactivate, role changes)
- Content moderation tools
- System settings configuration
- Email notifications
- Platform-wide search

**User Stories (26 points):**
1. Admin dashboard (8 pts)
2. Invite new users (3 pts)
3. Manage user roles (3 pts)
4. Moderate content (5 pts)
5. Configure settings (3 pts)
6. View analytics (4 pts)

---

### Phase 6: Beta Testing & Refinement (⏳ PLANNED)
**Duration:** 2-3 weeks
**Target Start:** January 27, 2026

**Goals:**
- Onboard 10-15 pilot users
- Collect feedback via forms
- Fix critical bugs
- Refine UX based on real usage
- Performance optimization
- Security audit

**Deliverables:**
- Bug fixes list
- UX improvement backlog
- Performance report
- Security checklist
- User feedback summary

---

## 📅 Sprint Breakdown

### Current Sprint: Phase 2 Integration (Nov 25 - Dec 8)
**Goal:** Complete collaboration feature end-to-end

**Week 1 (Nov 25 - Dec 1):**
- [ ] Run database migration
- [ ] Regenerate types
- [ ] Create auth context provider
- [ ] Wire up notifications dropdown
- [ ] Test invitation creation

**Week 2 (Dec 2 - Dec 8):**
- [ ] Connect express interest buttons
- [ ] Fetch real organizations for invites
- [ ] Test accept/decline flow
- [ ] Test interest expression flow
- [ ] Write integration tests
- [ ] Documentation updates

### Next Sprint: Phase 3 - Chat Foundation (Dec 9 - Dec 15)
- [ ] Design chat UI component
- [ ] Set up Supabase Realtime
- [ ] Implement message sending
- [ ] Add real-time message display
- [ ] Create typing indicators

### Sprint After: Phase 3 - Chat Features (Dec 16 - Dec 22)
- [ ] Add message reactions
- [ ] Implement file uploads
- [ ] Add @mention parsing
- [ ] Wire mentions to notifications
- [ ] Add chat search

---

## 🏗️ Technical Architecture

### Tech Stack Summary
```
Frontend:
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- ShadCN UI components
- Framer Motion (animations)
- date-fns (date handling)

Backend:
- Supabase (PostgreSQL + Auth)
- Next.js Server Actions
- Edge runtime where possible

Development:
- ESLint + Prettier
- Git version control
- VS Code (recommended)

Deployment (Future):
- Vercel (frontend)
- Supabase (database + storage)
```

### Database Schema Architecture

**Simplified Schema (MVP):**
- Single `public` schema for all tables
- No `user_memberships` junction table (simplified to `user_profiles.organization_id`)
- UUID primary keys throughout
- Direct foreign key relationships

**Key Tables:**
1. **organizations** - Charity organizations
2. **user_profiles** - User data with org membership
3. **posts** - Community posts (6 categories)
4. **events** - Calendar events with `collaborating_orgs` UUID array
5. **projects** - Projects with `collaborators` UUID array
6. **collaboration_invitations** - Phase 2 feature
7. **notifications** - Phase 2 feature
8. **chat_messages** - Single-channel chat

**Type Generation:**
```bash
npx supabase gen types typescript \
  --project-id pcokwakenaapsfwcrpyt \
  --schema public \
  > src/lib/database.types.ts
```

### Folder Structure
```
src/
├── app/
│   ├── (authenticated)/          # Protected routes
│   │   └── dashboard/           # Main app
│   ├── api/                     # API routes
│   │   └── dev-login/          # Dev auth
│   ├── auth/                    # Auth callbacks
│   └── login/                   # Login page
├── components/
│   ├── ui/                      # ShadCN components (37+)
│   ├── social/                  # Feed components
│   └── layout/                  # Layout components
├── lib/
│   ├── actions/                 # Server actions
│   ├── supabase/               # Supabase clients
│   ├── types.ts                # App types
│   └── database.types.ts       # Generated DB types
└── hooks/                       # React hooks
```

### Data Fetching Patterns

**Server Components (Preferred):**
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()  // Awaited!
  const { data } = await supabase.from('posts').select('*')
  return <Component data={data} />
}
```

**Client Components (When Needed):**
```typescript
import { createClient } from '@/lib/supabase/client'

export function Component() {
  const supabase = createClient()  // Not awaited
  // Use in useEffect or event handlers
}
```

**Server Actions (Mutations):**
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createPost(data: PostData) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('posts').insert(data)
  return { success: !error, data, error }
}
```

---

## 🚀 Deployment Roadmap

### Local Development (Current)
- Development server on `localhost:3000`
- Dev login bypass (`test@stmartins.dev`)
- RLS disabled for easier development
- Test data via seed scripts

### Staging Environment (Phase 5)
- Deployed to Vercel preview URL
- Separate Supabase project
- OAuth enabled (Google, Microsoft)
- RLS enabled and tested
- Limited to pilot users

### Production Launch (Phase 6+)
- Custom domain: `hub.stmartins.org` (or similar)
- Production Supabase project
- Full OAuth integration
- RLS fully enabled
- Email notifications enabled
- Monitoring and error tracking (Sentry)
- Analytics (Vercel Analytics or similar)

### Post-Launch
- Weekly deployments
- User feedback collection
- Feature iteration
- Performance monitoring
- Regular security updates

---

## 📚 Related Documents

### Planning & Specs
- **[PROJECT_SPECS.md](PROJECT_SPECS.md)** - Full project specifications (80 pages)
- **[USER_STORIES.md](USER_STORIES.md)** - All user stories with story points (43 stories)
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Original implementation plan

### Status & Progress
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current status details
- **[PHASE_2_SUMMARY.md](PHASE_2_SUMMARY.md)** - Phase 2 implementation guide
- **[COLLABORATION_FEATURE.md](COLLABORATION_FEATURE.md)** - Collaboration feature docs

### Technical Docs
- **[CLAUDE.md](CLAUDE.md)** - Developer guide for Claude Code
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture (if exists)
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Database documentation (if exists)

### Reference
- **[README.md](README.md)** - Setup instructions
- `add_collaboration_tables.sql` - Phase 2 database migration
- `seed-database.ts` - Test data script

---

## 🎯 Success Milestones

### ✅ Milestone 1: Foundation Complete (Nov 20, 2025)
- Project structure established
- Authentication working
- Database connected
- Social feed displaying data

### 🚧 Milestone 2: Collaboration Live (Dec 8, 2025 - TARGET)
- Users can invite organizations
- Notifications system working
- Accept/decline invitations functional
- Express interest feature working

### ⏳ Milestone 3: Chat Enabled (Dec 22, 2025)
- Real-time chat functional
- File uploads working
- Mentions and notifications integrated

### ⏳ Milestone 4: Calendar & Directory (Jan 10, 2026)
- Calendar view complete
- Room booking system live
- User directory searchable

### ⏳ Milestone 5: Beta Launch (Jan 27, 2026)
- All core features complete
- 10-15 pilot users onboarded
- Admin tools functional

### ⏳ Milestone 6: Public Launch (Feb 17, 2026)
- Beta feedback implemented
- All 50 users onboarded
- Production monitoring in place

---

## 🔥 Current Priority Actions (This Week)

### Immediate (Today/Tomorrow)
1. **Run database migration** - Paste `add_collaboration_tables.sql` into Supabase SQL Editor
2. **Regenerate types** - Run `npx supabase gen types...` command
3. **Test notification system** - Verify tables created successfully

### This Week
4. **Create auth context** - Add provider for userId and orgId
5. **Wire up notifications** - Connect dropdown to header bell icon
6. **Test invitation flow** - End-to-end test with two users

### Next Week
7. **Add express interest** - Integrate button into event/project cards
8. **Fetch real organizations** - Replace mock data in create forms
9. **Write tests** - Integration tests for collaboration flows
10. **Update documentation** - Mark Phase 2 as complete

---

## 📞 Decision Log

### Key Architectural Decisions

**Decision 1: Simplified Schema (Nov 10, 2025)**
- Removed `user_memberships` junction table
- Added `organization_id` directly to `user_profiles`
- **Rationale:** MVP supports single-org membership only, simpler schema
- **Impact:** Easier queries, less joins, sufficient for launch

**Decision 2: UUID Arrays for Collaborators (Nov 18, 2025)**
- Store collaborating orgs as `UUID[]` arrays in events/projects
- Not a separate junction table
- **Rationale:** Simpler for MVP, sufficient scale (< 10 collaborators per item)
- **Impact:** Easier to display, harder to query inverted relationships

**Decision 3: Notify Admin Only (Nov 24, 2025)**
- Collaboration invitations notify organization admin only
- Not all staff members
- **Rationale:** Clear ownership, avoid notification spam, can add delegation later
- **Impact:** Simpler Phase 2, potential bottleneck if admin unresponsive

**Decision 4: Server Actions Over API Routes**
- Use Next.js Server Actions for all mutations
- Reserve API routes for webhooks and external integrations
- **Rationale:** Type-safe, less boilerplate, better DX
- **Impact:** Faster development, automatic serialization

---

## 🐛 Known Issues & Technical Debt

### High Priority
- [ ] Auth check disabled in dashboard layout (re-enable before production)
- [ ] RLS disabled on all tables (enable and test before staging)
- [ ] No error boundaries (add before production)
- [ ] No loading states on create forms
- [ ] Mock organization data in invite selector

### Medium Priority
- [ ] No pagination on feed (will need at scale)
- [ ] No optimistic updates (UX improvement)
- [ ] No offline support
- [ ] No real-time feed updates (Phase 3)
- [ ] No email notifications (Phase 5)

### Low Priority / Future
- [ ] No dark mode
- [ ] No mobile app
- [ ] No advanced analytics
- [ ] No automated testing
- [ ] No CI/CD pipeline

---

## 📈 Metrics & KPIs (Post-Launch)

### Adoption Metrics
- Total users registered
- Active users (daily, weekly, monthly)
- Time to first post/event created
- Feature adoption rates

### Engagement Metrics
- Posts per week
- Comments per post
- Events created per week
- RSVP rate
- Project participation rate

### Collaboration Metrics
- Cross-org events/projects count
- Collaboration invitations sent/accepted
- Interest expressions count
- Chat messages per day

### Technical Metrics
- Page load time (< 2s target)
- API response time (< 500ms target)
- Error rate (< 1% target)
- Uptime (> 99.5% target)

---

## 🙋 FAQ

**Q: Can I start working on Phase 3 while Phase 2 integration is pending?**
A: Yes, but finish the integration testing first. Phase 3 chat depends on the notifications system.

**Q: Why is auth disabled in the dashboard layout?**
A: For faster development iteration. It MUST be re-enabled before staging deployment.

**Q: When will OAuth be enabled?**
A: Phase 5 (staging deployment). Dev login is sufficient for local development and early testing.

**Q: How do I add a new feature?**
A: 1) Add user story to USER_STORIES.md, 2) Assign to a phase, 3) Estimate story points, 4) Update this master plan

**Q: Where do I find the database schema?**
A: Check `/src/lib/database.types.ts` for types, or Supabase dashboard table editor for visual schema

**Q: How do I reset my database?**
A: Delete all rows from tables (start with dependent tables first), then run `npx tsx seed-database.ts`

---

**END OF MASTER PLAN**

*This document is the single source of truth for project planning. Update it whenever milestones are reached or plans change.*
