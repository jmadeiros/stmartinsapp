# AI Replication Prompt

Copy and paste this prompt to an AI IDE (Cursor, GitHub Copilot, etc.) to replicate this social homepage project.

---

## 📋 PROMPT FOR AI ASSISTANT

I have a complete replication kit for a social collaboration platform in the `REPLICATION_KIT/` folder. I need you to help me implement this in my project.

### What's in the Kit

The REPLICATION_KIT contains:
- **47 files** including components, styles, types, and documentation
- Complete **TypeScript/React/Next.js** implementation
- **OKLCH-based design system** with light/dark mode
- Three content types: **Posts, Events, and Projects**
- Full component library with **Framer Motion animations**

### Key Documentation Files (Read These First)

1. **`START_HERE.md`** - Quick orientation guide
2. **`README.md`** - Complete setup instructions
3. **`QUICK_START_CHECKLIST.md`** - Step-by-step implementation checklist
4. **`docs/SOCIAL_HOMEPAGE_BLUEPRINT.md`** - Comprehensive 2,593-line architectural guide with:
   - ASCII diagrams of layouts
   - Complete component documentation
   - User interaction flows
   - Data structures and type definitions
   - Design patterns and best practices

### What I Need You To Do

**Phase 1: Understanding**
1. Read `START_HERE.md` to understand the structure
2. Review `QUICK_START_CHECKLIST.md` for the implementation plan
3. Reference `docs/SOCIAL_HOMEPAGE_BLUEPRINT.md` for detailed technical specs

**Phase 2: Setup**
1. Help me install all required dependencies (see `package.json`)
2. Set up the proper file structure in my project
3. Copy and integrate the style files (`styles/theme.css`, `styles/globals.css`)
4. Set up the TypeScript types from `lib/types.ts`

**Phase 3: Implementation**
1. Guide me through copying components in the correct order
2. Help me set up the main page structure:
   - Header (sticky navigation)
   - Left Sidebar (welcome + team + highlights)
   - Main Feed (post creation + feed items)
   - Right Sidebar (alerts + events carousel)
3. Implement the three card types:
   - Post Card (with 6 category types)
   - Event Card (with RSVP popover)
   - Project Card (with progress tracking)

**Phase 4: Features**
1. Implement @mention system for tagging content
2. Set up animated category selector
3. Add create event/project dialogs
4. Implement filter and sort functionality
5. Add support popovers for "Attend" and "I'm interested" buttons

**Phase 5: Customization**
1. Help me customize branding (logo, colors, nav items)
2. Guide me through connecting to my backend API
3. Replace mock data with real data fetching
4. Add authentication checks

### Important Details

**Technology Stack:**
- Next.js 15 (App Router)
- React 18+
- TypeScript 5+
- Tailwind CSS v4
- Framer Motion (animations)
- Shadcn/ui (component primitives)
- OKLCH color system

**Design System:**
- Uses CSS Custom Properties with OKLCH color space
- Surface/Overlay system for depth
- 8-step typography scale
- 6-level spacing system
- Consistent border radius system

**Content Types:**
1. **Posts** - General updates with 6 categories (intros, wins, opportunities, questions, learnings, general)
2. **Events** - Time/location-specific with RSVPs and support options
3. **Projects** - Long-term initiatives with progress tracking and impact goals

**Key Features:**
- Progressive disclosure (show essentials, reveal details on demand)
- @Mention autocomplete for tagging
- Animated category selector with chips
- Support popovers with checkboxes
- Interest tracking and engagement metrics
- Collaboration display (multi-org avatars)
- Responsive design (mobile-first)

### How to Help Me

1. **Read the docs first** - Don't guess, reference the blueprint
2. **Follow the checklist** - Use `QUICK_START_CHECKLIST.md` as your guide
3. **Explain as you go** - Tell me what each component does
4. **Reference the blueprint** - When showing code, cite the relevant section
5. **Ask questions** - If my project structure differs, ask how to adapt
6. **Test incrementally** - Help me verify each phase works before moving on

### Specific Questions to Start

1. What's my current project structure? (Next.js version, routing setup, etc.)
2. Do I want the full implementation or just core features?
3. Should we start with basic setup or jump to a specific component?
4. Do I have any existing components that might conflict?

### Success Criteria

The implementation is complete when:
- [ ] Social feed page loads without errors at `/social`
- [ ] Can create posts with categories
- [ ] Can create events and projects via modals
- [ ] Filter buttons work (All, Events, Projects, Posts)
- [ ] Cards display properly with all metadata
- [ ] "Attend" button shows support popover
- [ ] "I'm interested" button works on projects
- [ ] Responsive on mobile (sidebars hidden, feed full-width)
- [ ] Animations are smooth and performant
- [ ] Ready to connect to backend API

### Additional Notes

- All components are client-side ("use client")
- Mock data is included in components (needs to be replaced)
- Types are in `lib/types.ts` - follow them strictly
- Color system uses OKLCH (newer CSS feature)
- Components use Tailwind with `cn()` utility for conditional classes
- Animations use Framer Motion with specific easing functions

---

## 🎯 Quick Start Option

If you want to get something running quickly first:

1. Copy the 8 essential files (listed in `START_HERE.md`)
2. Install Shadcn/ui base components
3. Get basic feed working
4. Then add advanced features incrementally

---

## 📚 Where to Find Things

- **Layout diagrams**: Blueprint Section 1 (ASCII diagrams)
- **Component specs**: Blueprint Section 6 (Component Documentation)
- **Interaction flows**: Blueprint Section 8 (User Interaction Flows)
- **Data structures**: Blueprint Section 9 (Data Structures)
- **Styling guide**: Blueprint Section 3 (Design System)
- **UX patterns**: Blueprint Section 4 (UI/UX Patterns)

---

**Let's start! What's the first step?**


