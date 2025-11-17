# Social Homepage Replication Kit 🚀

## 📦 What's Inside

This replication kit contains everything you need to implement the social homepage pattern in your own project. It includes all components, styles, types, and documentation required to build a charity collaboration platform with rich content types and engaging interactions.

## 📂 Folder Structure

```
REPLICATION_KIT/
├── README.md (you are here)
├── components.json (Shadcn/ui configuration)
├── package.json (dependencies reference)
│
├── docs/
│   ├── SOCIAL_HOMEPAGE_BLUEPRINT.md (comprehensive guide)
│   └── CONTENT_SYSTEM_SUMMARY.md (content type documentation)
│
├── components/
│   ├── header.tsx (top navigation bar)
│   ├── left-sidebar.tsx (welcome + team + highlights)
│   ├── main-feed.tsx (central content feed)
│   ├── right-sidebar.tsx (alerts + events carousel)
│   ├── post-card.tsx (post display component)
│   ├── event-card.tsx (event display with RSVP)
│   ├── project-card.tsx (project display with interest tracking)
│   ├── create-event-dialog.tsx (event creation modal)
│   ├── create-project-dialog.tsx (project creation modal)
│   ├── send-alert-dialog.tsx (manager alert modal)
│   ├── animated-events.tsx (events carousel)
│   │
│   ├── ui/ (reusable UI primitives)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── avatar.tsx
│   │   ├── category-badge.tsx
│   │   ├── category-selector.tsx
│   │   ├── content-badge.tsx
│   │   ├── needs-chip.tsx
│   │   ├── partner-avatars.tsx
│   │   ├── interest-counter.tsx
│   │   ├── post-menu.tsx
│   │   ├── alert-banner.tsx
│   │   ├── action-cta.tsx
│   │   ├── collapsible.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── label.tsx
│   │   └── card-5.tsx (highlight card)
│   │
│   └── aitrium/ (visual effects)
│       ├── sphere-image-grid.tsx (3D partner grid)
│       └── canvas-reveal-effect.tsx (background animation)
│
├── lib/
│   ├── types.ts (TypeScript type definitions)
│   └── utils.ts (utility functions including cn)
│
├── styles/
│   ├── theme.css (OKLCH design tokens)
│   └── globals.css (global styles + Tailwind imports)
│
└── app/
    ├── social-page.tsx (main social feed page)
    └── login-page.tsx (login with sphere grid)
```

## 🎯 Quick Start

### 1. Prerequisites

Ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- Next.js 15+ project initialized

### 2. Install Dependencies

```bash
npm install react@latest react-dom@latest
npm install next@latest
npm install tailwindcss postcss autoprefixer
npm install framer-motion
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
npm install @heroui/react

# Optional but recommended
npm install sonner # for toast notifications
npm install react-hook-form @hookform/resolvers zod # for forms
npm install @tanstack/react-query # for data fetching
```

### 3. Set Up Tailwind CSS v4

**tailwind.config.ts:**
```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
```

### 4. Copy Files to Your Project

**A. Copy Styles:**
```bash
cp REPLICATION_KIT/styles/theme.css your-project/app/theme.css
cp REPLICATION_KIT/styles/globals.css your-project/app/globals.css
```

**B. Copy Types & Utils:**
```bash
cp -r REPLICATION_KIT/lib/* your-project/lib/
```

**C. Copy Components:**
```bash
cp -r REPLICATION_KIT/components/* your-project/components/
```

**D. Copy Pages:**
```bash
# For Next.js App Router
mkdir -p your-project/app/social
cp REPLICATION_KIT/app/social-page.tsx your-project/app/social/page.tsx

mkdir -p your-project/app/login
cp REPLICATION_KIT/app/login-page.tsx your-project/app/login/page.tsx
```

### 5. Update Imports

Ensure your `app/layout.tsx` imports the global styles:

```tsx
import './globals.css'
import './theme.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### 6. Configure Shadcn/ui

If you want to match the exact component styling:

```bash
npx shadcn@latest init
```

Use the provided `components.json` from this kit, or configure with:
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind config: TypeScript

### 7. Run Your Project

```bash
npm run dev
```

Visit:
- `http://localhost:3000/social` - Social feed
- `http://localhost:3000/login` - Login page

## 📚 Key Concepts

### Three Content Types

1. **Posts** - General updates with 6 categories (intros, wins, opportunities, questions, learnings, general)
2. **Events** - Time/location-specific activities with RSVPs
3. **Projects** - Long-term initiatives with progress tracking and goals

### Design System

- **OKLCH Color Space** - Better perceptual uniformity than HSL
- **CSS Variables** - Light/dark mode support
- **Framer Motion** - Smooth animations and transitions
- **Progressive Disclosure** - Show essentials, reveal details on demand

### Key Features

- ✅ @Mention system for tagging events/projects/orgs
- ✅ Category selector with animated chips
- ✅ Support popovers for specifying how to help
- ✅ Interest tracking and engagement metrics
- ✅ Collaboration display (multi-org avatars)
- ✅ Progress bars for projects
- ✅ Alert system for urgent messages
- ✅ Auto-scrolling events carousel
- ✅ Responsive design (mobile-first)

## 🔧 Customization Guide

### 1. Update Colors

Edit `styles/theme.css`:

```css
:root {
  --primary: oklch(0.45 0.18 250); /* Change hue for different color */
  --accent: oklch(0.65 0.22 280);
}
```

### 2. Add Your Logo

Replace in `components/header.tsx`:

```tsx
<div className="flex items-center gap-2.5">
  <YourLogoComponent />
  <h1>Your Brand Name</h1>
</div>
```

### 3. Customize Content Types

Edit `lib/types.ts` to add/remove fields:

```typescript
export type EventPost = {
  // Add custom fields here
  customField?: string
  // ...existing fields
}
```

### 4. Modify Navigation

Update navigation items in `components/header.tsx`:

```tsx
const navItems = [
  { label: "Home", active: true },
  { label: "Your Section" }, // Add your items
  // ...
]
```

### 5. Connect to Your API

Replace mock data in `components/main-feed.tsx`:

```tsx
// Instead of:
const feedItems: FeedItem[] = [/* mock data */]

// Use:
const { data: feedItems } = useQuery({
  queryKey: ['feed'],
  queryFn: fetchFeedItems
})
```

## 🎨 Styling Patterns

### Component Styling

All components use Tailwind CSS with the `cn()` utility for conditional classes:

```tsx
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // Allow prop override
)}>
```

### Animation Patterns

Framer Motion is used for all animations:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
```

### Color Usage

- **Primary (blue):** Default actions, links, focus states
- **Success (emerald):** Projects, positive confirmations
- **Destructive (red):** Alerts, delete actions
- **Warning (amber):** Needs, volunteers
- **Muted (gray):** Secondary content, metadata

## 🧩 Component Dependencies

### Required Shadcn/ui Components

If not already installed:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add collapsible
npx shadcn@latest add label
```

### Icon Library

This kit uses `lucide-react`. All icons are imported from there:

```tsx
import { Calendar, Heart, Users, Target } from "lucide-react"
```

## 🔐 Authentication Setup

The kit includes placeholder auth checks. Integrate with your auth provider:

```tsx
// In components/main-feed.tsx
const { user, isManager } = useAuth() // Your auth hook

// Show/hide features based on role
{isManager && (
  <DropdownMenuItem onClick={() => setShowAlertDialog(true)}>
    <AlertTriangle className="h-4 w-4 text-red-600" />
    <span>Send Alert</span>
  </DropdownMenuItem>
)}
```

## 📱 Mobile Responsiveness

The design is mobile-first with these breakpoints:

- **Mobile (<1024px):** Single column, sidebars hidden
- **Tablet (1024px-1400px):** Main feed expands to full width
- **Desktop (>1024px):** Three-column layout with sidebars

Sidebars are hidden below `lg` breakpoint:

```tsx
<div className="hidden lg:block">
  <LeftSidebar />
</div>
```

## 🧪 Testing Recommendations

### Unit Tests
- Utility functions in `lib/utils.ts`
- Type guards and validators
- Form validation logic

### Component Tests
- Button states and interactions
- Form submission flows
- Modal open/close behavior

### Integration Tests
- Create post flow
- RSVP to event flow
- Filter and sort functionality

### E2E Tests
- User journey: Login → Create event → RSVP → View in sidebar
- Critical paths only

## ⚡ Performance Tips

1. **Lazy Load Modals:**
```tsx
const CreateEventDialog = lazy(() => import('./create-event-dialog'))
```

2. **Memoize Expensive Calculations:**
```tsx
const filteredItems = useMemo(
  () => items.filter(item => item.type === activeFilter),
  [items, activeFilter]
)
```

3. **Use React Query for Data:**
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
  staleTime: 1000 * 60 * 5, // 5 minutes
})
```

4. **Optimize Images:**
```tsx
import Image from 'next/image'

<Image 
  src={event.image} 
  alt={event.title}
  width={800}
  height={400}
  priority={index < 3} // Prioritize first 3
/>
```

## 🐛 Common Issues & Solutions

### Issue: Styles not loading
**Solution:** Ensure `globals.css` and `theme.css` are imported in `app/layout.tsx`

### Issue: Components not rendering
**Solution:** Check that all Shadcn/ui components are installed: `npx shadcn@latest add <component>`

### Issue: TypeScript errors
**Solution:** Ensure `lib/types.ts` is copied and all imports reference `@/lib/types`

### Issue: Animations janky
**Solution:** Add `will-change: transform` to animated elements or reduce motion in `framer-motion` config

### Issue: OKLCH colors not working
**Solution:** Ensure browser supports OKLCH (Safari 15+, Chrome 111+, Firefox 113+). Fallback to HSL if needed.

## 📖 Documentation

For comprehensive documentation, see:
- **`docs/SOCIAL_HOMEPAGE_BLUEPRINT.md`** - Complete architectural guide
- **`docs/CONTENT_SYSTEM_SUMMARY.md`** - Content type system details

Key sections:
- Visual layouts with ASCII diagrams
- Component API documentation
- User interaction flows
- Data structure examples
- Design patterns and best practices

## 🚀 Next Steps

After basic setup:

1. **Connect to Backend**
   - Replace mock data with API calls
   - Implement real authentication
   - Set up WebSocket for real-time updates

2. **Add Features**
   - Comment threads on posts
   - Direct messaging between orgs
   - Calendar integration
   - File uploads and image handling
   - Rich text editor for posts

3. **Optimize**
   - Add loading skeletons
   - Implement virtual scrolling for long feeds
   - Set up PWA for offline support
   - Add service worker for caching

4. **Test**
   - Write unit tests for utilities
   - Add integration tests for flows
   - Run accessibility audit
   - Test on real devices

5. **Deploy**
   - Set up CI/CD pipeline
   - Configure environment variables
   - Enable error tracking (Sentry)
   - Set up analytics

## 💡 Tips for Success

1. **Start Small:** Implement one content type (Posts) first, then add Events and Projects
2. **Follow the Types:** The TypeScript definitions in `lib/types.ts` are your source of truth
3. **Use the Blueprint:** Reference `SOCIAL_HOMEPAGE_BLUEPRINT.md` for detailed component behavior
4. **Maintain Consistency:** Stick to the established design patterns for new features
5. **Test Early:** Test mobile responsiveness from the start, not as an afterthought

## 🤝 Support

Questions? Check the blueprint document first - it has extensive documentation including:
- ASCII diagrams of layouts
- Step-by-step interaction flows
- Code examples for every pattern
- Troubleshooting guides

## 📄 License

This replication kit is provided as-is for educational and commercial use. Components are based on Shadcn/ui (MIT License).

---

**Built with ❤️ for enabling better collaboration between organizations.**

*Last Updated: November 2024*
*Version: 1.0*

