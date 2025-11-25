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
2. Profile exists in `app.profiles` (linked via `user_id` FK to `auth.users`)
3. Organization membership in `app.organization_members`
4. All content scoped by `org_id`

**Fetch user profile:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: profile } = await supabase
  .schema('app')
  .from('profiles')
  .select('*')
  .eq('id', user?.id)
  .single()
```

**Note:** Auth check is currently disabled in `/src/app/(authenticated)/layout.tsx` for development (lines 11-14 commented out).

### 4. Route Structure

```
src/app/
├── (authenticated)/          # Protected route group
│   ├── layout.tsx           # Auth wrapper (currently disabled)
│   └── dashboard/           # Main app
├── api/
│   └── dev-login/           # Dev-only login endpoint
├── auth/callback/           # OAuth callback
└── login/                   # Login page
```

Route groups with `(authenticated)/` prefix require authentication (when enabled).

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
  --schema app \
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

**Core Tables in `app` schema:**
- `organizations` - Charity organizations
- `profiles` - User profiles (extends auth.users)
- `organization_members` - User-org relationships with roles
- `posts` - Community posts (6 categories)
- `events` - Calendar events with RSVP
- `projects` - Collaborative projects with progress
- `event_rsvps` - Event attendance with support options
- `project_interests` - Project collaboration expressions

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
  .schema('app')
  .from('organization_members')
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
    .schema('app')
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
- ✅ Verify using `.schema('app')` in query
- ✅ Check table exists in Supabase dashboard under "app" schema

### Type errors on queries
- ✅ Regenerate types if schema changed
- ✅ Use `Database['app']['Tables']['table_name']` for typing

### Auth issues
- ✅ Check environment variables in `.env.local`
- ✅ Verify middleware is refreshing session
- ✅ Check if auth wrapper is commented out (current dev state)

### Dashboard shows "there" instead of user name
- ✅ Verify profile exists in `app.profiles`
- ✅ Check dashboard is fetching from `.schema('app').from('profiles')`
- ✅ Ensure `display_name` field is populated

---

## Current Implementation Status

**✅ Complete:**
- Next.js 14 app structure
- Supabase integration (auth, queries)
- Dev login system
- Social dashboard UI (3-column layout)
- Database schema (26 tables in `app` schema)
- Type generation
- Query helpers
- ShadCN component library

**🚧 In Progress:**
- Connecting feed to real database data
- TanStack Query integration

**❌ Not Yet Built:**
- OAuth providers (Microsoft/Google)
- Real-time subscriptions
- File uploads
- Chat feature
- Admin panel
- Search functionality
- Notifications

---

## Architecture Philosophy

1. **Server-first:** Default to Server Components, use `'use client'` only when needed
2. **Type-safe:** Leverage TypeScript and Supabase generated types
3. **Schema-aware:** Always specify `.schema('app')` in queries
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

**Last Updated:** November 20, 2025
**Version:** 1.0
