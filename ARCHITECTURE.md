# The Village Hub - Technical Architecture
## System Design & Implementation Guide v1.0

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Application Structure](#4-application-structure)
5. [Data Flow Patterns](#5-data-flow-patterns)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Database Design](#7-database-design)
8. [API Design](#8-api-design)
9. [Real-time Features](#9-real-time-features)
10. [File Storage Strategy](#10-file-storage-strategy)
11. [State Management](#11-state-management)
12. [Caching Strategy](#12-caching-strategy)
13. [Security Architecture](#13-security-architecture)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Development Workflow](#15-development-workflow)

---

## 1. Architecture Overview

### High-Level Architecture Pattern

**Monolithic Full-Stack Application with Serverless Backend**

We're building a **monorepo Next.js application** that combines:
- Server-side rendering (SSR) for initial page loads
- Client-side rendering (CSR) for dynamic interactions
- API routes as serverless functions
- Real-time subscriptions via Supabase

**Why This Pattern?**
- ✅ Single codebase = easier maintenance
- ✅ Unified deployment pipeline
- ✅ Shared TypeScript types between frontend/backend
- ✅ Optimal for team size (1-3 developers)
- ✅ Cost-effective for 50-100 users
- ✅ Easy to scale horizontally on Vercel

---

## 2. Technology Stack

### Frontend Layer

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Next.js** | 14.2+ | React framework | App Router, server components, built-in optimizations |
| **React** | 18.3+ | UI library | Industry standard, great ecosystem |
| **TypeScript** | 5.4+ | Type safety | Catch errors early, better DX, self-documenting code |
| **Tailwind CSS** | 3.4+ | Utility-first CSS | Rapid styling, small bundle, consistent design |
| **ShadCN UI** | Latest | Component library | Accessible, customizable, beautiful defaults |
| **Lucide Icons** | Latest | Icon system | Consistent, tree-shakeable, 1000+ icons |
| **Framer Motion** | 11+ | Animation library | Smooth animations, gesture support, declarative API |
| **TanStack Query** | 5+ | Server state management | Caching, optimistic updates, automatic refetching |
| **React Hook Form** | 7.5+ | Form handling | Performance, validation, great DX |
| **Zod** | 3.22+ | Schema validation | Type-safe validation, client + server reuse |

### Backend Layer

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Supabase** | Latest | Backend-as-a-Service | Auth, DB, storage, realtime in one platform |
| **PostgreSQL** | 15+ | Database | Reliable, feature-rich, excellent for relational data |
| **Supabase Auth** | Latest | Authentication | Microsoft/Google OAuth built-in, JWT tokens |
| **Supabase Storage** | Latest | File uploads | Built-in CDN, image transformations, 10GB free |
| **Supabase Realtime** | Latest | WebSocket server | Postgres CDC, broadcast channels, presence |
| **Next.js API Routes** | 14+ | Serverless functions | Edge runtime, automatic API endpoints |

### DevOps & Infrastructure

| Technology | Purpose |
|------------|---------|
| **Vercel** | Frontend hosting, edge functions, CI/CD |
| **Supabase Cloud** | Managed PostgreSQL, authentication, storage |
| **GitHub** | Version control, issue tracking |
| **GitHub Actions** | CI/CD pipelines, automated testing |
| **Sentry** | Error tracking and monitoring |
| **Plausible** | Privacy-friendly analytics |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting with Next.js config |
| **Prettier** | Code formatting |
| **Husky** | Git hooks for quality checks |
| **lint-staged** | Run linters on staged files only |
| **TypeScript** | Static type checking |
| **VS Code** | Recommended IDE with extensions |

---

## 3. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Browser)                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Next.js App (React Components)                              │    │
│  │  ├─ Pages (App Router)                                       │    │
│  │  ├─ Components (ShadCN UI + Custom)                         │    │
│  │  ├─ State Management (TanStack Query + React Context)       │    │
│  │  └─ Styles (Tailwind CSS)                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK (CDN)                         │
│  ├─ Static Assets (images, fonts, JS bundles)                       │
│  ├─ ISR Pages (cached server-rendered pages)                        │
│  └─ Edge Functions (API routes at edge locations)                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
            ┌────────────────┴─────────────────┐
            │                                  │
┌───────────┴──────────────┐      ┌───────────┴──────────────────────┐
│   NEXT.JS SERVER         │      │   SUPABASE PLATFORM              │
│   (Vercel Serverless)    │      │                                  │
│                          │      │  ┌────────────────────────────┐  │
│  API Routes:             │◄────►│  │  PostgreSQL Database       │  │
│  ├─ /api/auth/[...auth]  │      │  │  ├─ Tables                 │  │
│  ├─ /api/posts/*         │      │  │  ├─ Row Level Security     │  │
│  ├─ /api/events/*        │      │  │  ├─ Functions & Triggers   │  │
│  ├─ /api/chat/*          │      │  │  └─ Indexes                │  │
│  ├─ /api/users/*         │      │  └────────────────────────────┘  │
│  └─ /api/upload/*        │      │                                  │
│                          │      │  ┌────────────────────────────┐  │
│  Server Components:      │◄────►│  │  Supabase Auth             │  │
│  ├─ Direct DB access     │      │  │  ├─ OAuth Providers        │  │
│  ├─ Data fetching        │      │  │  ├─ JWT Token Management   │  │
│  └─ Server actions       │      │  │  └─ User Sessions          │  │
└──────────────────────────┘      │  └────────────────────────────┘  │
                                  │                                  │
                                  │  ┌────────────────────────────┐  │
                                  │  │  Supabase Storage          │  │
                                  │  │  ├─ User Uploads           │  │
                                  │  │  ├─ Image Optimization     │  │
                                  │  │  └─ CDN Delivery           │  │
                                  │  └────────────────────────────┘  │
                                  │                                  │
                                  │  ┌────────────────────────────┐  │
                                  │  │  Supabase Realtime         │  │
                                  │  │  ├─ WebSocket Server        │  │
                                  │  │  ├─ Postgres CDC            │  │
                                  │  │  ├─ Broadcast Channels      │  │
                                  │  │  └─ Presence System         │  │
                                  │  └────────────────────────────┘  │
                                  └──────────────────────────────────┘
                                               │
                                               │
                                  ┌────────────┴───────────────┐
                                  │ THIRD-PARTY SERVICES       │
                                  │  ├─ Microsoft OAuth         │
                                  │  ├─ Google OAuth            │
                                  │  ├─ Sentry (Errors)         │
                                  │  └─ Plausible (Analytics)   │
                                  └────────────────────────────┘
```

---

## 4. Application Structure

### Directory Organization

```
stmartinsapp/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
├── public/
│   ├── images/                 # Static images
│   ├── fonts/                  # Custom fonts
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── (dashboard)/        # Protected route group with layout
│   │   │   ├── layout.tsx      # Sidebar + header layout
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── board/          # Community board
│   │   │   ├── calendar/       # Events calendar
│   │   │   ├── jobs/           # Jobs board
│   │   │   ├── chat/           # Community chat
│   │   │   ├── menu/           # Lunch menu
│   │   │   ├── notes/          # Meeting notes
│   │   │   ├── media/          # Media coverage
│   │   │   ├── settings/       # User settings
│   │   │   └── admin/          # Admin panel
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   ├── posts/
│   │   │   ├── events/
│   │   │   ├── chat/
│   │   │   ├── users/
│   │   │   └── upload/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing/redirect page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ui/                 # ShadCN UI components
│   │   ├── layout/             # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── board/              # Community board components
│   │   ├── calendar/           # Calendar components
│   │   ├── chat/               # Chat components
│   │   └── shared/             # Reusable components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser Supabase client
│   │   │   ├── server.ts       # Server Supabase client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── utils.ts            # Utility functions
│   │   ├── validations.ts      # Zod schemas
│   │   └── constants.ts        # App constants
│   ├── hooks/
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useUser.ts          # Current user hook
│   │   ├── usePosts.ts         # Posts data hook
│   │   └── useChat.ts          # Chat realtime hook
│   ├── types/
│   │   ├── database.ts         # Supabase generated types
│   │   ├── auth.ts             # Auth types
│   │   └── index.ts            # Shared types
│   └── styles/
│       └── themes.ts           # Theme configuration
├── supabase/
│   ├── migrations/             # Database migrations
│   └── seed.sql                # Seed data for development
├── tests/
│   ├── unit/                   # Jest unit tests
│   └── e2e/                    # Playwright E2E tests (Phase 2)
├── .env.local.example          # Environment variables template
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
├── PROJECT_SPECS.md            # This document
├── ARCHITECTURE.md             # Technical architecture
└── README.md                   # Setup instructions
```

---

## 5. Data Flow Patterns

### Pattern 1: Server-Side Rendered Page (Initial Load)

```
User Request → Next.js Server → Supabase Query → Render HTML → Browser
                                      ↓
                              Check auth session
                              Apply RLS policies
                              Fetch page data
```

**Use Cases:**
- Dashboard initial load
- SEO-important pages
- Static content (lunch menu, meeting notes list)

**Implementation:**
```typescript
// app/(dashboard)/page.tsx
export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return <Dashboard user={user} initialPosts={posts} />;
}
```

---

### Pattern 2: Client-Side Data Fetching (Dynamic Content)

```
User Action → React Component → TanStack Query → API Route → Supabase → Response
                                       ↓
                              Cache management
                              Optimistic updates
                              Background refetch
```

**Use Cases:**
- Community board infinite scroll
- Event filtering
- Search functionality
- User interactions (like, comment)

**Implementation:**
```typescript
// hooks/usePosts.ts
export function usePosts(filters: PostFilters) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: async () => {
      const response = await fetch('/api/posts?' + new URLSearchParams(filters));
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Component usage
function CommunityBoard() {
  const { data, isLoading } = usePosts({ category: 'announcements' });
  // ... render
}
```

---

### Pattern 3: Real-Time Updates (Chat, Live Notifications)

```
Database Change → Postgres Trigger → Supabase Realtime → WebSocket → Client Update
                                              ↓
                                      Broadcast to subscribers
                                      Filter by RLS policies
```

**Use Cases:**
- Chat messages
- Live notifications
- Presence indicators (who's online)

**🔑 Critical Clarification: How Real-Time Chat Actually Works**

**The chat feature does NOT run on Vercel.** This is important to understand:

1. **Vercel's Role:** Serves the chat UI (React components) once when user visits `/chat`
2. **Direct Connection:** The browser opens a direct, persistent WebSocket connection to Supabase Realtime API
3. **Message Flow:** All chat messages flow directly between the browser and Supabase, bypassing Vercel entirely
4. **Supabase Handles:** All message passing, presence tracking, and state synchronization

**This is exactly how Slack and Discord work:**
- Web servers serve the interface
- Real-time service (separate infrastructure) handles the live messaging
- WebSocket connections maintained directly between clients and real-time service

**Why This Scales:**
- Vercel doesn't get bogged down with thousands of long-lived WebSocket connections
- Supabase is built to handle thousands of concurrent real-time connections
- Each service does what it's best at
- Can scale each independently as needed

**Implementation:**
```typescript
// hooks/useChat.ts
export function useChatMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // This creates a DIRECT WebSocket connection from browser to Supabase
    // Vercel is not involved in this connection
    const channel = supabase
      .channel(`chat:${channelId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          // Message arrives instantly via WebSocket
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId]);

  return messages;
}
```

**Performance Characteristics:**
- Message latency: ~50-100ms (very fast)
- Connection overhead: Minimal (one WebSocket per user)
- Scalability: Supabase can handle 1000+ concurrent connections easily
- For 50-100 users: This is well within free tier capabilities

---

### Pattern 4: Form Submission with Validation

```
User Input → Client Validation (Zod) → API Route → Server Validation (Zod) → Supabase Insert → Response
                    ↓                                        ↓
              Show errors                           Sanitize data
              Prevent submit                        Check permissions
```

**Use Cases:**
- Creating posts
- Updating user profile
- Submitting job listings

**Implementation:**
```typescript
// lib/validations.ts
export const createPostSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10),
  category: z.enum(['announcement', 'event', 'job', 'story']),
});

// app/api/posts/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const validated = createPostSchema.parse(body); // Throws if invalid

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('posts')
    .insert(validated)
    .select()
    .single();

  return Response.json(data);
}
```

---

## 6. Authentication & Authorization

### Authentication Flow

**OAuth Flow (Microsoft/Google):**

```
1. User clicks "Login with Microsoft/Google"
   ↓
2. Next.js redirects to /api/auth/[provider]
   ↓
3. User redirected to provider login page
   ↓
4. User authenticates with provider
   ↓
5. Provider redirects to /api/auth/callback with code
   ↓
6. Supabase exchanges code for JWT access token
   ↓
7. Set httpOnly cookie with session
   ↓
8. Redirect to /dashboard
```

**Implementation:**
```typescript
// app/api/auth/[...supabase]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

---

### Authorization Strategy

**Row Level Security (RLS) in Supabase:**

Every table has RLS policies that enforce permissions at the database level, not just in application code.

**Example Policies:**

```sql
-- posts table policies

-- Anyone authenticated can read posts
CREATE POLICY "Posts are viewable by authenticated users"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

-- Only post author, admins, or st_martins_staff can update
CREATE POLICY "Posts can be updated by author or admins"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'st_martins_staff')
    )
  );

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
```

**Application-Level Permission Checks:**

```typescript
// lib/permissions.ts
export enum Role {
  ADMIN = 'admin',
  ST_MARTINS_STAFF = 'st_martins_staff',
  PARTNER_STAFF = 'partner_staff',
  VOLUNTEER = 'volunteer',
}

export function canCreatePost(userRole: Role): boolean {
  return [Role.ADMIN, Role.ST_MARTINS_STAFF, Role.PARTNER_STAFF].includes(userRole);
}

export function canPinPost(userRole: Role): boolean {
  return [Role.ADMIN, Role.ST_MARTINS_STAFF].includes(userRole);
}

export function canModerateContent(userRole: Role): boolean {
  return [Role.ADMIN, Role.ST_MARTINS_STAFF].includes(userRole);
}
```

---

### Session Management

- **Session Duration:** 7 days
- **Refresh Token:** 30 days (stored in httpOnly cookie)
- **Automatic Refresh:** Supabase client handles token refresh
- **Logout:** Clear cookies and revoke session

```typescript
// middleware.ts - Protect routes
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

---

## 7. Database Design

**See DATABASE_SCHEMA.md for complete schema** (to be created next)

### Key Design Principles

1. **Normalization:** 3rd Normal Form (3NF) to reduce redundancy
2. **Indexing:** B-tree indexes on foreign keys and frequently queried columns
3. **Constraints:** Foreign keys, check constraints for data integrity
4. **Audit Fields:** `created_at`, `updated_at`, `deleted_at` on all tables
5. **Soft Deletes:** Use `deleted_at` instead of hard deletes for recoverability
6. **UUID Primary Keys:** Better for distributed systems, avoid enumeration attacks

### Core Tables Overview

```
users
├─ id (uuid, PK)
├─ email (unique)
├─ full_name
├─ role (enum)
├─ organization_id (FK → organizations)
├─ avatar_url
├─ created_at
└─ updated_at

posts
├─ id (uuid, PK)
├─ author_id (FK → users)
├─ title
├─ content
├─ category (enum)
├─ is_pinned
├─ pinned_at
├─ expires_at
├─ created_at
└─ updated_at

events
├─ id (uuid, PK)
├─ organizer_id (FK → users)
├─ title
├─ description
├─ start_time
├─ end_time
├─ location
├─ is_recurring
├─ recurrence_rule (RRULE format)
├─ created_at
└─ updated_at

chat_channels
├─ id (uuid, PK)
├─ name
├─ type (public, private, org)
├─ organization_id (FK → organizations, nullable)
├─ created_at
└─ updated_at

chat_messages
├─ id (uuid, PK)
├─ channel_id (FK → chat_channels)
├─ user_id (FK → users)
├─ content
├─ created_at
└─ updated_at

(Additional tables for jobs, meeting_notes, media_coverage, etc.)
```

---

## 8. API Design

### RESTful Conventions

**Endpoints follow this pattern:**
```
GET    /api/[resource]           # List resources (with pagination, filters)
GET    /api/[resource]/[id]      # Get single resource
POST   /api/[resource]           # Create resource
PATCH  /api/[resource]/[id]      # Update resource
DELETE /api/[resource]/[id]      # Delete resource
```

### Example: Posts API

```typescript
// app/api/posts/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const supabase = createServerClient();
  let query = supabase
    .from('posts')
    .select('*, author:users(id, full_name, avatar_url)', { count: 'exact' })
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, count, error } = await query;

  return Response.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const validated = createPostSchema.parse(body);

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!canCreatePost(userData?.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ ...validated, author_id: user.id })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
```

### Error Response Format

```typescript
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* optional additional context */ }
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (not logged in)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

---

## 9. Real-time Features

### Supabase Realtime Architecture

**Three Realtime Modes:**

1. **Postgres Changes (Database CDC):** Listen to INSERT, UPDATE, DELETE on tables
2. **Broadcast:** Send ephemeral messages to channel subscribers
3. **Presence:** Track who's online in a channel

### Chat Implementation

```typescript
// hooks/useChat.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types';

export function useChat(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Fetch initial messages
    supabase
      .from('chat_messages')
      .select('*, user:users(id, full_name, avatar_url)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => setMessages(data || []));

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch user data for new message
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          setMessages((prev) => [...prev, { ...payload.new, user }]);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .subscribe();

    // Track presence
    channel.track({ user_id: supabase.auth.user()?.id });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const sendMessage = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content,
      });
  };

  return { messages, onlineUsers, sendMessage };
}
```

---

## 10. File Storage Strategy

### Supabase Storage Buckets

**Bucket Organization:**
```
avatars/           # User profile pictures
  └─ [user-id].[ext]

posts/             # Post attachments
  └─ [post-id]/
      ├─ attachment1.pdf
      └─ image.jpg

events/            # Event flyers, documents
  └─ [event-id]/

meeting-notes/     # Meeting note documents
  └─ [note-id]/

media/             # Media coverage images
  └─ [article-id]/
```

### Upload Flow

```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const bucket = formData.get('bucket') as string;

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB
    return Response.json({ error: 'File too large' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return Response.json({ url: publicUrl });
}
```

### Storage Policies (RLS)

```sql
-- Allow authenticated users to upload to posts bucket
CREATE POLICY "Users can upload to posts bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'posts');

-- Allow users to read all files in posts bucket
CREATE POLICY "Anyone can view posts files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'posts');

-- Users can only delete their own uploads
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'posts' AND owner = auth.uid());
```

---

## 11. State Management

### Three-Layer State Strategy

**1. Server State (TanStack Query):**
- Data from database (posts, events, users)
- Automatic caching, refetching, invalidation
- Optimistic updates

**2. Client State (React Context):**
- UI state (sidebar open/closed, modal visibility)
- User preferences (theme, notification settings)
- Temporary form state

**3. URL State (Next.js Router):**
- Filters, search queries, pagination
- Shareable state via URL
- Browser back/forward support

### Example: Filter State in URL

```typescript
// app/(dashboard)/board/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export default function CommunityBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'all';

  const { data: posts } = usePosts({ category });

  const setCategory = (newCategory: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', newCategory);
    router.push(`/board?${params.toString()}`);
  };

  return (
    <div>
      <CategoryFilter value={category} onChange={setCategory} />
      <PostList posts={posts} />
    </div>
  );
}
```

---

## 12. Caching Strategy

### Multi-Level Caching

**Level 1: Browser Cache**
- Static assets (images, JS, CSS) cached by Vercel CDN
- Cache-Control headers set appropriately

**Level 2: TanStack Query Cache**
- In-memory cache for API responses
- Configurable stale time per query
- Background refetching

**Level 3: Next.js ISR (Incremental Static Regeneration)**
- Static pages regenerated on-demand
- Useful for relatively static content (lunch menu, meeting notes)

**Level 4: Database (Future Phase 2)**
- Redis cache for frequent queries
- Session storage
- Rate limit counters

### Cache Invalidation Strategy

```typescript
// components/CreatePostDialog.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreatePostDialog() {
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: async (data: CreatePostInput) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate posts cache to refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // ... form handling
}
```

---

## 13. Security Architecture

### Security Layers

**1. Network Layer:**
- HTTPS only (enforced by Vercel)
- CORS policies on API routes
- Rate limiting on API endpoints

**2. Authentication Layer:**
- OAuth 2.0 for Microsoft/Google
- JWT tokens with short expiry
- HttpOnly cookies (no localStorage)
- CSRF tokens on mutations

**3. Authorization Layer:**
- Row Level Security in Supabase
- Application-level permission checks
- Role-based access control

**4. Data Layer:**
- Input validation (Zod schemas)
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping + CSP headers)
- Content sanitization for rich text

**5. Application Layer:**
- Security headers (helmet)
- File upload validation
- Rate limiting per user
- Logging and monitoring

### Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 14. Deployment Architecture

### Development Environment

```
Local Machine
├─ Next.js Dev Server (localhost:3000)
├─ Supabase Local Instance (Docker) or Cloud Dev Project
└─ Environment: .env.local
```

### Staging Environment

```
Vercel Preview Deployment
├─ Triggered on PR creation
├─ Unique URL per PR
├─ Connected to Supabase Staging Project
└─ Environment: Vercel Environment Variables (Staging)
```

### Production Environment

```
Vercel Production
├─ Deployed on merge to main branch
├─ Custom domain: internal-comms.villagehub.org (example)
├─ Edge Network (CDN)
├─ Serverless Functions (API routes)
└─ Connected to Supabase Production Project
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy-staging:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 15. Development Workflow

### Local Development Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd stmartinsapp

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with Supabase credentials

# 4. Run database migrations (if using Supabase CLI)
npx supabase db push

# 5. Start development server
npm run dev
```

### Git Workflow

```
main (production)
  ↑
  └─ Pull Request
       ↑
     feature/[feature-name]
```

**Branch Naming:**
- `feature/community-board`
- `fix/auth-redirect`
- `refactor/api-routes`
- `docs/architecture-update`

**Commit Convention:**
```
type(scope): subject

feat(board): add post filtering
fix(auth): resolve OAuth callback error
docs(readme): update setup instructions
refactor(api): simplify posts endpoint
```

---

## Performance Optimization Strategies

### 1. Image Optimization
- Use Next.js `<Image>` component
- Automatic WebP conversion
- Lazy loading by default
- Responsive srcset generation

### 2. Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Lazy load modals, dialogs

### 3. Database Optimization
- Indexes on foreign keys
- Composite indexes for common queries
- Query result pagination
- Select only needed columns

### 4. Bundle Size Optimization
- Tree shaking (automatic with Next.js)
- Analyze bundle with `@next/bundle-analyzer`
- Dynamic imports for large libraries
- Remove unused dependencies

---

## Monitoring & Observability

### Error Tracking (Sentry)

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### Analytics (Plausible)

```typescript
// app/layout.tsx
<Script
  defer
  data-domain="internal-comms.villagehub.org"
  src="https://plausible.io/js/script.js"
/>
```

### Performance Monitoring

- Vercel Analytics for Core Web Vitals
- Supabase dashboard for query performance
- Custom logging for business metrics

---

## Technology Decision Rationale

### Why Supabase over Prisma?

| Criteria | Supabase | Prisma |
|----------|----------|--------|
| **Auth Built-in** | ✅ Yes | ❌ No (need separate solution) |
| **Realtime** | ✅ Built-in | ❌ Need separate WebSocket server |
| **File Storage** | ✅ Included | ❌ Need S3/Cloudinary |
| **Admin UI** | ✅ Dashboard included | ❌ Need Prisma Studio |
| **Hosting** | ✅ Managed | ❌ Self-host PostgreSQL |
| **Setup Time** | ✅ Minutes | ⚠️ Hours |
| **Cost (50-100 users)** | ✅ Free tier sufficient | ⚠️ Need paid DB hosting |

**Verdict:** Supabase provides more out-of-the-box for this use case, reducing development time by ~40%.

### Why Not Convex?

Convex is excellent for real-time-first apps, but:
- Less mature OAuth integration
- Smaller ecosystem/community
- Vendor lock-in (proprietary query language)
- Harder to migrate data out later
- Team may not be familiar with it

**Supabase = PostgreSQL**, which is industry standard and portable.

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Next Review:** After Phase 1 completion
