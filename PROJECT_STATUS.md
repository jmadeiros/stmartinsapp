# The Village Hub - Project Status

**Last Updated:** November 24, 2025
**Project:** St Martins App - Internal Communications Platform
**Phase:** MVP Development

---

## 🎯 Project Overview

**What We're Building:**
A Next.js 14 full-stack application enabling collaboration among charity organizations within The Village Hub building. Think of it as an internal social network + project management tool for nonprofits sharing a space.

**Target Users:**
- St Martins staff (building managers)
- Partner charity organizations (tenants)
- Volunteers across organizations

**Tech Stack:**
- Frontend: Next.js 14 (App Router), React, TypeScript
- Styling: Tailwind CSS, ShadCN UI components
- Backend: Supabase (PostgreSQL + Auth)
- Deployment: TBD (likely Vercel)

---

## 📊 Overall Progress

### High-Level Status

| Area | Status | Progress |
|------|--------|----------|
| **Foundation** | ✅ Complete | 100% |
| **Authentication** | ✅ Complete | 100% |
| **Social Feed** | ✅ Complete | 95% |
| **Events** | 🚧 Partial | 60% |
| **Projects** | 🚧 Partial | 60% |
| **Collaboration** | 🚧 In Progress | 40% |
| **Chat** | ⏳ Not Started | 0% |
| **Calendar** | ⏳ Not Started | 0% |
| **Directory** | ⏳ Not Started | 0% |
| **Notifications** | 🚧 In Progress | 30% |

**Overall Completion: ~50%**

---

## ✅ What's Working (Completed Features)

### 1. Project Foundation
- [x] Next.js 14 app structure with App Router
- [x] TypeScript configuration
- [x] Tailwind CSS with custom theme
- [x] ShadCN UI component library (37+ components)
- [x] Environment configuration
- [x] Path aliases (@/components, @/lib, etc.)

### 2. Database Setup
- [x] Supabase project created
- [x] PostgreSQL database in `public` schema
- [x] Type-safe database types generated
- [x] Migration scripts created
- [x] Seed scripts for test data
- [x] Row Level Security (RLS) disabled for development

**Tables Created:**
- `organizations` - Charity organizations
- `user_profiles` - User profiles (with organization_id and role)
- `posts` - Community posts with categories
- `events` - Calendar events with RSVP
- `projects` - Collaborative projects with progress tracking
- `chat_messages` - Simple single-channel chat
- `collaboration_invitations` - Phase 2 feature (🚧)
- `notifications` - Phase 2 feature (🚧)

### 3. Authentication System
- [x] Supabase Auth integration
- [x] Dev login endpoint (`/api/dev-login`)
- [x] Test user: `test@stmartins.dev` / `dev-password-123`
- [x] OAuth callback route (ready for Google/Microsoft)
- [x] Protected routes structure
- [x] Session management

**Note:** Auth check temporarily disabled in layout for easier development

### 4. Social Feed (Dashboard)
- [x] 3-column responsive layout
- [x] Left sidebar: Navigation
- [x] Center: Main feed with posts, events, projects
- [x] Right sidebar: Quick actions
- [x] Post cards with categories (Wins, Opportunities, Questions, Learnings, etc.)
- [x] Event cards with date/time/location
- [x] Project cards with progress bars
- [x] Filter by type (All, Events, Projects, Posts)
- [x] Real-time data fetching from Supabase
- [x] **NEW:** Multi-org collaboration display

**What You See:**
- Posts display with category badges
- Events show "Dec 1, 2025 · 10:00 AM - 1:00 PM"
- Projects show progress (35% complete)
- Collaborating orgs: "St Martins Village **and** Youth Action Network"

### 5. UI Components
- [x] Header with navigation, search, notifications bell
- [x] Post composer with placeholder
- [x] Category badges with icons
- [x] Partner avatar display
- [x] Progress bars
- [x] Button variants (primary, secondary, ghost, etc.)
- [x] Form components (inputs, textareas, selects)
- [x] Card components
- [x] 3D visual effects (Aitrium components)

### 6. Data Layer
- [x] Server actions for data fetching
- [x] Type-safe queries with Supabase client
- [x] Query helper functions in `/src/lib/queries/feed.ts`
- [x] Consistent error handling pattern
- [x] Organization name lookup for collaborations

---

## 🚧 In Progress (Current Work)

### Multi-Organization Collaboration (Phase 2)

**What's Done:**
- ✅ Phase 1: Display multiple org names on events/projects
- ✅ Database schema designed (tables + triggers)
- ✅ TypeScript types created
- ✅ SQL migration script ready

**What's Next:**
- ⏳ Run SQL migration in Supabase dashboard
- ⏳ Build "Invite Collaborators" UI for event/project forms
- ⏳ Create server actions (invite, accept, decline)
- ⏳ Add "Express Interest" button to cards
- ⏳ Wire up notification bell in header
- ⏳ Build notification dropdown
- ⏳ Test end-to-end invitation flow

**Status:** 40% complete
**Docs:** [COLLABORATION_FEATURE.md](COLLABORATION_FEATURE.md)

---

## ⏳ Not Started (Planned Features)

### High Priority

**1. Event RSVP System**
- User can RSVP to events
- Show attendee count
- Offer to volunteer/provide resources
- RSVP management for organizers

**2. Project Task Management**
- Break projects into tasks
- Assign tasks to users
- Track task completion
- Update project progress automatically

**3. Search Functionality**
- Global search across posts, events, projects, people
- Filter by date, organization, category
- Autocomplete suggestions

**4. Notifications System (Expand)**
- Currently: Only collaboration invitations
- Need: Event reminders, project updates, mentions, comments
- Real-time push notifications
- Email digest option

### Medium Priority

**5. Calendar View**
- Month/week/day views
- Filter by organization
- Click event to see details
- Export to iCal

**6. People Directory**
- List all users in the network
- Filter by organization, role, skills
- User profiles with contact info
- Skills and interests tags

**7. Chat Enhancement**
- Currently: Simple single channel
- Need: Private messages, group chats
- Thread replies
- File sharing

**8. File Uploads**
- Upload images to posts
- Attach files to projects
- Event banner images
- User profile pictures

### Low Priority

**9. Admin Panel**
- Manage organizations
- Manage users and roles
- View analytics
- Moderate content

**10. OAuth Integration**
- Google OAuth
- Microsoft OAuth
- Azure AD for enterprise

**11. Real-time Updates**
- Supabase subscriptions
- Live feed updates
- Typing indicators in chat
- Online status

**12. Analytics Dashboard**
- Engagement metrics
- Popular events
- Active projects
- Collaboration stats

---

## 🗂️ File Structure

```
src/
├── app/
│   ├── (authenticated)/
│   │   ├── layout.tsx                    # Auth wrapper (disabled)
│   │   └── dashboard/
│   │       ├── page.tsx                  # Main dashboard
│   │       └── actions.ts                # Server actions ✅
│   ├── api/
│   │   └── dev-login/route.ts            # Dev login ✅
│   ├── auth/callback/route.ts            # OAuth callback ✅
│   ├── login/page.tsx                    # Login page ✅
│   ├── layout.tsx                        # Root layout ✅
│   └── theme.css                         # Custom CSS variables ✅
├── components/
│   ├── ui/                               # ShadCN components (37+) ✅
│   ├── social/                           # Feed components ✅
│   │   ├── dashboard.tsx                 # 3-column layout
│   │   ├── main-feed.tsx                 # Feed container
│   │   ├── header.tsx                    # Top navigation
│   │   ├── post-card.tsx                 # Post display
│   │   ├── event-card.tsx                # Event display
│   │   └── project-card.tsx              # Project display
│   ├── layout/                           # Original layout components
│   ├── auth/                             # Login form ✅
│   └── aitrium/                          # 3D effects ✅
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser client ✅
│   │   └── server.ts                     # Server client ✅
│   ├── database.types.ts                 # Generated types ✅
│   ├── collaboration.types.ts            # Collab types ✅
│   ├── types.ts                          # Feed types ✅
│   ├── queries/
│   │   └── feed.ts                       # Query helpers ✅
│   └── utils.ts                          # Utility functions ✅
└── hooks/                                # Custom React hooks
```

**Root Files:**
- `seed-database.ts` - Populate test data ✅
- `add_collaboration_tables.sql` - Phase 2 migration 🚧
- `COLLABORATION_FEATURE.md` - Feature docs ✅
- `CLAUDE.md` - Architecture guide ✅
- `README.md` - Setup instructions ✅

---

## 🎨 Design System

### Theme
- **Primary Color:** Purple gradient (`from-purple-500 to-pink-500`)
- **Secondary Color:** Blue-gray
- **Accent:** Orange/Amber for highlights
- **Background:** Clean white/gray with subtle gradients

### Components
- All components from ShadCN UI (customizable)
- Custom animations with Framer Motion
- Responsive breakpoints: sm, md, lg, xl, 2xl
- Dark mode support (partially implemented)

### Typography
- Font: Geist Sans (Next.js default)
- Headings: Bold, tight tracking
- Body: Regular, comfortable line height

---

## 🐛 Known Issues

### Critical
- None blocking development currently

### Minor
- [ ] Auth check disabled in layout (by design for dev)
- [ ] Hardcoded "St Martins Village" in author objects
- [ ] No real-time updates (requires Supabase subscriptions)
- [ ] Search bar in header is placeholder only
- [ ] Bell icon notifications not functional yet
- [ ] No error boundaries for graceful failures

### Tech Debt
- TODO: Fetch actual org avatars instead of placeholder
- TODO: Implement proper sorting of feed items by timestamp
- TODO: Add loading states to server actions
- TODO: Add form validation
- TODO: Add optimistic UI updates

---

## 📝 Recent Changes (Last 7 Days)

### Nov 24, 2025
- ✅ Implemented Phase 1 collaboration display
- ✅ Created Phase 2 database schema
- ✅ Fixed UUID vs string array issue
- ✅ Updated seed script with partner organizations
- 🚧 Started Phase 2 implementation

### Nov 23, 2025
- ✅ Ran schema cleanup (removed user_memberships)
- ✅ Simplified to single-org model
- ✅ Created simple chat_messages table
- ✅ Fixed schema verification issues

### Nov 20-21, 2025
- ✅ Migrated from `app` schema to `public` schema
- ✅ Wire up dev login with new schema
- ✅ Updated TypeScript types
- ✅ Fixed feed data fetching

### Nov 18-19, 2025
- ✅ Integrated Supabase with dashboard
- ✅ Built social feed UI
- ✅ Created event and project cards
- ✅ Added post categories

---

## 🚀 Next Steps (Priority Order)

### Immediate (This Week)
1. **Complete Phase 2 Collaboration** (2-3 days)
   - Run SQL migration
   - Build invite UI
   - Wire up notifications
   - Test invitation flow

2. **Event RSVP Basic** (1 day)
   - Add RSVP button to event cards
   - Show attendee count
   - Track RSVPs in database

3. **Search Implementation** (1-2 days)
   - Wire up search bar
   - Search posts, events, projects
   - Basic filtering

### Next Week
4. **Calendar View** (2-3 days)
   - Month view calendar
   - Show events on dates
   - Click to see details

5. **People Directory** (2 days)
   - List users
   - Basic profiles
   - Contact information

6. **File Uploads** (2-3 days)
   - Supabase Storage setup
   - Image uploads for posts
   - Profile pictures

### Next Sprint
7. **Enhanced Chat** (3-4 days)
8. **Project Tasks** (2-3 days)
9. **Notifications Expansion** (2 days)
10. **OAuth Integration** (2-3 days)

---

## 🧪 Testing Status

### What's Tested
- ✅ Dev login flow
- ✅ Dashboard displays posts/events/projects
- ✅ Multi-org collaboration display
- ✅ Seed script populates data
- ✅ Database queries return data

### What Needs Testing
- ⏳ Event RSVP flow
- ⏳ Project progress updates
- ⏳ Collaboration invitations
- ⏳ Notification system
- ⏳ Search functionality
- ⏳ Form submissions
- ⏳ File uploads
- ⏳ Mobile responsiveness
- ⏳ Error handling
- ⏳ Performance under load

### Testing Approach
- Currently: Manual testing in development
- Future: Jest + React Testing Library
- Future: E2E tests with Playwright
- Future: Supabase Edge Function tests

---

## 📊 Metrics & KPIs (Future)

### User Engagement
- Daily active users
- Posts created per day
- Events attended
- Projects joined
- Collaborations formed

### Platform Health
- Page load times
- API response times
- Error rates
- Uptime
- Database query performance

### Business Goals
- Number of organizations onboarded
- Cross-org collaborations
- Event attendance rates
- Resource sharing instances
- Community satisfaction score

---

## 🤝 Team & Workflow

### Current Team
- **Developer:** Josh (with Claude Code)
- **Designer:** TBD
- **Product:** Josh

### Development Workflow
1. Feature planning in markdown docs
2. Database schema design
3. TypeScript types generation
4. UI component creation
5. Server actions implementation
6. Integration testing
7. Documentation update

### Git Workflow
- **Main branch:** Stable, deployable code
- **Feature branches:** Not currently using
- **Commit style:** Descriptive with Claude Code attribution

**Recent commits:**
```
2f0ae3b Wire up dev login with new app schema
dcfadec Integrate Supabase database with TypeScript types
eece902 Fix header icons, bell animation, nav bar styling
```

---

## 📚 Documentation Index

### Technical Docs
- [CLAUDE.md](CLAUDE.md) - Architecture patterns, database schema, query helpers
- [COLLABORATION_FEATURE.md](COLLABORATION_FEATURE.md) - Collaboration feature specs
- [README.md](README.md) - Setup and installation
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - This file

### Database
- [cleanup_user_memberships.sql](cleanup_user_memberships.sql) - Schema simplification
- [add_collaboration_tables.sql](add_collaboration_tables.sql) - Phase 2 migration
- [seed-database.ts](seed-database.ts) - Test data script

### Types
- [src/lib/database.types.ts](src/lib/database.types.ts) - Generated from Supabase
- [src/lib/collaboration.types.ts](src/lib/collaboration.types.ts) - Collaboration types
- [src/lib/types.ts](src/lib/types.ts) - Feed item types

---

## 🎓 Learning Resources Used

### Technologies
- Next.js 14 App Router: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- ShadCN UI: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs

### Design Inspiration
- Instagram collaboration posts (for multi-org display)
- Slack (for chat and notifications)
- Asana (for project management)
- LinkedIn (for directory and profiles)

---

## 💡 Key Decisions Made

### Architecture Decisions
1. **Next.js App Router** over Pages Router (better for server components)
2. **Supabase** over custom backend (faster development, built-in auth)
3. **Public schema** over app schema (simpler, more standard)
4. **Single-org membership** over many-to-many (MVP simplification)
5. **Server actions** over API routes (type-safe, less boilerplate)

### Feature Decisions
1. **Collaboration invitations** require approval (not automatic)
2. **Notifications** go to org admin (not all staff)
3. **Simple chat** channel (not DMs/threads yet)
4. **RLS disabled** for development (re-enable for production)
5. **Dev login** for testing (OAuth comes later)

### Design Decisions
1. **3-column layout** for dashboard (desktop), stacks on mobile
2. **Category badges** for posts (visual organization)
3. **Progress bars** for projects (clear status)
4. **Partner avatars** with initials (no logo uploads yet)
5. **Purple/pink gradient** as primary brand color

---

## 🔮 Future Vision

### 6 Months
- All core features complete
- 5-10 organizations actively using
- Beta testing with real users
- Mobile app (React Native?)

### 1 Year
- 20+ organizations
- Advanced analytics
- AI-powered suggestions for collaborations
- Integration with external tools (Zoom, Google Calendar, etc.)
- Marketplace for services/resources

### 2 Years
- Expand to other shared office buildings
- White-label solution for other hubs
- API for third-party integrations
- Premium features for larger organizations

---

## ❓ Open Questions

1. **OAuth:** Which providers to prioritize? (Google, Microsoft, both?)
2. **Mobile:** Native app or responsive web?
3. **Monetization:** Free for nonprofits forever? Charge building managers?
4. **Scalability:** When to upgrade database plan?
5. **Moderation:** How to handle inappropriate content?
6. **Privacy:** What data can orgs see about each other?
7. **Notifications:** Email digests? Push notifications? SMS?
8. **Onboarding:** How to help new orgs get started?

---

**Last Updated:** November 24, 2025 by Claude Code
**Next Review:** December 1, 2025
**Status:** 🚀 Active Development
