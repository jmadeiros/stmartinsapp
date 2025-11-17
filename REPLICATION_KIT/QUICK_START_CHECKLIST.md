# Quick Start Checklist ✅

Use this checklist to ensure you've properly integrated the replication kit into your project.

## 📦 Installation (30 mins)

### Phase 1: Dependencies
- [ ] Install Next.js 15+ project (if new project)
- [ ] Install React 18+
- [ ] Install Tailwind CSS v4
- [ ] Install Framer Motion: `npm install framer-motion`
- [ ] Install Lucide React: `npm install lucide-react`
- [ ] Install class utilities: `npm install class-variance-authority clsx tailwind-merge`
- [ ] Install HeroUI (optional): `npm install @heroui/react`
- [ ] Install Shadcn/ui: `npx shadcn@latest init`

### Phase 2: Core Files
- [ ] Copy `styles/theme.css` → `your-project/app/theme.css`
- [ ] Copy `styles/globals.css` → `your-project/app/globals.css`
- [ ] Import both CSS files in your `app/layout.tsx`
- [ ] Copy `lib/types.ts` → `your-project/lib/types.ts`
- [ ] Copy `lib/utils.ts` → `your-project/lib/utils.ts`

### Phase 3: UI Components
- [ ] Install Shadcn components:
  ```bash
  npx shadcn@latest add button card dialog input textarea avatar dropdown-menu collapsible label
  ```
- [ ] Copy all files from `components/ui/` → `your-project/components/ui/`
- [ ] Verify imports resolve correctly

### Phase 4: Main Components
- [ ] Copy `components/header.tsx`
- [ ] Copy `components/left-sidebar.tsx`
- [ ] Copy `components/main-feed.tsx`
- [ ] Copy `components/right-sidebar.tsx`
- [ ] Copy `components/post-card.tsx`
- [ ] Copy `components/event-card.tsx`
- [ ] Copy `components/project-card.tsx`
- [ ] Copy `components/create-event-dialog.tsx`
- [ ] Copy `components/create-project-dialog.tsx`
- [ ] Copy `components/send-alert-dialog.tsx`
- [ ] Copy `components/animated-events.tsx`

### Phase 5: Visual Effects (Optional)
- [ ] Copy `components/aitrium/sphere-image-grid.tsx`
- [ ] Copy `components/aitrium/canvas-reveal-effect.tsx`

### Phase 6: Pages
- [ ] Create `app/social/page.tsx` and copy from `app/social-page.tsx`
- [ ] Create `app/login/page.tsx` and copy from `app/login-page.tsx` (optional)

## 🔧 Configuration (15 mins)

### Tailwind Config
- [ ] Verify `tailwind.config.ts` includes all content paths:
  ```typescript
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ]
  ```

### Path Aliases
- [ ] Verify `tsconfig.json` has path aliases:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
  ```

### CSS Imports
- [ ] Verify `app/layout.tsx` imports:
  ```tsx
  import './globals.css'
  import './theme.css'
  ```

## 🎨 Customization (20 mins)

### Branding
- [ ] Update logo in `components/header.tsx`
- [ ] Update brand name in header
- [ ] Update page titles in metadata
- [ ] Update color scheme in `app/theme.css` (optional)

### Navigation
- [ ] Customize nav items in `components/header.tsx`
- [ ] Update routes to match your app structure
- [ ] Test all navigation links work

### Content Types
- [ ] Review `lib/types.ts` for your needs
- [ ] Add/remove fields as needed
- [ ] Update validation rules

## 🧪 Testing (20 mins)

### Visual Testing
- [ ] Run `npm run dev`
- [ ] Visit `/social` - verify layout renders
- [ ] Check responsive design (mobile, tablet, desktop)
- [ ] Test dark mode toggle (if implemented)
- [ ] Verify all images load (or show fallbacks)

### Interaction Testing
- [ ] Click into post creation textarea - verify expansion
- [ ] Test category selector - verify animation
- [ ] Test @mention dropdown - type `@` and verify
- [ ] Click "Create" dropdown - verify options appear
- [ ] Open event creation modal - verify form works
- [ ] Click "Attend" on event card - verify popover
- [ ] Click "I'm interested" on project - verify popover
- [ ] Test filter buttons - verify feed filters
- [ ] Test dismiss on alert banner

### Component Testing
- [ ] All buttons have hover states
- [ ] All inputs have focus states
- [ ] Modals can be closed with escape key
- [ ] Click outside popover closes it
- [ ] Animations are smooth (no jank)

## 🔌 Backend Integration (Variable time)

### API Setup
- [ ] Define API routes for:
  - GET `/api/feed` - fetch feed items
  - POST `/api/posts` - create post
  - POST `/api/events` - create event
  - POST `/api/projects` - create project
  - POST `/api/events/:id/attend` - RSVP to event
  - POST `/api/projects/:id/interest` - show interest
  - GET `/api/organizations` - for @mention dropdown

### Replace Mock Data
- [ ] Replace `feedItems` array in `main-feed.tsx` with API call
- [ ] Replace `events` array in `animated-events.tsx` with API call
- [ ] Replace `teamMembers` in `left-sidebar.tsx` with API call
- [ ] Replace `existingEvents/Projects/Orgs` in `main-feed.tsx` with API calls

### Add React Query (Recommended)
```bash
npm install @tanstack/react-query
```
- [ ] Set up QueryClientProvider in layout
- [ ] Create query hooks for feed, events, projects
- [ ] Implement optimistic updates for actions

### Authentication
- [ ] Add auth provider (NextAuth, Clerk, Supabase, etc.)
- [ ] Protect `/social` route (require login)
- [ ] Get current user data for post creation
- [ ] Check `isManager` role for alert dialog
- [ ] Add user avatar to header

## 📱 Mobile Optimization (30 mins)

### Responsive Testing
- [ ] Test on iPhone (375px, 414px)
- [ ] Test on Android (360px, 412px)
- [ ] Test on tablet (768px, 1024px)
- [ ] Verify sidebars hide on mobile
- [ ] Verify feed is full-width on mobile
- [ ] Test all touch interactions work

### Performance
- [ ] Lazy load modals
- [ ] Add image optimization (Next.js Image)
- [ ] Test scroll performance
- [ ] Reduce motion for `prefers-reduced-motion`

## ♿ Accessibility (20 mins)

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify logical focus order
- [ ] Test Escape to close modals/dropdowns
- [ ] Test Enter/Space to activate buttons

### Screen Reader
- [ ] Add ARIA labels to icon-only buttons
- [ ] Add alt text to all images
- [ ] Verify form labels are associated
- [ ] Test with VoiceOver (Mac) or NVDA (Windows)

### Contrast
- [ ] Run contrast checker on all text/background combos
- [ ] Ensure 4.5:1 ratio for body text
- [ ] Ensure 3:1 ratio for large text
- [ ] Verify focus indicators are visible

## 🚀 Production Ready (60 mins)

### Error Handling
- [ ] Add error boundaries
- [ ] Handle API errors gracefully
- [ ] Show user-friendly error messages
- [ ] Add fallback UI for failures

### Loading States
- [ ] Add skeleton screens for initial load
- [ ] Show spinners for actions
- [ ] Disable buttons during submission
- [ ] Show progress for uploads

### Notifications
- [ ] Install toast library: `npm install sonner`
- [ ] Add success toasts for actions
- [ ] Add error toasts for failures
- [ ] Add info toasts for updates

### SEO & Metadata
- [ ] Add page titles
- [ ] Add meta descriptions
- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags

### Analytics
- [ ] Set up analytics (Vercel, Google Analytics, etc.)
- [ ] Track page views
- [ ] Track button clicks
- [ ] Track form submissions

### Deployment
- [ ] Set up environment variables
- [ ] Configure production build
- [ ] Test production build locally
- [ ] Deploy to hosting (Vercel, etc.)
- [ ] Verify production site works
- [ ] Set up error tracking (Sentry)

## 🎯 Optional Enhancements

### Advanced Features
- [ ] Add comment threads on posts
- [ ] Add real-time updates (WebSocket)
- [ ] Add file upload support
- [ ] Add rich text editor
- [ ] Add emoji picker
- [ ] Add video embeds
- [ ] Add calendar integration
- [ ] Add email notifications

### Performance
- [ ] Add virtual scrolling for long feeds
- [ ] Add PWA support (offline mode)
- [ ] Add service worker for caching
- [ ] Optimize bundle size
- [ ] Enable React Server Components

### Testing
- [ ] Write unit tests for utilities
- [ ] Write component tests (React Testing Library)
- [ ] Write integration tests
- [ ] Write E2E tests (Playwright)
- [ ] Set up CI/CD pipeline

## ✅ Launch Checklist

### Pre-launch
- [ ] All features work as expected
- [ ] Mobile responsive on all devices
- [ ] Accessible to keyboard/screen reader users
- [ ] Fast load times (< 3s)
- [ ] No console errors or warnings
- [ ] All links work
- [ ] Forms validate properly
- [ ] Error states display correctly

### Launch
- [ ] Production environment configured
- [ ] DNS configured correctly
- [ ] SSL certificate active (HTTPS)
- [ ] Analytics tracking
- [ ] Error monitoring active
- [ ] Backup strategy in place

### Post-launch
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Fix critical bugs within 24h
- [ ] Plan feature iterations

---

## 📊 Estimated Timeline

| Phase | Time | Priority |
|-------|------|----------|
| Installation & Setup | 1-2 hours | Critical |
| Customization | 1-2 hours | High |
| Backend Integration | 4-8 hours | Critical |
| Mobile Optimization | 1-2 hours | High |
| Accessibility | 1-2 hours | High |
| Production Ready | 2-4 hours | Critical |
| Optional Enhancements | Variable | Low-Medium |

**Total (Core Features):** ~10-20 hours

---

## 🆘 Need Help?

1. Check `docs/SOCIAL_HOMEPAGE_BLUEPRINT.md` for detailed documentation
2. Review component files for inline comments
3. Check the README.md for common issues
4. Verify all dependencies are installed correctly

**Good luck! 🚀**

