# The Village Hub - Internal Communications Platform

A comprehensive collaboration platform for charities within The Village Hub building. This platform enables seamless communication, event coordination, and resource sharing among resident organizations.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd stmartinsapp

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Project Overview

**Purpose:** Solve information silos and fragmented communication between charities housed within The Village Hub building.

**Key Features:**
- 📢 Community Board for announcements and discussions
- 📅 Shared Events Calendar with recurring events
- 💬 Real-time Community Chat
- 💼 Jobs & Volunteer Opportunities Board
- 📝 Meeting Notes Archive
- 📰 Media Coverage Showcase
- 🍽️ Weekly Lunch Menu
- 👥 User Directory & Profiles

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, ShadCN UI
- **Backend:** Next.js API Routes, Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment:** Vercel (frontend), Supabase Cloud (database)

---

## 📚 Documentation

Comprehensive documentation is available in the following files:

- **[PROJECT_SPECS.md](./PROJECT_SPECS.md)** - Complete project specifications, features, and requirements
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture, system design, and technology decisions
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema, tables, RLS policies, and migrations
- **[API_ROUTES.md](./API_ROUTES.md)** - API endpoints, request/response formats, and error handling
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Phased development roadmap and timeline
- **[PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md)** - User roles, permissions, and access control

---

## 🛠️ Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or pnpm/yarn)
- **Git**
- **Supabase Account** (free tier works for development)
- **Microsoft Azure App Registration** (for Microsoft OAuth)
- **Google Cloud Console Project** (for Google OAuth)

---

## ⚙️ Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your Project URL and anon/public API key
3. Navigate to **Authentication > Providers** and enable:
   - Microsoft (Azure AD)
   - Google
4. Configure OAuth redirect URLs:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://yourdomain.com/api/auth/callback`

### 2. Set Up OAuth Providers

#### Microsoft OAuth (Azure AD)
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory > App registrations**
3. Click **New registration**
4. Configure:
   - Name: "The Village Hub Internal Comms"
   - Supported account types: "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
   - Redirect URI: Web - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
5. After creation, note the **Application (client) ID**
6. Go to **Certificates & secrets** > **New client secret**
7. Note the secret value (you'll need this for Supabase)
8. In Supabase dashboard, enter the Client ID and Client Secret in Microsoft provider settings

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services > OAuth consent screen**
4. Configure consent screen with your app details
5. Go to **Credentials > Create Credentials > OAuth client ID**
6. Application type: Web application
7. Authorized redirect URIs: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
8. Note the Client ID and Client Secret
9. In Supabase dashboard, enter the Client ID and Client Secret in Google provider settings

### 3. Configure Storage Buckets

In Supabase dashboard, go to **Storage** and create the following buckets:

- `avatars` (public)
- `posts` (public)
- `events` (public)
- `meeting-notes` (public)
- `media` (public)

### 4. Run Database Migrations

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Run migrations
npx supabase db push

# Or manually run the SQL migration file
# Copy contents of supabase/migrations/001_initial_schema.sql
# Paste into Supabase SQL Editor and execute
```

### 5. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Optional: Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
```

### 6. Install Dependencies and Run

```bash
# Install all dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
stmartinsapp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth route group (login, callback)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── layout.tsx     # Dashboard layout (sidebar, header)
│   │   │   ├── page.tsx       # Dashboard home
│   │   │   ├── board/         # Community board
│   │   │   ├── calendar/      # Events calendar
│   │   │   ├── chat/          # Community chat
│   │   │   ├── jobs/          # Jobs board
│   │   │   ├── menu/          # Lunch menu
│   │   │   ├── notes/         # Meeting notes
│   │   │   ├── media/         # Media coverage
│   │   │   ├── settings/      # User settings
│   │   │   └── admin/         # Admin panel
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # ShadCN UI components
│   │   ├── layout/            # Layout components (Sidebar, Header)
│   │   ├── dashboard/         # Dashboard-specific components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── supabase/          # Supabase client utilities
│   │   ├── utils.ts           # Utility functions
│   │   ├── validations.ts     # Zod schemas
│   │   └── constants.ts       # App constants
│   ├── hooks/                 # React hooks
│   ├── types/                 # TypeScript types
│   └── styles/                # Style utilities
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Seed data
├── public/                    # Static assets
├── tests/                     # Test files
├── .env.local.example         # Environment variables template
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests (Phase 2)
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

---

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Configure environment variables in Vercel dashboard (same as `.env.local`)
4. Deploy!

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### Production Checklist

- [ ] Environment variables configured in Vercel
- [ ] Supabase production project created
- [ ] OAuth redirect URLs updated for production domain
- [ ] Database migrations run on production
- [ ] Seed data added (organizations, default channels)
- [ ] Sentry configured for error tracking
- [ ] Analytics configured (Plausible/PostHog)
- [ ] Domain configured and SSL enabled
- [ ] All features tested in production
- [ ] User documentation prepared
- [ ] Training session scheduled

---

## 👥 User Roles

The platform has four user roles with different permission levels:

1. **Volunteer** - View-only access, can comment and chat
2. **Partner Staff** - Can create posts, events, job listings
3. **St Martins Staff** - Moderation powers, can manage content
4. **Admin** - Full system access, user management

See [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) for detailed permissions.

---

## 🔒 Security

- OAuth authentication (Microsoft 365, Google Workspace)
- Row Level Security (RLS) enforced at database level
- Input validation with Zod schemas
- XSS protection via React escaping
- CSRF protection on mutations
- Rate limiting on API routes
- File upload validation and virus scanning

---

## 🐛 Troubleshooting

### Common Issues

**OAuth Redirect Not Working:**
- Ensure redirect URLs are correctly configured in Azure/Google Cloud Console
- Check that URLs match exactly (http vs https, trailing slash)
- Verify Supabase provider settings are saved

**Database Connection Errors:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Check Supabase project is active and not paused (free tier auto-pauses after 1 week inactivity)

**RLS Policy Errors:**
- Ensure all RLS policies are created (run migration script)
- Test policies with different user roles
- Check Supabase logs for policy violations

**Build Errors:**
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run type-check`

---

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run tests |
| `npm run db:push` | Push database schema to Supabase |
| `npm run db:seed` | Seed database with test data |

---

## 🤝 Contributing

This is an internal project for The Village Hub. If you're part of the development team:

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and commit: `git commit -m "feat: add new feature"`
3. Push to the branch: `git push origin feature/your-feature-name`
4. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

---

## 📄 License

Proprietary - © 2025 The Village Hub. All rights reserved.

---

## 📞 Support

For issues or questions:

- **Technical Issues:** Open a GitHub issue
- **Feature Requests:** Contact the project manager
- **User Support:** Email support@villagehub.org

---

## 🗺️ Roadmap

### Phase 1: MVP (Weeks 1-6) ✅ (Target)
- Core dashboard and navigation
- Community board with posts and comments
- Events calendar
- Basic chat functionality
- User profiles and settings

### Phase 2: Enhanced Features (Weeks 7-10)
- Notification system
- Global search
- Media coverage section
- Enhanced chat features
- Admin panel

### Phase 3: Advanced Features (Weeks 11-14)
- Event RSVP system
- Resource booking
- Email integrations
- Calendar import/export
- Advanced admin tools

### Phase 4: Launch (Weeks 15-16)
- Final testing and QA
- Performance optimization
- User training
- Production deployment

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed timeline.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/)

---

**Last Updated:** November 3, 2025
**Version:** 1.0.0
**Status:** Planning Phase
