# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Village Hub - Internal Communications Platform**

A Next.js 14 full-stack application enabling collaboration among charity organizations within The Village Hub building. Features include social feeds, event coordination, project management, and resource sharing.

**Stack:** Next.js 14 App Router, TypeScript, Supabase (PostgreSQL), Tailwind CSS, ShadCN UI

---

## Critical Architecture Patterns

### 1. Database Schema

This project uses the standard `public` schema for all application tables.

**Standard Supabase queries:**

```typescript
// ✅ CORRECT - Uses default public schema
const { data } = await supabase
  .from('posts')
  .select('*')
```

**Type references use the public schema:**
```typescript
Database['public']['Tables']['posts']['Insert']
Database['public']['Enums']['post_category']
```

### 2. Supabase Client Patterns

**Server Components / API Routes:**
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()  // Note: awaited!
  const { data: { user } } = await supabase.auth.getUser()
}
```

**Client Components:**
```typescript
import { createClient } from '@/lib/supabase/client'

export function Component() {
  const supabase = createClient()  // Not awaited
}
```

**Key difference:** Server client factory is async and handles Next.js cookies, browser client is synchronous.

### 3. Authentication Flow

1. User authenticates via Supabase Auth (OAuth or dev login)
2. Profile exists in `user_profiles` (linked via `user_id` FK to `auth.users`)
3. Organization membership in `user_memberships`
4. All content scoped by `org_id`

**Fetch user profile:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', user?.id)
  .single()
```

**Note:** Auth check is enabled in `/src/app/(authenticated)/layout.tsx` - unauthenticated users are redirected to `/login`.

### 4. Route Structure

```
src/app/
├── (authenticated)/          # Protected route group
│   ├── layout.tsx           # Auth wrapper
│   └── dashboard/           # Main app
├── api/
│   └── dev-login/           # Dev-only login endpoint
├── auth/callback/           # OAuth callback
└── login/                   # Login page
```

Route groups with `(authenticated)/` prefix require authentication.

### 5. Data Fetching Patterns

**Query helpers in `/src/lib/queries/feed.ts`:**
- `getFeed(supabase, orgId, options)` - Unified feed view
- `getPostsByCategory(supabase, orgId, category, options)`
- `getEvents(supabase, orgId, options)` - With RSVPs
- `getProjects(supabase, orgId, options)` - With tasks
- `createPost(supabase, post)`
- `rsvpToEvent(supabase, params)` - With support options
- `expressProjectInterest(supabase, params)`

**All follow the pattern:**
```typescript
return { data, error }  // Consistent error handling
```

---

## Development Commands

```bash
npm run dev         # Development server (localhost:3000)
npm run build       # Production build
npm run type-check  # TypeScript validation without build
npm run lint        # ESLint

# Type generation after schema changes
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_REF \
  --schema public \
  > src/lib/database.types.ts
```

---

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Dev login only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Development Login

**Endpoint:** `POST /api/dev-login` (development only)

Creates test user with full setup:
- Email: `test@stmartins.dev`
- Password: `dev-password-123`
- Test org: `St Martins Village (Test)`
- Role: `admin`

**Usage in code:**
```typescript
const response = await fetch('/api/dev-login', { method: 'POST' })
const { email, password } = await response.json()

await supabase.auth.signInWithPassword({ email, password })
```

This bypasses OAuth setup during development.

---

## Component Organization

```
src/components/
├── ui/              # ShadCN components (37+ components)
│                    # Customizable, fully owned
├── social/          # Social feed components
│   ├── dashboard.tsx        # Main 3-column layout
│   ├── main-feed.tsx        # Central feed
│   ├── left-sidebar.tsx     # Navigation
│   ├── right-sidebar.tsx    # Quick actions
│   └── *-card.tsx          # Post/Event/Project cards
├── layout/          # Original layout components
├── auth/            # Login form
└── aitrium/         # 3D visual effects
```

**Adding UI components:**
```bash
npx shadcn-ui@latest add [component-name]
```

Components install to `/src/components/ui/` and are fully customizable.

---

## Database Schema Overview

**Core Tables in `public` schema:**
- `organizations` - Charity organizations
- `user_profiles` - User profiles (extends auth.users)
- `user_memberships` - User-org relationships with roles
- `posts` - Community posts (6 categories)
- `events` - Calendar events with RSVP
- `projects` - Collaborative projects with progress
- `event_rsvps` - Event attendance with support options
- `project_interests` - Project collaboration expressions
- `conversations` - Chat conversations (DMs and groups)
- `messages` - Chat messages
- `notifications` - User notifications

**Views:**
- `feed` - Unified feed (posts + events + projects)
- `jobs_board` - Combines jobs table + opportunities posts

**Enums:**
- `user_role`: admin, st_martins_staff, partner_staff, volunteer
- `post_category`: intros, wins, opportunities, questions, learnings, general
- `event_category`, `project_status`, `reaction_type`, etc.

**All types generated in:** `/src/lib/database.types.ts`

---

## Styling System

**Tailwind + CSS Variables:**
- Theme defined in `/src/app/theme.css`
- Uses `color-mix()` for dynamic colors
- Light/dark mode support
- Custom properties for colors, radius, shadows

**Utility helper:**
```typescript
import { cn } from '@/lib/utils'

className={cn("base-classes", condition && "conditional-classes")}
```

**Path aliases:**
```typescript
@/components/* → src/components/*
@/lib/*        → src/lib/*
@/hooks/*      → src/hooks/*
```

---

## Common Patterns

### Fetching User's Organization

```typescript
const { data: membership } = await supabase
  .from('user_memberships')
  .select(`
    *,
    organization:organizations(*)
  `)
  .eq('user_id', user.id)
  .eq('is_primary', true)
  .single()

const orgId = membership?.org_id
```

### Creating a Post

```typescript
import { createPost } from '@/lib/queries/feed'

const { data, error } = await createPost(supabase, {
  org_id: orgId,
  author_id: user.id,
  category: 'general',
  content: 'Hello world',
  visibility: 'org'
})
```

### Server Component Data Fetching

```typescript
export default async function Page() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  return <Component data={data} />
}
```

---

## Debugging Common Issues

### "Table not found" errors
- Verify table name is correct (e.g., `user_profiles` not `profiles`)
- Check table exists in Supabase dashboard under "public" schema

### Type errors on queries
- Regenerate types if schema changed
- Use `Database['public']['Tables']['table_name']` for typing

### Auth issues
- Check environment variables in `.env.local`
- Verify middleware is refreshing session
- Check that auth wrapper in layout.tsx is working

### Dashboard shows "there" instead of user name
- Verify profile exists in `user_profiles`
- Check dashboard is fetching from `.from('user_profiles')`
- Ensure `display_name` field is populated

---

## Current Implementation Status

**Complete:**
- Next.js 14 app structure
- Supabase integration (auth, queries)
- Dev login system
- Social dashboard UI (3-column layout)
- Database schema (public schema)
- Type generation
- Query helpers
- ShadCN component library
- Chat feature (real-time messaging)
- Notifications system (real-time)
- Search functionality
- Profile pages with activity feeds
- Polls feature
- Comments on events and projects
- RSVP and project interest functionality

**Phase 4 Recently Added:**
- OAuth providers (Google/Microsoft) - handlers in login page
- File uploads (Supabase Storage) - avatars, post-images, event-images buckets
- Post editing - authors can edit their posts
- Real-time feed updates - posts, comments, reactions update live
- Onboarding flow - new user wizard (profile, org, skills, notifications)

**Not Yet Built:**
- Admin panel

---

## Architecture Philosophy

1. **Server-first:** Default to Server Components, use `'use client'` only when needed
2. **Type-safe:** Leverage TypeScript and Supabase generated types
3. **Public schema:** Use default public schema for all queries (no `.schema()` call needed)
4. **Error handling:** Return `{ data, error }` pattern consistently
5. **Progressive enhancement:** Build core features first, enhance iteratively

---

## Additional Documentation

- `README.md` - Setup guide
- `ARCHITECTURE.md` - Full technical architecture
- `DATABASE_SCHEMA.md` - Complete schema documentation
- `PROJECT_SPECS.md` - Feature specifications
- `PHASE_1_STATUS.md` - Current sprint status
- `PERMISSIONS_MATRIX.md` - Role-based access control

---

**Last Updated:** January 6, 2026
**Version:** 2.0
