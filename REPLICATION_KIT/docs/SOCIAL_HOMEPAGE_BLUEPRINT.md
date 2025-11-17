# Social Homepage Blueprint & Reference Guide

## 📋 Table of Contents

1. [Visual Layout (ASCII Diagrams)](#visual-layout)
2. [Login Page Architecture](#login-page)
3. [Design System & Styling](#design-system)
4. [UI/UX Patterns](#uiux-patterns)
5. [Architecture Overview](#architecture)
6. [Component Documentation](#components)
7. [Content Type System](#content-types)
8. [User Interaction Flows](#interaction-flows)
9. [Data Structures](#data-structures)
10. [Design Patterns & Best Practices](#best-practices)

---

## 1. Visual Layout (ASCII Diagrams) {#visual-layout}

### Overall Page Structure (Desktop - 1400px max-width)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER (Sticky)                                 │
│  [Logo] [Nav: Home Chats Directory Tools ...] [Search] [🔔] [👤] [☰]       │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌───────────────────────────┐  ┌──────────────────┐  │
│  │  LEFT SIDEBAR   │  │      MAIN FEED            │  │  RIGHT SIDEBAR   │  │
│  │    (280px)      │  │       (1fr)               │  │     (320px)      │  │
│  │─────────────────│  │───────────────────────────│  │──────────────────│  │
│  │                 │  │                           │  │                  │  │
│  │ ┌─────────────┐ │  │ ┌───────────────────────┐ │  │ ┌──────────────┐ │  │
│  │ │  Welcome    │ │  │ │ Alert Banner (if any) │ │  │ │  Priority    │ │  │
│  │ │   Card      │ │  │ └───────────────────────┘ │  │ │   Alert      │ │  │
│  │ │ Gradient BG │ │  │                           │  │ │ (dismissible)│ │  │
│  │ │ User Avatar │ │  │ ┌───────────────────────┐ │  │ └──────────────┘ │  │
│  │ └─────────────┘ │  │ │ Create Post Card      │ │  │        ↓         │  │
│  │                 │  │ │ ─────────────────────  │ │  │ ┌──────────────┐ │  │
│  │ ┌─────────────┐ │  │ │ Welcome Header        │ │  │ │   Events     │ │  │
│  │ │  My Team    │ │  │ │ [AI Summary Button]   │ │  │ │  Carousel    │ │  │
│  │ │─────────────│ │  │ │                       │ │  │ │ (auto-scroll)│ │  │
│  │ │ Hope Found. │ │  │ │ Avatar + Textarea     │ │  │ │   - Image    │ │  │
│  │ │             │ │  │ │ Category Selector     │ │  │ │   - Details  │ │  │
│  │ │ [Avatars]   │ │  │ │ [Photo][Attach][...]  │ │  │ │   - Attend   │ │  │
│  │ │ +8 members  │ │  │ │ [Create▼] [Post →]   │ │  │ │              │ │  │
│  │ └─────────────┘ │  │ └───────────────────────┘ │  │ └──────────────┘ │  │
│  │                 │  │                           │  │                  │  │
│  │ ┌─────────────┐ │  │ ┌───────────────────────┐ │  │  (Sticky: top-24)│  │
│  │ │ Community   │ │  │ │ Filter Bar            │ │  │                  │  │
│  │ │ Highlights  │ │  │ │ [All][Events][...]    │ │  │                  │  │
│  │ │ (Carousel)  │ │  │ │ Sort: [Latest][...]   │ │  │                  │  │
│  │ │  • Collab   │ │  │ └───────────────────────┘ │  │                  │  │
│  │ │  • Projects │ │  │                           │  │                  │  │
│  │ │  • Events   │ │  │ ┌───────────────────────┐ │  │                  │  │
│  │ │ Auto-rotate │ │  │ │   EVENT CARD          │ │  │                  │  │
│  │ └─────────────┘ │  │ │─────────────────────  │ │  │                  │  │
│  │                 │  │ │ [Avatar(s)] Author    │ │  │                  │  │
│  │ (Sticky: top-24)│  │ │ [Cause Badge]         │ │  │                  │  │
│  │                 │  │ │ Title (bold, xl)      │ │  │                  │  │
│  │                 │  │ │ Description           │ │  │                  │  │
│  │                 │  │ │ [Date/Time/Location]  │ │  │                  │  │
│  │                 │  │ │ Looking for: chips    │ │  │                  │  │
│  │                 │  │ │ Interest Counter      │ │  │                  │  │
│  │                 │  │ │ [♡ 0][💬 0] [Attend]  │ │  │                  │  │
│  │                 │  │ └───────────────────────┘ │  │                  │  │
│  │                 │  │                           │  │                  │  │
│  │                 │  │ ┌───────────────────────┐ │  │                  │  │
│  │                 │  │ │  PROJECT CARD         │ │  │                  │  │
│  │                 │  │ │─────────────────────  │ │  │                  │  │
│  │                 │  │ │ [Avatar(s)] Author    │ │  │                  │  │
│  │                 │  │ │ [Cause Badge]         │ │  │                  │  │
│  │                 │  │ │ Title (bold, xl)      │ │  │                  │  │
│  │                 │  │ │ Description           │ │  │                  │  │
│  │                 │  │ │ ┌─────────────────┐   │ │  │                  │  │
│  │                 │  │ │ │ Impact Goal Box │   │ │  │                  │  │
│  │                 │  │ │ └─────────────────┘   │ │  │                  │  │
│  │                 │  │ │ Progress: [███▒▒] 67% │ │  │                  │  │
│  │                 │  │ │ [Date][Events: 3]     │ │  │                  │  │
│  │                 │  │ │ Looking for: chips    │ │  │                  │  │
│  │                 │  │ │ Partners: [avatars]   │ │  │                  │  │
│  │                 │  │ │ [♡ 0][💬 0][Interest] │ │  │                  │  │
│  │                 │  │ └───────────────────────┘ │  │                  │  │
│  │                 │  │                           │  │                  │  │
│  │                 │  │ ┌───────────────────────┐ │  │                  │  │
│  │                 │  │ │ AI SUMMARY CARD       │ │  │                  │  │
│  │                 │  │ │ (Orange gradient)     │ │  │                  │  │
│  │                 │  │ │ Expandable insights   │ │  │                  │  │
│  │                 │  │ └───────────────────────┘ │  │                  │  │
│  │                 │  │                           │  │                  │  │
│  │                 │  │ ┌───────────────────────┐ │  │                  │  │
│  │                 │  │ │    POST CARD          │ │  │                  │  │
│  │                 │  │ │─────────────────────  │ │  │                  │  │
│  │                 │  │ │ [Avatar] Author       │ │  │                  │  │
│  │                 │  │ │ [Category Badge]      │ │  │                  │  │
│  │                 │  │ │ Title (optional)      │ │  │                  │  │
│  │                 │  │ │ Content text          │ │  │                  │  │
│  │                 │  │ │ [About: Event/Project]│ │  │                  │  │
│  │                 │  │ │ [♡ 24][💬 8][View →]  │ │  │                  │  │
│  │                 │  │ └───────────────────────┘ │  │                  │  │
│  │                 │  │          ...              │  │                  │  │
│  └─────────────────┘  └───────────────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

**Mobile (< 1024px):**
```
┌─────────────────────────┐
│        HEADER           │
│ [☰] [Logo] [Search] [🔔]│
└─────────────────────────┘
┌─────────────────────────┐
│                         │
│    MAIN FEED ONLY       │
│  (Full width, no sides) │
│                         │
│  ┌───────────────────┐  │
│  │ Create Post Card  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  EVENT CARD       │  │
│  └───────────────────┘  │
│         ...             │
└─────────────────────────┘
```

**Tablet (1024px - 1400px):**
- Left sidebar hidden (below lg breakpoint)
- Right sidebar hidden (below lg breakpoint)
- Main feed expands to full width
- All content remains accessible via navigation

### Component Hierarchy Tree

```
SocialPage
├── Header (sticky top-0)
│   ├── Logo (animated, hover effects)
│   ├── Navigation
│   │   ├── NavItem × 8 (Home, Chats, Directory, etc.)
│   │   └── Badge (notification count on Chats)
│   ├── SearchBar (animated focus)
│   └── ActionButtons
│       ├── NotificationButton (with badge + pulse)
│       ├── UserButton
│       └── MobileMenuButton
│
├── LeftSidebar (lg:block, hidden below)
│   ├── WelcomeCard
│   │   ├── Avatar
│   │   └── Greeting
│   ├── MyTeamCard
│   │   ├── TeamAvatars (overlapping)
│   │   │   └── ActivityTooltip (on hover)
│   │   └── MemberCount
│   └── CommunityHighlights (carousel)
│       └── HighlightCard × 3 (auto-rotate)
│
├── MainFeed
│   ├── AlertBanner (conditional)
│   ├── CreatePostCard
│   │   ├── Avatar
│   │   ├── Textarea (with @mention autocomplete)
│   │   ├── CategorySelector (animated expansion)
│   │   ├── AttachmentButtons
│   │   │   ├── Photo
│   │   │   ├── Attachment
│   │   │   ├── Poll
│   │   │   ├── Emoji
│   │   │   └── TagSelector (dropdown)
│   │   └── Actions
│   │       ├── CreateDropdown (Event/Project/Alert)
│   │       └── PostButton
│   ├── FilterBar
│   │   ├── TypeFilters [All, Events, Projects, Posts]
│   │   └── SortOptions [Latest, Shared by, Shared with]
│   └── FeedItems[]
│       ├── EventCard
│       ├── ProjectCard
│       ├── PostCard
│       └── AISummaryCard (after 2nd item)
│
└── RightSidebar (lg:block, hidden below)
    ├── PriorityAlert (dismissible)
    │   └── AnimatePresence transition
    └── AnimatedEvents (carousel, auto-scroll)
```

---

## 2. Login Page Architecture {#login-page}

### Visual Structure

```
┌──────────────────────────────────────────────────────────────┐
│                         FULL VIEWPORT                         │
│                                                               │
│  LEFT HALF (50%)              │        RIGHT HALF (50%)       │
│  ─────────────────────────────┼───────────────────────────── │
│                               │                               │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │  SPHERE IMAGE GRID      │  │  │   LOGIN FORM            │ │
│  │  (Interactive 3D)       │  │  │   (Centered)            │ │
│  │                         │  │  │                         │ │
│  │  • 30+ partner images   │  │  │  ┌─────────────────┐   │ │
│  │  • Mouse tracking       │  │  │  │  Logo/Branding  │   │ │
│  │  • Depth parallax       │  │  │  │                 │   │ │
│  │  • Hover zoom effects   │  │  │  │  "Welcome back" │   │ │
│  │  • Canvas reveal on bg  │  │  │  └─────────────────┘   │ │
│  │                         │  │  │                         │ │
│  │                         │  │  │  Step 1: Email          │ │
│  │                         │  │  │  ┌─────────────────┐   │ │
│  │                         │  │  │  │ email@domain    │   │ │
│  │                         │  │  │  └─────────────────┘   │ │
│  │                         │  │  │  [Continue →]           │ │
│  │                         │  │  │                         │ │
│  │                         │  │  │  Step 2: Verification   │ │
│  │                         │  │  │  ┌───┐┌───┐┌───┐┌───┐  │ │
│  │                         │  │  │  │ 1 ││ 2 ││ 3 ││ 4 │  │ │
│  │                         │  │  │  └───┘└───┘└───┘└───┘  │ │
│  │                         │  │  │  [Verify]               │ │
│  │                         │  │  │                         │ │
│  │                         │  │  │  Step 3: Success ✓      │ │
│  │                         │  │  │  Redirecting...         │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
│                               │                               │
└───────────────────────────────────────────────────────────────┘
```

### Login Page Components

**SphereImageGrid (Left Side)**
- 3D grid of partner organization images
- Mouse parallax effect (tracks cursor position)
- Individual image hover states with zoom
- Depth layering with CSS transforms
- Canvas reveal effect background
- Responsive: Hides on mobile (< 1024px)

**Login Form (Right Side)**
- Multi-step flow: Email → Code → Success
- AnimatePresence for smooth transitions
- Step indicators showing progress
- Inline validation with error states
- "Continue" / "Verify" CTAs
- "← Back" navigation between steps

**Key Interactions:**
1. User enters email → Form validates
2. System sends code → Shows 4-digit input
3. User enters code → Verifies
4. Success animation → Redirect to /social

---

## 3. Design System & Styling {#design-system}

### Theme Architecture

**Technology Stack:**
- **CSS Custom Properties** (OKLCH color space)
- **Tailwind CSS v4** (utility-first)
- **Shadcn/ui** (component primitives)
- **Framer Motion** (animations)

### OKLCH Color System

OKLCH provides:
- Better perceptual uniformity than HSL
- Wider color gamut
- More predictable lightness
- Format: `oklch(lightness chroma hue / alpha)`

**Why OKLCH over HSL:**
- More accurate color perception across the spectrum
- Better accessibility with consistent contrast ratios
- Smoother gradients without "dead zones"
- Future-proof (part of CSS Color Level 4)

### Color Palette

#### Light Mode
```css
--background: oklch(1 0 0);              /* Pure white */
--foreground: oklch(0.145 0 0);          /* Near black */
--primary: oklch(0.45 0.18 250);         /* Vibrant blue */
--accent: oklch(0.65 0.22 280);          /* Purple accent */
--destructive: oklch(0.577 0.245 27.325); /* Red */
--success: oklch(0.65 0.18 145);         /* Green */
--warning: oklch(0.75 0.15 65);          /* Orange */
--muted: oklch(0.97 0 0);                /* Subtle gray */
--border: oklch(0.922 0 0);              /* Light gray */
```

#### Dark Mode
```css
--background: oklch(0.145 0 0);          /* Near black */
--foreground: oklch(0.985 0 0);          /* Near white */
--primary: oklch(0.65 0.22 250);         /* Lighter blue */
--accent: oklch(0.75 0.25 280);          /* Lighter purple */
--destructive: oklch(0.704 0.191 22.216); /* Lighter red */
--card: oklch(0.205 0 0);                /* Elevated surface */
--border: oklch(1 0 0 / 10%);            /* Subtle border */
```

### Surface & Overlay System

**HeroUI v3 Design Pattern:**
```css
/* Light Mode */
--surface: oklch(1 0 0);                 /* Base surface */
--surface-secondary: color-mix(...);     /* Slightly darker */
--overlay: oklch(1 0 0);                 /* Modal/popover */

/* Dark Mode */
--surface: oklch(0.18 0 0);
--overlay: oklch(0.2 0 0);               /* Slightly lighter */
```

**Usage:**
- `surface`: Cards, sidebars, base UI
- `overlay`: Modals, dropdowns, tooltips, headers

### Shadow System

**Light Mode - Soft Shadows:**
```css
--shadow-surface: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08);
--shadow-overlay: 0 4px 16px rgba(24,24,27,0.08), 0 8px 24px rgba(24,24,27,0.09);
--shadow-card: 0 2px 8px rgba(0,0,0,0.06);
```

**Dark Mode - Subtle Glows:**
```css
--shadow-surface: 0 0 0 1px rgba(255,255,255,0.05);
--shadow-overlay: 0 0 0 1px rgba(255,255,255,0.08);
--shadow-card: 0 0 0 1px rgba(255,255,255,0.05);
```

### Typography Scale

```css
--font-size-xs: 0.75rem;      /* 12px */
--font-size-sm: 0.875rem;     /* 14px */
--font-size-base: 1rem;       /* 16px */
--font-size-lg: 1.125rem;     /* 18px */
--font-size-xl: 1.25rem;      /* 20px */
--font-size-2xl: 1.5rem;      /* 24px */
--font-size-3xl: 1.875rem;    /* 30px */
--font-size-4xl: 2.25rem;     /* 36px */
```

**Font Families:**
- Sans: `var(--font-geist-sans)` (Geist Sans)
- Mono: `var(--font-geist-mono)` (Geist Mono)

**Font Features:**
- `font-feature-settings: "rlig" 1, "calt" 1;`
- Enables contextual ligatures and alternates

### Spacing System

```css
--spacing-xs: 0.25rem;    /* 4px */
--spacing-sm: 0.5rem;     /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */
--spacing-2xl: 3rem;      /* 48px */
```

### Border Radius System

```css
--radius: 0.75rem;                    /* 12px - base */
--radius-sm: calc(var(--radius) - 4px);  /* 8px */
--radius-md: calc(var(--radius) - 2px);  /* 10px */
--radius-lg: var(--radius);              /* 12px */
--radius-xl: calc(var(--radius) + 4px);  /* 16px */
```

**Usage Pattern:**
- Buttons: `rounded-lg` (12px)
- Cards: `rounded-xl` (16px)
- Inputs: `rounded-lg` (12px)
- Badges: `rounded-full` (9999px)

### Chart Colors

Used for data visualization and highlight cards:

```css
--chart-1: oklch(0.646 0.222 41.116);  /* Orange */
--chart-2: oklch(0.6 0.118 184.704);   /* Teal */
--chart-3: oklch(0.398 0.07 227.392);  /* Blue */
--chart-4: oklch(0.828 0.189 84.429);  /* Yellow */
--chart-5: oklch(0.769 0.188 70.08);   /* Amber */
```

---

## 4. UI/UX Patterns {#uiux-patterns}

### Progressive Disclosure

**Principle:** Show basic info first, reveal complexity on demand.

**Examples:**

1. **Create Post Card**
   - Default: Textarea + Post button
   - On focus: Category selector + attachment options appear
   - Smooth `AnimatePresence` transitions

2. **Event/Project Creation Modals**
   - Required fields shown by default
   - "Advanced Options" collapsible section
   - Users can skip optional fields

3. **Support Dropdown (Event/Project Cards)**
   - No needs → Simple confirmation toast
   - Has needs → Dropdown with checkboxes appears
   - User can choose to help or just track

### Micro-interactions

**Hover Effects:**
```tsx
// Button scale on hover
<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  <Button />
</motion.div>

// Card lift on hover
className="hover:shadow-md transition-shadow"
```

**Focus States:**
```tsx
// Search bar expansion
animate={{ width: isSearchFocused ? 320 : 260 }}

// Glow effect on focus
className={isSearchFocused 
  ? "ring-2 ring-primary/20 shadow-2xl shadow-primary/20"
  : "hover:border-border"
}
```

**Loading States:**
```tsx
// Notification badge pulse
<span className="absolute ... animate-ping opacity-20" />
```

### Animation Patterns

**Framer Motion Configurations:**

```tsx
// Page element stagger
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: index * 0.05 }}
>
```

**Easing Functions:**
- Default: `[0.4, 0, 0.2, 1]` (smooth ease-in-out)
- Spring: `{ type: "spring", bounce: 0.2, duration: 0.6 }`
- Quick: `{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }`

**Common Animations:**

1. **Fade + Slide Up** (cards entering)
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
```

2. **Fade + Scale** (modals, dropdowns)
```tsx
initial={{ opacity: 0, scale: 0.96 }}
animate={{ opacity: 1, scale: 1 }}
```

3. **Layout Shift** (category selector expansion)
```tsx
<motion.div layoutId="activeTab" />
```

### Visual Hierarchy Principles

**Content Priority (top to bottom):**

1. **Alert Banner** (destructive color, top of feed)
2. **Create Post Card** (prominent, always visible)
3. **Feed Items** (ordered by filters/sort)

**Card Hierarchy (within each card):**

1. **Author/Organization** (who is this from?)
2. **Type Badge** (Event/Project/Post category)
3. **Title** (what is it?)
4. **Description** (details)
5. **Metadata** (date, location, progress)
6. **Needs/Asks** (action items)
7. **Engagement** (likes, comments)
8. **CTA** (primary action)

**Visual Weight Distribution:**

- **Heavy (bold, large):** Titles, CTAs, numbers
- **Medium (semibold):** Labels, author names
- **Light (regular, muted):** Descriptions, metadata

### Card Design Patterns

**Standard Card Structure:**
```tsx
<Card className="border border-border bg-card shadow-sm hover:shadow-md">
  <div className="p-6">
    {/* Header: Avatar + Author + Menu */}
    {/* Badges: Type, Cause, Status */}
    {/* Title: text-xl font-bold */}
    {/* Description: text-sm text-muted-foreground */}
    {/* Metadata Box: bg-muted/50 rounded-xl */}
    {/* Needs: Colored chips (max 3) */}
    {/* Footer: border-t pt-4 */}
    {/*   Left: Like/Comment */}
    {/*   Right: CTA */}
  </div>
</Card>
```

**Card Elevation:**
- Default: `shadow-sm`
- Hover: `shadow-md`
- Active: `shadow-lg`
- Modal/Overlay: `shadow-2xl`

### Button States & Feedback

**Primary Button:**
```tsx
<Button className="bg-primary hover:bg-primary/90 
                   active:scale-[0.98] transition-all">
```

**States:**
- **Default:** Base color + shadow
- **Hover:** Slightly darker + scale 1.05
- **Active:** Press down scale 0.98
- **Disabled:** `opacity-40 cursor-not-allowed`
- **Loading:** Spinner + disabled state

**Semantic Colors:**
- Primary (blue): Default actions
- Success (green): Projects, positive actions
- Destructive (red): Alerts, delete actions
- Warning (amber): Needs, volunteers
- Muted (gray): Secondary actions

### Form Design Principles

**Input Fields:**
```tsx
<Input className="
  border border-border/50
  focus:border-primary/50
  focus:ring-2 focus:ring-primary/20
  transition-all duration-300
" />
```

**Textarea with Overlay (Create Post):**
- Transparent text (shows highlighted @mentions underneath)
- Colored overlay for mentions (blue)
- Caret color: `caretColor: '#111827'`

**Validation:**
- Inline errors below field
- Red border on error
- Green checkmark on success
- Real-time validation (debounced)

**Form Layout:**
- Labels above inputs
- Helper text below in muted color
- Required fields marked with `*`
- Group related fields visually

---

## 5. Architecture Overview {#architecture}

### Technology Stack

**Core:**
- Next.js 15 (App Router)
- React 18+ (Server/Client Components)
- TypeScript 5+

**Styling:**
- Tailwind CSS v4
- CSS Custom Properties (OKLCH)
- Shadcn/ui components

**Animation:**
- Framer Motion
- CSS transitions

**State Management:**
- React useState/useEffect (local state)
- Props drilling (component communication)
- Future: Consider Zustand for complex state

**Data Fetching:**
- Currently: Mock data (feedItems array)
- Future: React Query / SWR + API routes

### File Structure

```
app/
├── social/
│   └── page.tsx                 # Main social feed page
├── login/
│   └── page.tsx                 # Login page with sphere grid
├── globals.css                  # Global styles + theme imports
├── theme.css                    # OKLCH design tokens
└── layout.tsx                   # Root layout with providers

components/
├── header.tsx                   # Top navigation bar
├── left-sidebar.tsx             # Team + highlights
├── main-feed.tsx                # Central content feed
├── right-sidebar.tsx            # Alerts + events carousel
├── post-card.tsx                # Post display
├── event-card.tsx               # Event display
├── project-card.tsx             # Project display
├── create-event-dialog.tsx      # Event creation modal
├── create-project-dialog.tsx    # Project creation modal
├── send-alert-dialog.tsx        # Manager alert modal
├── animated-events.tsx          # Events carousel
├── ui/                          # Reusable UI primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── avatar.tsx
│   ├── category-badge.tsx       # Post category badges
│   ├── category-selector.tsx    # Animated category picker
│   ├── content-badge.tsx        # Event/Project/Cause badges
│   ├── needs-chip.tsx           # Volunteers/Participants chips
│   ├── partner-avatars.tsx      # Organization avatars
│   ├── interest-counter.tsx     # Engagement metrics
│   ├── post-menu.tsx            # Context menu (edit/share)
│   └── ...
└── aitrium/                     # Custom visual components
    ├── sphere-image-grid.tsx    # 3D partner grid (login)
    └── canvas-reveal-effect.tsx # Background animation

lib/
├── types.ts                     # TypeScript definitions
└── utils.ts                     # Utility functions (cn)
```

### Component Communication Patterns

**Parent → Child (Props):**
```tsx
<EventCard event={eventData} />
```

**Child → Parent (Callbacks):**
```tsx
<CreateEventDialog 
  open={showDialog}
  onOpenChange={setShowDialog}
/>
```

**Sibling Communication (Lifted State):**
```tsx
// Parent component holds shared state
const [activeFilter, setActiveFilter] = useState<FilterType>("All")

// Pass down to children
<FilterBar active={activeFilter} onChange={setActiveFilter} />
<FeedItems filter={activeFilter} />
```

### Data Flow

```
User Action (Click "Attend")
         ↓
Event Handler (handleAttendToggle)
         ↓
Local State Update (setAttending(true))
         ↓
UI Re-renders (button shows "Attending")
         ↓
Support Panel Opens (conditional render)
         ↓
User Selects Options (checkboxes)
         ↓
Submit Handler (handleSupportSubmit)
         ↓
Log to Console (TODO: API call)
         ↓
Close Panel (setSupportPanelOpen(false))
```

**Future Architecture (with API):**
```
User Action
    ↓
Optimistic Update (immediate UI feedback)
    ↓
API Call (mutate data)
    ↓
Success → Cache Invalidation (React Query)
    ↓
Re-fetch → UI syncs with server
    OR
Error → Revert optimistic update + show error
```

---

## 6. Component Documentation {#components}

### Header Component

**File:** `components/header.tsx`

**Purpose:** Sticky top navigation with branding, nav links, search, and actions.

**Features:**
- Animated logo with hover effects
- Navigation items with active state indicator
- Badge on "Chats" (notification count)
- Expandable search bar (260px → 320px on focus)
- Notification button with pulse animation
- User profile button
- Mobile menu toggle

**Props:** None (self-contained)

**Styling Patterns:**
```tsx
// Sticky with blur backdrop
className="sticky top-0 z-50 
           bg-[var(--overlay)]/95 
           backdrop-blur-xl"

// Animated gradient background
<div className="absolute inset-0 
                bg-gradient-to-r from-primary/10 
                via-primary/5 to-transparent 
                pointer-events-none animate-gradient" />
```

**Key Interactions:**
- Search focus triggers width animation
- Active nav item shows animated underline
- Logo hover triggers scale + rotation effects

---

### Left Sidebar Component

**File:** `components/left-sidebar.tsx`

**Purpose:** Display user welcome, team info, and AI-generated highlights.

**Sections:**

1. **Welcome Card**
   - Gradient background (chart colors)
   - User avatar with ring
   - Personalized greeting ("Good morning, Michael")

2. **My Team Card**
   - Organization name ("Hope Foundation")
   - Overlapping avatar stack (4 shown + counter)
   - Activity badges on avatars (comment, post, event icons)
   - Hover tooltips with recent activity
   - "See all team members" link

3. **Community Highlights Carousel**
   - 3 rotating cards (30s interval)
   - AI-generated insights
   - Metrics: Collaboration, Projects, Events
   - Icon + color coding (orange, blue, purple)

**Props:** None

**State:**
```tsx
const [hoveredMember, setHoveredMember] = useState<number | null>(null)
const [currentIndex, setCurrentIndex] = useState(0)
```

**Responsive:** Hidden below `lg` breakpoint

---

### Main Feed Component

**File:** `components/main-feed.tsx`

**Purpose:** Central content area with post creation, filters, and feed items.

**Sections:**

1. **Alert Banner** (conditional)
   - Red/amber prominent banner
   - Dismiss functionality
   - Shows urgent org-wide messages

2. **Create Post Card**
   - Welcome header + "This Week" button
   - Avatar + expandable textarea
   - @mention autocomplete dropdown
   - Category selector (animated chips)
   - Attachment buttons (Photo, Poll, Emoji)
   - Tag selector for Events/Projects
   - Linked items display (removable chips)
   - Create dropdown (Event/Project/Alert)
   - Post button (disabled if empty)

3. **Filter Bar**
   - Type filters: All, Events, Projects, Posts
   - Sort options: Latest, Shared by, Shared with
   - Active state highlighting

4. **Feed Items**
   - Renders EventCard, ProjectCard, or PostCard
   - Staggered animation on load
   - AI Summary Card injected after 2nd item

**Props:** None

**State:**
```tsx
const [activeFilter, setActiveFilter] = useState<FilterType>("All")
const [postContent, setPostContent] = useState("")
const [postCategory, setPostCategory] = useState<PostCategory>("general")
const [linkedItems, setLinkedItems] = useState([])
const [showEventDialog, setShowEventDialog] = useState(false)
const [showProjectDialog, setShowProjectDialog] = useState(false)
```

**Key Features:**

- **@Mention System:**
  - Detect `@` in textarea
  - Filter events/projects/orgs
  - Insert selection into text
  - Add to linked items

- **Shortcut Commands:**
  - `/event` → Open event modal
  - `/project` → Open project modal

- **Category Selector:**
  - Animated chip expansion
  - Hover/focus triggers
  - Click outside to close

---

### Right Sidebar Component

**File:** `components/right-sidebar.tsx`

**Purpose:** Display priority alerts and upcoming events carousel.

**Sections:**

1. **Priority Alert** (dismissible)
   - Red header with "Priority" badge
   - Author avatar + role
   - Alert title + message
   - "Acknowledge" CTA
   - On dismiss: Animates out, events carousel appears

2. **Animated Events Carousel**
   - 5 upcoming events
   - Auto-scroll (8s interval)
   - Image + gradient overlay
   - "Tomorrow", "This Week" badges
   - Event details (date, time, location)
   - Attendee count + avatars
   - "Attend" button
   - Manual navigation (← →)

**Props:** None

**State:**
```tsx
const [alertDismissed, setAlertDismissed] = useState(false)
const [activeIndex, setActiveIndex] = useState(0)
```

**Responsive:** Hidden below `lg` breakpoint

---

### Event Card Component

**File:** `components/event-card.tsx`

**Purpose:** Display event details with RSVP and support options.

**Props:**
```tsx
interface EventCardProps {
  event: EventPost
}
```

**Structure:**
```
┌─────────────────────────────────────┐
│ [Avatar(s)] Author Name             │ [⋮ Menu]
│ Org 1 and Org 2                     │
│ Role at Org · posted 3 hours ago    │
├─────────────────────────────────────┤
│ [🎯 Food Security]                  │
├─────────────────────────────────────┤
│ Community Food Drive & Distribution │ ← Title (text-xl font-bold)
│ We're organizing a major food drive │
│ to support families in need...      │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 📅 Dec 15, 2024                 │ │ Details box
│ │ 🕐 9:00 AM - 3:00 PM            │ │ (bg-muted/50)
│ │ 📍 Community Center, Downtown   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Part of: View Parent Project →]   │ ← Optional link
├─────────────────────────────────────┤
│ Looking for:                        │
│ [♥ Volunteers: 25] [👥 Participants]│
│ [🏢 Partner Collaboration]          │
├─────────────────────────────────────┤
│ 3 charities interested • 12 referred│ ← Interest counter
├─────────────────────────────────────┤
│ [♡ 0] [💬 0]    [✓ Attend (3)] [View]│
│                      ↑               │
│          ┌──────────────────────┐   │
│          │ You're in!           │   │ Support popover
│          │ Pick ways to help:   │   │ (animated)
│          │ ☐ Volunteer help     │   │
│          │ ☐ Bring participants │   │
│          │ ☐ Interested collab  │   │
│          │ [Add to calendar]    │   │
│          └──────────────────────┘   │
└─────────────────────────────────────┘
```

**Key Features:**

1. **Collaboration Display**
   - Overlapping avatars (author + partners)
   - Smart text formatting:
     - 1 org: "Hope Foundation"
     - 2 orgs: "Hope Foundation and City Food Bank"
     - 3+ orgs: "Hope Foundation, City Food Bank · +2 others"

2. **Attend Button + Popover**
   - Click → State changes to "Attending"
   - Support panel appears below/above (position calculated)
   - Checkboxes for ways to help:
     - Volunteer (if volunteersNeeded > 0)
     - Bring participants (with quantity input)
     - Partner collaboration
   - "Add to calendar" CTA (or "Confirm & add")
   - Click outside to close

3. **Needs Display**
   - Max 3 chips shown
   - Color-coded: amber (volunteers), blue (participants), purple (partners)
   - Icons for quick scanning

**State:**
```tsx
const [attending, setAttending] = useState(false)
const [supportPanelOpen, setSupportPanelOpen] = useState(false)
const [supportChoices, setSupportChoices] = useState({
  volunteer: false,
  bringParticipants: false,
  participantCount: "",
  canPartner: false
})
```

---

### Project Card Component

**File:** `components/project-card.tsx`

**Purpose:** Display project details with interest tracking and support options.

**Props:**
```tsx
interface ProjectCardProps {
  project: ProjectPost
}
```

**Structure:** Similar to EventCard, with these differences:

1. **Impact Goal Box** (highlighted)
```
┌───────────────────────────────────┐
│ IMPACT GOAL                       │
│ Plant 5,000 trees across 10       │
│ neighborhoods by spring to create │
│ healthier communities             │
└───────────────────────────────────┘
```

2. **Progress Bar** (if tracking enabled)
```
Progress                         67%
[██████████████████▒▒▒▒▒▒▒▒▒▒]
3,350 / 5,000 trees · Updated 2 days ago
```

3. **Details Grid**
```
┌─────────────┐  ┌─────────────┐
│ 📅 Target   │  │ 📅 Events   │
│ March 2025  │  │ 3 upcoming  │
└─────────────┘  └─────────────┘
```

4. **Additional Needs**
   - Resources requested (indigo chip)
   - Funding goal (amber chip)

5. **Partner Organizations**
   - Circular avatars with org initials
   - "Collaborating with [orgs]" text

6. **Interest Button** (instead of Attend)
   - "I'm interested" → "Interested ✓"
   - Green color scheme (emerald)
   - Support popover with similar options

**Support Options:**
- Volunteer help
- Bring participants
- Interested in collaborating
- Provide resources
- Contribute funding

---

### Post Card Component

**File:** `components/post-card.tsx`

**Purpose:** Display general updates and announcements.

**Props:**
```tsx
interface PostCardProps {
  post: Post
}
```

**Structure:**
```
┌─────────────────────────────────────┐
│ [Avatar] David Park                 │ [⋮ Menu]
│ Program Manager at Community Network│
│ 2 hours ago                         │
├─────────────────────────────────────┤
│ [🎉 #wins] [🎯 Food Security]       │ ← Category + Cause
├─────────────────────────────────────┤
│ Incredible turnout at today's food  │ ← Title (optional)
│ drive! We served over 300 families  │
│ and collected 2 tons of donations.  │
│ Thank you to everyone who helped!   │
├─────────────────────────────────────┤
│ [🔗 About: Community Food Drive]    │ ← Linked content
├─────────────────────────────────────┤
│ [♡ 24] [💬 8]         [View Event →]│
└─────────────────────────────────────┘
```

**Key Features:**

1. **Category Badges** (6 types)
   - 🌟 General (gray)
   - 👋 Intros (purple)
   - 🎉 Wins (emerald)
   - 💼 Opportunities (blue)
   - ❓ Questions (amber)
   - 💡 Learnings (indigo)

2. **Optional Title**
   - Some posts have titles (like "intros")
   - Others are just content (like "wins")

3. **Linked Content Indicator**
   - Shows if post is about an event or project
   - Light background box with icon
   - "About: [Event/Project Name]"

4. **Conditional CTA**
   - No link → No CTA (just engagement)
   - linkedEventId → "View Event" button
   - linkedProjectId → "View Project" button

**Simpler than Event/Project cards:**
- No needs section
- No collaboration display
- No support popover
- Focus on quick updates

---

### Create Event Dialog

**File:** `components/create-event-dialog.tsx`

**Purpose:** Modal form for creating new events.

**Props:**
```tsx
interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Form Fields:**

**Required:**
- Title (text input)
- Description (textarea, min 100px height)
- Date (date picker)
- Time (time picker)
- Location (text input)

**Optional (Collapsible "Advanced Options"):**
- Cause tag (input)
- Volunteers needed (number)
- Participant programs (text, comma-separated)
- Seeking partners (checkbox)

**UX Patterns:**
- Modal max-width: 2xl (672px)
- Max-height: 90vh (scrollable)
- Required fields in highlighted box
- Collapsible section starts closed
- Submit disabled until required fields filled

---

### Create Project Dialog

**File:** `components/create-project-dialog.tsx`

**Purpose:** Modal form for creating new projects.

**Props:** Same as CreateEventDialog

**Form Fields:**

**Required:**
- Title
- Description
- Impact Goal (min 20 characters, emphasized)

**Optional:**
- Cause tag
- Target date
- Service area
- Volunteers needed
- Participant requests
- Resources requested
- Fundraising goal
- Seeking partners

**Unique to Projects:**
- Impact Goal is required and validated (20 char min)
- Target date is optional (ongoing projects)
- More diverse needs options

---

### Send Alert Dialog

**File:** `components/send-alert-dialog.tsx`

**Purpose:** Manager-only form for sending urgent alerts.

**Props:**
```tsx
interface SendAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (alertData: AlertData) => void
}
```

**Form Fields:**
- Priority (High/Medium radio)
- Title (text input)
- Message (textarea)
- Audience (dropdown: All team, Department, Specific people)

**Permissions:**
- Only visible to managers/admins
- Check via `isManager` flag (TODO: real auth)

---

### Category Selector

**File:** `components/ui/category-selector.tsx`

**Purpose:** Animated chip selector for post categories.

**Props:**
```tsx
interface CategorySelectorProps {
  selected: PostCategory
  onChange: (category: PostCategory) => void
  className?: string
}
```

**Behavior:**
- Shows selected chip by default
- On hover/focus: Expands to show all 6 categories
- Staggered animation (0.03s delay per chip)
- Selected chip has gradient background
- Others are white/gray with hover effect

**Animation:**
```tsx
animate={{ 
  x: expanded ? 0 : -40 * index,
  opacity: expanded || isFirst ? 1 : 0,
}}
transition={{
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
  delay: expanded ? 0.03 * index : 0,
}}
```

---

### Animated Events Carousel

**File:** `components/animated-events.tsx`

**Purpose:** Auto-scrolling events preview for right sidebar.

**Props:**
```tsx
interface AnimatedEventsProps {
  className?: string
}
```

**Features:**
- 5 hardcoded events (TODO: fetch from API)
- Auto-scroll every 8 seconds
- Manual navigation with ← → buttons
- Fade + scale transition between events
- Image with gradient overlay
- Badge ("Tomorrow", "This Week", etc.)
- Event details (date, time, location, description)
- Attendee count + avatar stack
- "Attend" button

**State:**
```tsx
const [activeIndex, setActiveIndex] = useState(0)
```

**Auto-scroll:**
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    setActiveIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1))
  }, 8000)
  return () => clearInterval(interval)
}, [])
```

---

## 7. Content Type System {#content-types}

### Three Core Types

```
POST
 ↓
 ├─ Can link to → EVENT
 └─ Can link to → PROJECT
                    ↓
                    └─ Can have child → EVENTs
```

### Type 1: Post

**Purpose:** General updates, announcements, questions, intros.

**Required Fields:**
- `author` (who posted)
- `content` (text, required)

**Optional Fields:**
- `title` (some categories use it)
- `category` (general, intros, wins, opportunities, questions, learnings)
- `linkedEventId` (reference to event)
- `linkedProjectId` (reference to project)
- `cause` (for learnings)
- `image` (attachment)
- `likes`, `comments` (engagement)

**Use Cases:**
- "Just joined the network! Looking forward to collaborating."
- "Incredible turnout at today's food drive! 🎉"
- "Looking for volunteers with event planning experience."
- "Has anyone applied for EPA grants before?"
- "After 3 years, here's what we learned about mobile food pantries..."

**Visual Identity:**
- Minimal design (no heavy metadata)
- Category badge (colored chip)
- Optional linked content indicator
- Conditional CTA based on links

---

### Type 2: Event

**Purpose:** Time/place-specific activities with RSVPs.

**Required Fields:**
- `title`
- `description`
- `date` (specific date)
- `time` (start and end)
- `location` (where it's happening)

**Optional Fields:**
- `cause` (cause category)
- `parentProjectId` (if event is part of project)
- `needs` (volunteers, participants, partners)
- `collaborations` (partner organizations)
- `partnerOrgs` (list of org names)
- `interestedOrgs` (who's tracking this)
- `participantsReferred` (engagement metric)

**Use Cases:**
- Community food drive
- Coding workshop
- Charity run
- Health screening day
- Volunteer training session

**Visual Identity:**
- Blue color scheme
- Calendar icon
- Date/time/location box
- "Attend" CTA (blue button)
- Support popover for specifying help

**Relationships:**
- Can be standalone
- Can be part of a Project (shows "Part of:" link)
- Can be referenced by Posts

---

### Type 3: Project

**Purpose:** Long-term collaboration initiatives with goals and progress.

**Required Fields:**
- `title`
- `description`
- `impactGoal` (clear, specific goal statement)

**Optional Fields:**
- `targetDate` (can be ongoing if not set)
- `cause` (cause category)
- `serviceArea` (geographic focus)
- `needs` (volunteers, participants, partners, resources, funding)
- `progress` (current/target/unit for tracking)
- `collaborations` (partner organizations)
- `partnerOrgs` (list of org names)
- `eventsCount` (number of linked events)
- `interestedOrgs` (who's tracking this)
- `participantsReferred` (engagement metric)

**Use Cases:**
- Urban tree planting initiative (5,000 trees goal)
- Mobile health clinic outreach
- Youth mentorship program
- Community garden development
- Food security network

**Visual Identity:**
- Emerald/green color scheme
- Target icon
- Impact Goal highlighted box
- Progress bar (if tracking)
- "I'm interested" CTA (emerald button)
- Support popover for specifying help

**Relationships:**
- Can have child Events (shows "Events: 3 upcoming")
- Can be referenced by Posts
- Standalone long-term initiatives

---

### Content Relationships

**Post → Event:**
```tsx
// Post about an event
{
  type: "post",
  content: "Great turnout at today's food drive! 🎉",
  linkedEventId: "event-1",
  // Shows "About: Community Food Drive" link
  // CTA: "View Event"
}
```

**Post → Project:**
```tsx
// Post about project progress
{
  type: "post",
  content: "We just hit 3,000 trees planted! 🌳",
  linkedProjectId: "project-1",
  // Shows "About: Urban Tree Initiative" link
  // CTA: "View Project"
}
```

**Event → Project:**
```tsx
// Event is part of a project
{
  type: "event",
  title: "Tree Planting Day",
  parentProjectId: "project-1",
  // Shows "Part of: View Parent Project" link
}
```

---

### Category System (Posts Only)

**6 Categories:**

1. **General** (default)
   - Icon: ✨ Sparkles
   - Color: Gray
   - Use: Uncategorized updates

2. **Intros**
   - Icon: 👋 Hand wave
   - Color: Purple
   - Use: New member introductions
   - Often includes title

3. **Wins**
   - Icon: 🎉 Party popper
   - Color: Emerald
   - Use: Celebrate successes, milestones

4. **Opportunities**
   - Icon: 💼 Briefcase
   - Color: Blue
   - Use: Volunteer needs, partnership asks

5. **Questions**
   - Icon: ❓ Question mark
   - Color: Amber
   - Use: Ask community for advice

6. **Learnings**
   - Icon: 💡 Light bulb
   - Color: Indigo
   - Use: Share insights, lessons learned
   - Can include cause tag

**Visual Design:**
```tsx
// Category badge example (Wins)
<div className="
  bg-gradient-to-r from-emerald-500/10 to-teal-500/10
  border border-emerald-500/30
  text-emerald-700
  rounded-full px-2.5 py-1
  text-xs font-medium
">
  🎉 #wins
</div>
```

---

### Cause System (All Types)

**Universal Tags:**
- Food Security
- Environment
- Education
- Health & Wellness
- Housing
- Youth Development
- Senior Services
- Mental Health
- Community Development
- Arts & Culture

**Visual Design:**
```tsx
// Cause badge (always rose/pink)
<div className="
  bg-gradient-to-r from-rose-500/10 to-pink-500/10
  border border-rose-500/30
  text-rose-700
  rounded-full px-2.5 py-1
  text-xs font-medium
">
  ❤️ Food Security
</div>
```

---

### Needs System (Events & Projects)

**Volunteer Need:**
```tsx
{
  volunteersNeeded: 25
}
// Display: "❤️ Volunteers: 25" (amber chip)
```

**Participant Need:**
```tsx
{
  participantRequests: [
    { programTag: "After-School Program", count: 20 },
    { programTag: "Senior Center" } // no specific count
  ]
}
// Display: "👥 Participants: After-School (20), Senior Center"
```

**Resource Need (Projects only):**
```tsx
{
  resourcesRequested: ["Food donations", "Kitchen equipment"]
}
// Display: "📦 Resources: Food donations, Kitchen equipment"
```

**Funding Need (Projects only):**
```tsx
{
  fundraisingGoal: "$50K"
}
// Display: "💵 Funding: $50K goal"
```

**Partnership Need:**
```tsx
{
  seekingPartners: true
}
// Display: "🏢 Partner Collaboration"
```

**Max 3 Chips Rule:**
- Priority order: Participants → Volunteers → Resources → Funding → Partners
- Prevents visual clutter
- Most important needs shown first

---

## 8. User Interaction Flows {#interaction-flows}

### Flow 1: Create a Post

```
1. User clicks into textarea in Create Post Card
   ↓
2. Textarea expands, reveals:
   - Category selector (animated chips)
   - Attachment buttons (Photo, Attachment, Poll, Emoji)
   - Tag selector button (Event/Project/Organization)
   ↓
3. User types content
   - Can use @mention: type @ → dropdown appears
   - Select item → inserts into text + adds to linked items
   ↓
4. User selects category (optional)
   - Click chip → changes color to selected state
   ↓
5. User tags Event/Project (optional)
   - Click Tag button → dropdown opens
   - Shows recent events, projects, orgs
   - Click item → adds chip below textarea
   - Can remove by clicking X on chip
   ↓
6. User clicks "Post" button
   ↓
7. System logs: { content, category, linkedItems }
   - TODO: API call to create post
   - TODO: Toast notification "Post created!"
   ↓
8. Textarea resets, collapses back to default
```

**Shortcut Commands:**
- Type `/event` → Opens Create Event modal
- Type `/project` → Opens Create Project modal

---

### Flow 2: Create an Event

```
1. User clicks "Create" dropdown → "Create Event"
   ↓
2. CreateEventDialog modal opens
   ↓
3. User fills required fields:
   - Title: "Community Food Drive"
   - Description: "Supporting families..."
   - Date: 2024-12-15
   - Time: 09:00 - 15:00
   - Location: "Community Center, Downtown"
   ↓
4. User expands "Advanced Options" (optional)
   - Cause: "Food Security"
   - Volunteers needed: 25
   - Seeking partners: ✓
   ↓
5. User clicks "Create Event"
   ↓
6. System validates → logs event data
   - TODO: API call to create event
   - TODO: Add to feed
   - TODO: Toast notification "Event created!"
   ↓
7. Modal closes
```

---

### Flow 3: RSVP to Event (with support options)

```
1. User sees Event Card in feed
   ↓
2. User clicks "Attend" button
   ↓
3. Button changes to "Attending ✓" (blue, filled)
   ↓
4. Support popover appears below button
   ↓
5. User sees:
   "You're in! Pick ways to pitch in (optional)"
   - Cancel button (top right)
   ↓
6. IF event has needs:
   ☐ Volunteer help (Need 25 volunteers)
   ☐ Bring participants (After-School: 20, Seniors)
      → If checked: shows "How many?" input
   ☐ Interested in collaborating
   ↓
7. User selects options (optional)
   ↓
8. User clicks "Add to calendar" (or "Confirm & add to calendar")
   ↓
9. System logs:
   {
     attending: true,
     volunteer: true,
     bringParticipants: false,
     canPartner: true
   }
   - TODO: API call to update RSVP
   - TODO: Send calendar invite
   - TODO: Toast notification "Added to calendar!"
   ↓
10. Popover closes
    Button remains "Attending ✓"
```

**Alternative: No needs**
```
4. Support popover shows:
   "RSVP saved—no extra help needed yet."
   [Add to calendar] button
```

---

### Flow 4: Show Interest in Project

```
1. User sees Project Card in feed
   ↓
2. User clicks "I'm interested" button
   ↓
3. Button changes to "Interested ✓" (emerald, filled)
   ↓
4. Support popover appears
   "Following! Pick ways to help (optional)"
   ↓
5. User sees options:
   ☐ Volunteer help
   ☐ Bring participants
   ☐ Interested in collaborating
   ☐ Provide resources (Food donations, Kitchen equipment)
   ☐ Contribute funding (Goal: $50K)
   ↓
6. User selects options (optional)
   ↓
7. User clicks "Done for now"
   ↓
8. System logs support choices
   - TODO: API call to track interest
   - TODO: Add to user's "Following" list
   - TODO: Send updates when project updates
   ↓
9. Popover closes
   Button remains "Interested ✓"
```

---

### Flow 5: Filter Feed Content

```
1. User sees feed with all content types
   ↓
2. User clicks "Events" filter button
   ↓
3. Button highlights (blue background)
   ↓
4. Feed re-renders showing only EventCards
   ↓
5. User clicks "All" to see everything again
```

**Filter Logic:**
```tsx
const filteredItems = feedItems.filter(item => {
  if (activeFilter === "All") return true
  if (activeFilter === "Events") return item.type === "event"
  if (activeFilter === "Projects") return item.type === "project"
  if (activeFilter === "Posts") return item.type === "post"
  return true
})
```

---

### Flow 6: Send Alert (Manager Only)

```
1. Manager clicks "Create" dropdown
   ↓
2. Sees "Send Alert" option (red text)
   ↓
3. Clicks → SendAlertDialog opens
   ↓
4. Fills form:
   - Priority: High/Medium radio
   - Title: "Electricity outage expected!"
   - Message: "Scheduled outage on Monday..."
   - Audience: "Blink Team"
   ↓
5. Clicks "Send Alert"
   ↓
6. System creates alert object:
   {
     priority: "high",
     title: "...",
     message: "...",
     audience: "...",
     author: { name, role, avatar },
     timeAgo: "just now"
   }
   ↓
7. Alert appears at top of feed (AlertBanner)
   ↓
8. Also appears in right sidebar (Priority Alert card)
   ↓
9. Recipients can dismiss/acknowledge
```

---

### Flow 7: Dismiss Alert

```
1. User sees AlertBanner at top of feed
   OR Priority Alert in right sidebar
   ↓
2. User clicks "Acknowledge" or "Dismiss"
   ↓
3. Alert animates out (fade + scale)
   ↓
4. System logs dismissal
   - TODO: API call to mark as read
   ↓
5. Alert removed from state
   ↓
6. In right sidebar: Events carousel animates in
```

---

### Flow 8: Use @Mention in Post

```
1. User types in Create Post textarea
   ↓
2. User types "@"
   ↓
3. Mention dropdown appears showing:
   - Recent Events (with 📅 icon)
   - Recent Projects (with 🎯 icon)
   - Organizations (with ✨ icon)
   ↓
4. User types more letters (e.g., "@food")
   ↓
5. Dropdown filters to matching items:
   - "Community Food Drive" (Event)
   - "Food Security Network" (Project)
   ↓
6. User clicks "Community Food Drive"
   ↓
7. "@Community Food Drive" inserted into text
   - Rendered in blue color (highlighted overlay)
   ↓
8. Item added to linkedItems array
   - Blue chip appears below textarea
   - Can remove by clicking X
```

---

## 9. Data Structures {#data-structures}

### TypeScript Interfaces

**File:** `lib/types.ts`

```typescript
export type Author = {
  name: string        // "Marcus Rodriguez"
  handle: string      // "@marcus.rodriguez"
  avatar: string      // "/professional-woman.png"
  role?: string       // "Community Outreach Coordinator"
  organization?: string  // "Hope Foundation"
}

export type Collaboration = {
  organization: string   // "City Food Bank"
  avatar: string         // "/placeholder.svg"
}

export type ParticipantRequest = {
  programTag: string     // "After-School Program"
  count?: number         // 20 (optional)
}

export type Needs = {
  volunteersNeeded?: number                // 25
  participantRequests?: ParticipantRequest[]
  seekingPartners?: boolean                // true
  resourcesRequested?: string[]            // ["Food", "Kitchen equipment"]
  fundraisingGoal?: string                 // "$50K"
}

export type Progress = {
  current: number        // 3350
  target: number         // 5000
  unit: string           // "trees", "USD", "volunteers"
  lastUpdated?: string   // "2 days ago"
}

export type EventPost = {
  id: string
  type: "event"
  author: Author
  collaborations?: Collaboration[]
  title: string
  description: string
  date: string           // "Dec 15, 2024"
  time: string           // "9:00 AM - 3:00 PM"
  location: string       // "Community Center, Downtown"
  cause?: string         // "Food Security"
  parentProjectId?: string
  partnerOrgs?: string[]
  needs?: Needs
  status?: "Open" | "Closed"
  timeAgo: string        // "3 hours ago"
  interestedOrgs?: string[]
  participantsReferred?: number
}

export type ProjectPost = {
  id: string
  type: "project"
  author: Author
  collaborations?: Collaboration[]
  title: string
  description: string
  impactGoal: string     // REQUIRED
  cause?: string
  targetDate?: string    // Optional - no date = ongoing
  serviceArea?: string
  partnerOrgs?: string[]
  needs?: Needs
  progress?: Progress
  eventsCount?: number
  timeAgo: string
  interestedOrgs?: string[]
  participantsReferred?: number
}

export type PostCategory = 
  | "intros" 
  | "wins" 
  | "opportunities" 
  | "questions" 
  | "learnings" 
  | "general"

export type Post = {
  id: string
  type: "post"
  author: Author
  title?: string
  content: string        // REQUIRED
  category?: PostCategory
  linkedEventId?: string
  linkedProjectId?: string
  cause?: string         // Only for "learnings"
  image?: string
  timeAgo: string
  likes?: number
  comments?: number
}

export type FeedItem = EventPost | ProjectPost | Post

export type ContentType = "event" | "project" | "post"
export type FilterType = "All" | "Events" | "Projects" | "Posts"
```

---

### Sample Data Examples

**Event Example:**
```typescript
const eventExample: EventPost = {
  id: "event-1",
  type: "event",
  author: {
    name: "Marcus Rodriguez",
    handle: "@marcus.rodriguez",
    avatar: "/professional-woman.png",
    role: "Community Outreach Coordinator",
    organization: "Hope Foundation",
  },
  collaborations: [
    { organization: "City Food Bank", avatar: "/placeholder.svg" },
    { organization: "Westside Community Kitchen", avatar: "/placeholder.svg" },
  ],
  title: "Community Food Drive & Distribution",
  description: "We're organizing a major food drive to support families in need this holiday season. Join us in making a difference!",
  date: "Dec 15, 2024",
  time: "9:00 AM - 3:00 PM",
  location: "Community Center, Downtown",
  cause: "Food Security",
  needs: {
    volunteersNeeded: 25,
    participantRequests: [
      { programTag: "Senior Center", count: 30 }
    ],
    seekingPartners: true
  },
  partnerOrgs: ["City Food Bank", "Community Kitchen", "Neighborhood Alliance"],
  interestedOrgs: ["Org1", "Org2", "Org3"],
  participantsReferred: 12,
  timeAgo: "3 hours ago",
}
```

**Project Example:**
```typescript
const projectExample: ProjectPost = {
  id: "project-1",
  type: "project",
  author: {
    name: "Sarah Chen",
    handle: "@sarah.chen",
    avatar: "/professional-woman.png",
    role: "Environmental Programs Director",
    organization: "Green Earth Alliance",
  },
  collaborations: [
    { organization: "Urban Roots Collective", avatar: "/placeholder.svg" },
    { organization: "City Parks Coalition", avatar: "/placeholder.svg" },
  ],
  title: "Urban Tree Planting Initiative",
  description: "Collaborative effort to increase urban tree coverage and combat climate change across 10 neighborhoods.",
  impactGoal: "Plant 5,000 trees across 10 neighborhoods by spring to create healthier communities",
  cause: "Environment",
  targetDate: "March 20, 2025",
  progress: {
    current: 3350,
    target: 5000,
    unit: "trees",
    lastUpdated: "2 days ago"
  },
  needs: {
    volunteersNeeded: 100,
    participantRequests: [
      { programTag: "Youth Program", count: 50 }
    ],
    resourcesRequested: ["Shovels", "Saplings", "Watering equipment"],
    fundraisingGoal: "$50K",
    seekingPartners: true
  },
  partnerOrgs: ["City Parks Coalition", "Community Gardeners", "Tree Foundation"],
  interestedOrgs: ["Org1", "Org2", "Org3", "Org4", "Org5"],
  eventsCount: 3,
  participantsReferred: 45,
  timeAgo: "6 hours ago",
}
```

**Post Example (Wins):**
```typescript
const postExample: Post = {
  id: "post-1",
  type: "post",
  author: {
    name: "David Park",
    handle: "@david.park",
    avatar: "/professional-woman.png",
    role: "Program Manager",
    organization: "Community Outreach Network",
  },
  category: "wins",
  content: "Incredible turnout at today's food drive! We served over 300 families and collected 2 tons of food donations. Thank you to everyone who volunteered and contributed! 🎉",
  linkedEventId: "event-1",
  timeAgo: "2 hours ago",
  likes: 24,
  comments: 8,
}
```

**Post Example (Intros):**
```typescript
const introExample: Post = {
  id: "post-2",
  type: "post",
  author: {
    name: "Emily Johnson",
    handle: "@emily.j",
    avatar: "/professional-woman.png",
    organization: "Youth Development Alliance",
  },
  category: "intros",
  title: "Hello from Youth Development Alliance!",
  content: "Hi everyone! I'm Emily, joining this community to connect with other organizations working on youth programs. We focus on after-school mentorship and skills training. Looking forward to collaborating!",
  timeAgo: "5 hours ago",
  likes: 15,
  comments: 6,
}
```

---

### Validation Rules

**Event Validation:**
```typescript
const eventSchema = {
  title: { required: true, minLength: 3 },
  description: { required: true, minLength: 10 },
  date: { required: true, type: "date" },
  time: { required: true },
  location: { required: true, minLength: 3 },
  cause: { optional: true },
  volunteersNeeded: { optional: true, min: 1, type: "number" },
}
```

**Project Validation:**
```typescript
const projectSchema = {
  title: { required: true, minLength: 3 },
  description: { required: true, minLength: 10 },
  impactGoal: { required: true, minLength: 20 }, // ← Key difference
  targetDate: { optional: true, type: "date" },
  fundraisingGoal: { optional: true, pattern: /^\$[\d,]+K?$/ },
}
```

**Post Validation:**
```typescript
const postSchema = {
  content: { required: true, minLength: 1, maxLength: 5000 },
  category: { optional: true, enum: ["intros", "wins", ...] },
  title: { optional: true, maxLength: 200 },
}
```

---

## 10. Design Patterns & Best Practices {#best-practices}

### Progressive Disclosure

**Principle:** Don't overwhelm users. Show essential info first, reveal details on demand.

**Implementation Examples:**

1. **Create Post Card**
```tsx
// Default state: Simple textarea
<textarea placeholder="Share an update..." />

// Focused state: Reveals options
{postFocused && (
  <CategorySelector />
  <AttachmentButtons />
  <TagSelector />
)}
```

2. **Event/Project Dialogs**
```tsx
// Required fields visible
<div className="space-y-4">
  <Input label="Title *" />
  <Textarea label="Description *" />
</div>

// Advanced options hidden in collapsible
<Collapsible>
  <CollapsibleTrigger>
    Advanced Options <ChevronDown />
  </CollapsibleTrigger>
  <CollapsibleContent>
    <Input label="Cause tag" />
    <Input label="Volunteers needed" />
  </CollapsibleContent>
</Collapsible>
```

3. **Support Popovers**
```tsx
// No needs: Simple confirmation
"RSVP saved—no extra help needed yet."

// Has needs: Show options
<Checkbox>Volunteer help</Checkbox>
<Checkbox>Bring participants</Checkbox>
```

---

### Smart Defaults

**Principle:** Minimize required input. Make optional fields truly optional.

**Examples:**

- Post category defaults to "general" (users can skip)
- Project target date is optional (for ongoing initiatives)
- Advanced options start collapsed
- Participant count input only appears when checkbox is checked
- @mentions are optional (users can just type text)

**Benefits:**
- Lower barrier to entry
- Faster content creation
- Less form fatigue
- Still allows power users to add detail

---

### Visual Hierarchy

**Levels of Emphasis:**

1. **Primary (Loudest):**
   - Card titles (text-xl, font-bold)
   - CTA buttons (filled, colored)
   - Alert banners (full-width, bright colors)

2. **Secondary:**
   - Author names (font-semibold)
   - Badges (colored backgrounds)
   - Metrics (bold numbers)

3. **Tertiary:**
   - Descriptions (text-sm, muted)
   - Metadata (text-xs, muted)
   - Helper text (text-xs, muted)

**Scanning Pattern:**
- Users scan F-pattern (top-left → top-right → down)
- Place most important info in top-left quadrant
- Use visual weight (size, color, position) to guide eyes

**Example (Event Card):**
```
1. Author (who) ← Top-left, semibold
2. Title (what) ← Large, bold
3. Description ← Regular weight
4. Date/Location ← Muted, smaller
5. CTA ← Bottom-right, prominent button
```

---

### Performance Considerations

**Optimization Techniques:**

1. **Conditional Rendering**
```tsx
// Only render sidebars on large screens
<div className="hidden lg:block">
  <LeftSidebar />
</div>
```

2. **Lazy Component Loading** (future)
```tsx
const CreateEventDialog = lazy(() => import('./create-event-dialog'))
```

3. **Memoization**
```tsx
const event = useMemo(() => events[activeIndex], [activeIndex])
```

4. **Debounced Search** (for @mentions)
```tsx
// Wait 300ms after user stops typing
const debouncedSearch = useMemo(
  () => debounce((query) => fetchResults(query), 300),
  []
)
```

5. **AnimatePresence Optimization**
```tsx
// Use mode="wait" for one-at-a-time animations
<AnimatePresence mode="wait">
  <motion.div key={index} />
</AnimatePresence>
```

6. **Avoid Re-renders**
```tsx
// Use useCallback for event handlers passed to children
const handleSubmit = useCallback(() => {
  // logic
}, [dependencies])
```

---

### Accessibility Best Practices

**Keyboard Navigation:**
- All interactive elements focusable
- Logical tab order (top → bottom, left → right)
- Escape closes modals/dropdowns
- Enter/Space activates buttons

**Focus Management:**
```tsx
// Trap focus in modals
<Dialog onOpenChange={(open) => {
  if (open) inputRef.current?.focus()
}}>
```

**ARIA Labels:**
```tsx
<Button aria-label="Open notification menu">
  <Bell />
</Button>

<input 
  aria-describedby="email-helper"
  aria-invalid={hasError}
/>
```

**Color Contrast:**
- Text on background: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum
- Interactive elements: Clear focus indicators

**Screen Reader Support:**
- Semantic HTML (`<button>`, `<nav>`, `<main>`)
- Live regions for dynamic content
```tsx
<div role="status" aria-live="polite">
  {toastMessage}
</div>
```

---

### Code Organization

**Component Structure:**
```tsx
// 1. Imports
import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

// 2. Types/Interfaces
interface EventCardProps {
  event: EventPost
}

// 3. Component
export function EventCard({ event }: EventCardProps) {
  // 4. State
  const [attending, setAttending] = useState(false)
  
  // 5. Derived values
  const collaborations = event.collaborations ?? []
  
  // 6. Effects
  useEffect(() => {
    // side effects
  }, [dependencies])
  
  // 7. Event handlers
  const handleAttend = () => {
    setAttending(true)
  }
  
  // 8. Render
  return (
    <Card>
      {/* JSX */}
    </Card>
  )
}
```

**File Naming:**
- Components: `kebab-case.tsx`
- Types: `types.ts`
- Utils: `utils.ts`
- Pages: `page.tsx` (Next.js App Router)

**Import Organization:**
```tsx
// 1. External libraries
import { useState } from "react"
import { motion } from "framer-motion"

// 2. Internal components
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// 3. Utils and types
import { cn } from "@/lib/utils"
import type { EventPost } from "@/lib/types"

// 4. Icons (last)
import { Calendar, Clock } from "lucide-react"
```

---

### Error Handling

**Form Validation:**
```tsx
const [errors, setErrors] = useState<Record<string, string>>({})

const validate = () => {
  const newErrors: Record<string, string> = {}
  
  if (!formData.title) {
    newErrors.title = "Title is required"
  }
  
  if (formData.impactGoal && formData.impactGoal.length < 20) {
    newErrors.impactGoal = "Must be at least 20 characters"
  }
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

const handleSubmit = () => {
  if (!validate()) return
  // proceed
}
```

**API Error Handling** (future):
```tsx
try {
  await createEvent(formData)
  toast.success("Event created!")
} catch (error) {
  if (error.status === 401) {
    toast.error("Please log in to create events")
  } else {
    toast.error("Failed to create event. Please try again.")
  }
}
```

**Graceful Degradation:**
```tsx
// If images fail to load, show fallback
<Avatar>
  <AvatarImage src={user.avatar} />
  <AvatarFallback>{user.initials}</AvatarFallback>
</Avatar>
```

---

### Testing Strategy (Future)

**Unit Tests:**
- Utility functions (`cn`, formatters)
- Type guards
- Validation logic

**Component Tests:**
- Button states and interactions
- Form submission
- Modal open/close

**Integration Tests:**
- Create post flow
- RSVP to event flow
- Filter feed

**E2E Tests:**
- User journey: Login → Create event → RSVP → View in sidebar
- Critical paths only

---

## 📚 Additional Resources

### Key Files to Study

1. **Type System:** `lib/types.ts`
2. **Theme Tokens:** `app/theme.css`
3. **Global Styles:** `app/globals.css`
4. **Main Feed Logic:** `components/main-feed.tsx`
5. **Event Card Interactions:** `components/event-card.tsx`
6. **Project Card Interactions:** `components/project-card.tsx`

### Design References

**Color System:**
- OKLCH Color Space: https://oklch.com
- WCAG Contrast Checker: https://webaim.org/resources/contrastchecker/

**Animation:**
- Framer Motion Docs: https://www.framer.com/motion/
- Easing Functions: https://easings.net

**Component Library:**
- Shadcn/ui: https://ui.shadcn.com
- Radix Primitives: https://www.radix-ui.com

---

## 🎯 Adoption Checklist

When adapting this blueprint for your project:

- [ ] Install dependencies (React, Next.js, Tailwind, Framer Motion, Shadcn/ui)
- [ ] Copy theme files (`theme.css`, `globals.css`)
- [ ] Copy type definitions (`lib/types.ts`)
- [ ] Set up component library (Shadcn/ui components)
- [ ] Implement three core card types (Event, Project, Post)
- [ ] Build create/edit flows (dialogs)
- [ ] Add filtering and sorting
- [ ] Implement @mention system
- [ ] Set up backend API endpoints
- [ ] Add authentication/authorization
- [ ] Implement real-time updates (optional)
- [ ] Test accessibility (keyboard nav, screen readers)
- [ ] Optimize performance (lazy loading, memoization)
- [ ] Add analytics tracking

---

## 🔮 Future Enhancements

**Planned Features:**
- Real-time updates (WebSocket/SSE)
- Advanced search and filtering
- Comment threads on posts
- Direct messaging
- Calendar integration
- Mobile app (React Native)
- Push notifications
- File uploads and image handling
- Rich text editor
- Video embeds
- Event reminders
- Project milestones
- Org analytics dashboard

**Technical Debt:**
- Replace console.log with actual API calls
- Add comprehensive error boundaries
- Implement proper loading states
- Add skeleton screens
- Optimize bundle size
- Add service worker for offline support
- Improve mobile responsiveness
- Add E2E testing

---

## 📞 Support & Contribution

This blueprint is based on a production charity collaboration platform. It represents best practices for building social feeds with complex content types and rich interactions.

**Key Takeaways:**
- Progressive disclosure reduces cognitive load
- OKLCH provides better color consistency
- Three content types (Post/Event/Project) cover most collaboration needs
- Smart CTAs (conditional dropdowns) improve UX
- Animated micro-interactions delight users
- Type safety catches bugs early

**Built with ❤️ for enabling better collaboration between charitable organizations.**

---

*Last Updated: November 2024*
*Version: 1.0*

