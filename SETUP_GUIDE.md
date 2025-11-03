# Setup Guide - The Village Hub

## Phase 0: Project Initialization Complete ✅

The Next.js 14 project structure has been created with all necessary configuration files. Now you need to install Node.js and dependencies to start development.

---

## Prerequisites

### 1. Install Node.js (Required)

**macOS (recommended method - Homebrew):**
```bash
# Install Homebrew first (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (LTS version)
brew install node@20
```

**macOS (alternative - official installer):**
- Visit https://nodejs.org
- Download the LTS version (v20.x)
- Run the installer
- Verify installation: `node --version` and `npm --version`

---

## Quick Start (After Node.js Installation)

### 1. Install Dependencies
```bash
cd /Users/josh/stmartinsapp
npm install
```

This will install:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase client libraries
- TanStack Query
- Framer Motion
- Lucide Icons
- And all other dependencies

### 2. Set Up Environment Variables
```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local with your actual values
nano .env.local  # or use your preferred editor
```

You'll need to add:
- Supabase project URL and keys
- OAuth credentials (Microsoft + Google)

### 3. Set Up Supabase Project

**Create a Supabase Project:**
1. Go to https://supabase.com
2. Sign up (free tier is sufficient for Phase 1)
3. Create a new project
4. Note down:
   - Project URL (Settings → API → Project URL)
   - Anon/Public key (Settings → API → anon public)
   - Service role key (Settings → API → service_role - keep secret!)

**Initialize Database Schema:**
```bash
# The complete schema is in DATABASE_SCHEMA.md
# You can either:

# Option A: Copy SQL from DATABASE_SCHEMA.md to Supabase SQL Editor
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy schema from DATABASE_SCHEMA.md
# 3. Run the SQL

# Option B: Use Supabase CLI (recommended)
npx supabase login
npx supabase link --project-ref <your-project-ref>
# Then create migration files from DATABASE_SCHEMA.md
```

### 4. Set Up OAuth Providers

**Microsoft (Azure AD):**
1. Go to https://portal.azure.com
2. Navigate to Azure Active Directory → App registrations
3. Create new registration
4. Add redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
5. Create client secret
6. Note Client ID, Tenant ID, and Client Secret

**Google:**
1. Go to https://console.cloud.google.com
2. Create new project (or select existing)
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
6. Note Client ID and Client Secret

**Configure in Supabase:**
1. Supabase Dashboard → Authentication → Providers
2. Enable Azure and Google
3. Add your Client IDs and Secrets
4. Save changes

### 5. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000 - you should see "The Village Hub" welcome page!

---

## Project Structure

```
/Users/josh/stmartinsapp/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   └── ui/                 # ShadCN UI components
│   │       └── button.tsx      # Button component (basic)
│   ├── lib/
│   │   ├── supabase/           # Supabase client utilities
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Middleware helper
│   │   └── utils.ts            # Utility functions
│   ├── types/
│   │   └── database.types.ts   # Supabase types (to be generated)
│   ├── actions/                # Server Actions (to be added)
│   └── middleware.ts           # Next.js middleware
├── public/                     # Static assets (to be added)
├── Documentation files:
│   ├── PROJECT_SPECS.md        # Complete specifications
│   ├── ARCHITECTURE.md         # Architecture details
│   ├── DATABASE_SCHEMA.md      # Database schema SQL
│   ├── IMPLEMENTATION_PLAN.md  # Phase-by-phase plan
│   ├── API_ROUTES.md           # API documentation
│   └── PERMISSIONS_MATRIX.md   # Role permissions
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind CSS config
└── next.config.js              # Next.js config
```

---

## Next Steps (Phase 0 Continued)

### Install ShadCN UI Components
```bash
# Initialize ShadCN
npx shadcn@latest init

# Add core components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add skeleton
```

### Generate Database Types
```bash
# After setting up Supabase schema
npx supabase gen types typescript --project-id <your-project-ref> --schema public > src/types/database.types.ts
```

### Create First Admin User
```sql
-- Run this in Supabase SQL Editor after first OAuth login
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

## Development Workflow

### Running the App
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Git Setup (Recommended)
```bash
git init
git add .
git commit -m "Initial commit - Phase 0 complete"
git branch -M main

# Connect to GitHub (create repo first on GitHub)
git remote add origin https://github.com/yourusername/stmartinsapp.git
git push -u origin main
```

---

## Phase 1 Development Starts

Once Phase 0 is complete:
1. ✅ Node.js installed
2. ✅ Dependencies installed (`npm install`)
3. ✅ Supabase project created
4. ✅ Database schema applied
5. ✅ OAuth providers configured
6. ✅ Environment variables set
7. ✅ Dev server running (`npm run dev`)
8. ✅ ShadCN UI initialized

Then proceed to Phase 1 - Sprint 1: Authentication & Core Layout
(See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) lines 82-144)

---

## Troubleshooting

### Node.js Installation Issues
- **Problem:** `node: command not found` after installation
- **Solution:** Restart terminal or run `source ~/.zshrc` (or `~/.bashrc`)

### npm install Errors
- **Problem:** Dependency conflicts
- **Solution:** Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Supabase Connection Issues
- **Problem:** "Invalid API key" errors
- **Solution:** Double-check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### OAuth Login Not Working
- **Problem:** Redirect URI mismatch
- **Solution:** Ensure redirect URIs in Azure/Google match exactly: `https://<project>.supabase.co/auth/v1/callback`

---

## Support

- **Documentation:** See all `.md` files in project root
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **ShadCN UI:** https://ui.shadcn.com

---

**Status:** Phase 0 project structure complete ✅
**Next:** Install Node.js, run `npm install`, and set up Supabase
