# ✅ Supabase Setup - Quick Guide

## Your Credentials Are Configured

I've created your `.env.local` file with your Supabase credentials:
- **Project URL:** `https://pcokwakenaapsfwcrpyt.supabase.co`
- **Anon Key:** ✅ Configured
- **Service Role Key:** ✅ Configured (keep secret!)

---

## Next Step: Apply Database Schema

### **Option 1: Copy & Paste (Easiest)**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `pcokwakenaapsfwcrpyt`

2. **Go to SQL Editor**
   - Left sidebar → SQL Editor
   - Click "New Query"

3. **Copy the Migration SQL**
   ```bash
   # The complete SQL is in: supabase_migration.sql
   # Copy all contents of that file
   ```

4. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait ~10 seconds for completion

5. **Verify Success**
   - Go to Table Editor
   - You should see 13 tables:
     - organizations
     - users
     - posts
     - post_comments
     - post_reactions
     - events
     - event_attachments
     - jobs
     - meeting_notes
     - media_coverage
     - chat_channels
     - chat_messages
     - user_settings

---

### **Option 2: Use Supabase CLI (Advanced)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref pcokwakenaapsfwcrpyt

# Run migration
npx supabase db push --file supabase_migration.sql
```

---

## What the Migration Creates

### **6 Enums (Custom Types)**
- `user_role`: admin, st_martins_staff, partner_staff, volunteer
- `post_category`: announcement, event, job, story, general
- `reaction_type`: like, helpful, celebrate
- `event_category`: meeting, social, workshop, building_event, other
- `job_role_type`: paid_staff, volunteer, internship
- `channel_type`: public, private, org

### **13 Tables**
1. **organizations** - Charity organizations (2 seed records)
2. **users** - User accounts
3. **posts** - Community board posts
4. **post_comments** - Comments on posts
5. **post_reactions** - Emoji reactions
6. **events** - Event calendar
7. **event_attachments** - Files attached to events
8. **jobs** - Job/volunteer postings
9. **meeting_notes** - Meeting notes archive
10. **media_coverage** - Press/media articles
11. **chat_channels** - Chat channels (3 seed records: #general, #events, #resources)
12. **chat_messages** - Chat message history
13. **user_settings** - User preferences

### **Row Level Security (RLS)**
- ✅ All tables have RLS enabled
- ✅ Policies enforce role-based permissions
- ✅ Data is secure by default

### **Indexes**
- ✅ 40+ performance indexes created
- ✅ Optimized for common queries

### **Triggers**
- ✅ Auto-update `updated_at` on all tables

### **Seed Data**
- 2 organizations (St Martins + Example Charity)
- 3 chat channels (#general, #events, #resources)

---

## After Migration: Set Up OAuth

You still need to configure authentication providers:

### **1. Microsoft Azure AD**

**Create App Registration:**
1. Go to https://portal.azure.com
2. Azure Active Directory → App registrations → New registration
3. Name: "The Village Hub"
4. Redirect URI: `https://pcokwakenaapsfwcrpyt.supabase.co/auth/v1/callback`
5. Click "Register"

**Create Client Secret:**
1. Certificates & secrets → New client secret
2. Description: "Supabase Auth"
3. Expiration: 24 months
4. Copy the **Value** (not the Secret ID!)

**Get Required Info:**
- **Client ID**: Overview page (Application ID)
- **Tenant ID**: Overview page (Directory ID)
- **Client Secret**: From step above

**Configure in Supabase:**
1. Supabase Dashboard → Authentication → Providers
2. Find "Azure" → Enable
3. Paste:
   - Client ID
   - Client Secret
   - Tenant ID (in "Azure AD Tenant URL": `https://login.microsoftonline.com/{TENANT_ID}/v2.0`)
4. Save

**Add to `.env.local`:**
```env
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

---

### **2. Google OAuth**

**Create OAuth Credentials:**
1. Go to https://console.cloud.google.com
2. Create project (or select existing)
3. APIs & Services → Credentials
4. Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Name: "The Village Hub"
7. Authorized redirect URIs: `https://pcokwakenaapsfwcrpyt.supabase.co/auth/v1/callback`
8. Create

**Get Required Info:**
- **Client ID**: Shown after creation
- **Client Secret**: Shown after creation

**Configure in Supabase:**
1. Supabase Dashboard → Authentication → Providers
2. Find "Google" → Enable
3. Paste:
   - Client ID
   - Client Secret
4. Save

**Add to `.env.local`:**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## Create Your First Admin User

### **Step 1: Log in via OAuth**
```bash
# Start dev server
npm run dev

# Open http://localhost:3000
# Click "Login with Microsoft" or "Login with Google"
# Complete OAuth flow
```

### **Step 2: Make yourself admin**

After first login, run this in Supabase SQL Editor:

```sql
-- Replace with your actual email
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

**Verify:**
```sql
SELECT id, email, full_name, role, created_at
FROM users
WHERE email = 'your-email@example.com';
```

You should see `role` = `admin`!

---

## Verification Checklist

Before starting Phase 1 development, verify:

- [ ] Migration ran successfully (13 tables visible in Supabase)
- [ ] `.env.local` exists with Supabase credentials
- [ ] Microsoft OAuth configured in Azure + Supabase
- [ ] Google OAuth configured in Google Cloud + Supabase
- [ ] OAuth credentials added to `.env.local`
- [ ] Dev server runs: `npm run dev`
- [ ] Can log in via Microsoft or Google
- [ ] First user created (check `users` table)
- [ ] First user promoted to admin (via SQL UPDATE)

---

## Troubleshooting

### Migration Fails

**Error:** `role "postgres" does not exist`
- **Solution:** You're using service_role key - use anon key instead, or run via SQL Editor UI

**Error:** `relation "users" already exists`
- **Solution:** Tables already created. Either:
  - Drop all tables first: Be careful! This deletes data.
  - Or skip migration (tables already exist)

### OAuth Not Working

**Error:** `Invalid redirect URI`
- **Solution:** Ensure redirect URI is **exactly**: `https://pcokwakenaapsfwcrpyt.supabase.co/auth/v1/callback`
- Check for trailing slashes, http vs https

**Error:** `Invalid client secret`
- **Solution:** Re-create client secret in Azure/Google and update in Supabase

### Can't Promote to Admin

**Error:** `UPDATE returns 0 rows`
- **Solution:** Email doesn't match. Check `users` table:
  ```sql
  SELECT email FROM users;
  ```
  Use exact email shown.

---

## What's Next?

Once OAuth is configured and you're logged in as admin:

### **Phase 1 - Sprint 1: Authentication & Core Layout**
- Build authenticated layout (sidebar, header)
- Create dashboard page
- Implement role-based routing
- Build user profile page

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md:82-144) for detailed tasks.

---

**Current Status:**
- ✅ Project initialized
- ✅ Dependencies installed
- ✅ Supabase credentials configured
- ⏳ Database migration (run SQL now)
- ⏳ OAuth setup (30 min)
- ⏳ First admin created (after OAuth)

**Ready to code?** Complete the OAuth setup and you're good to go! 🚀
