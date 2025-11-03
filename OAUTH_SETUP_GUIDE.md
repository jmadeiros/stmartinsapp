# OAuth Setup Guide
## Microsoft Azure AD & Google OAuth Configuration

**Time Required:** ~30 minutes total  
**Date:** November 3, 2025

---

## Prerequisites

Before starting, you need:
- ✅ Supabase project created
- ✅ Your Supabase project URL (find in Supabase Dashboard → Settings → API)
- ✅ Access to Microsoft Azure Portal (work/personal account)
- ✅ Access to Google Cloud Console

---

## Part 1: Microsoft Azure AD Setup (15 minutes)

### Step 1: Get Your Supabase Redirect URL

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Providers** (left sidebar)
3. Find **Microsoft** in the provider list
4. Copy the **Callback URL** (it looks like):
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   ⚠️ **Save this URL** - you'll need it in Step 3

---

### Step 2: Create Azure AD Application

1. **Go to Azure Portal**  
   https://portal.azure.com

2. **Navigate to Microsoft Entra ID** (formerly Azure AD)
   - Search for "Microsoft Entra ID" in the top search bar
   - Click on it

3. **Register a New Application**
   - Click **App registrations** (left sidebar)
   - Click **+ New registration**

4. **Fill in Registration Form:**
   - **Name:** `The Village Hub` (or your app name)
   - **Supported account types:** 
     - Select: **"Accounts in this organizational directory only"** (single tenant)
     - OR: **"Accounts in any organizational directory"** (multi-tenant) if users from different orgs
   - **Redirect URI:**
     - Platform: **Web**
     - URL: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
     - (Paste the URL from Step 1)
   - Click **Register**

---

### Step 3: Get Client ID & Create Client Secret

1. **After registration, you'll see the app overview page**
   - Copy the **Application (client) ID** 
   - ⚠️ **Save this** - this is your `AZURE_CLIENT_ID`

2. **Create a Client Secret**
   - Click **Certificates & secrets** (left sidebar)
   - Click **+ New client secret**
   - Description: `Supabase Auth`
   - Expires: **24 months** (recommended)
   - Click **Add**
   - ⚠️ **IMPORTANT:** Copy the **Value** immediately (you can't see it again!)
   - This is your `AZURE_CLIENT_SECRET`

---

### Step 4: Configure API Permissions

1. Click **API permissions** (left sidebar)
2. You should see `Microsoft Graph` → `User.Read` (already added by default)
3. If not, click **+ Add a permission**:
   - Select **Microsoft Graph**
   - Select **Delegated permissions**
   - Check: `User.Read`
   - Check: `email`
   - Check: `profile`
   - Check: `openid`
   - Click **Add permissions**
4. Click **✓ Grant admin consent for [Your Organization]** (if available)

---

### Step 5: Add to Supabase

1. **Go back to Supabase Dashboard**
2. **Authentication** → **Providers** → **Microsoft**
3. **Enable Microsoft provider** (toggle on)
4. Fill in:
   - **Client ID:** (paste your Application (client) ID from Step 3)
   - **Client Secret:** (paste your client secret value from Step 3)
5. Click **Save**

---

## Part 2: Google OAuth Setup (15 minutes)

### Step 1: Get Your Supabase Redirect URL (Same as Microsoft)

Your redirect URL is:
```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```

---

### Step 2: Create Google Cloud Project

1. **Go to Google Cloud Console**  
   https://console.cloud.google.com

2. **Create a New Project** (if you don't have one)
   - Click the project dropdown (top left, next to "Google Cloud")
   - Click **New Project**
   - Project name: `The Village Hub` or similar
   - Click **Create**
   - Wait for project creation (~30 seconds)
   - Select your new project from the dropdown

---

### Step 3: Enable Google+ API

1. **Go to APIs & Services**
   - Click hamburger menu (☰) → **APIs & Services** → **Library**

2. **Enable Google+ API**
   - Search for: `Google+ API`
   - Click on it
   - Click **Enable**
   - Wait for it to enable (~10 seconds)

---

### Step 4: Configure OAuth Consent Screen

1. **Go to OAuth consent screen**
   - Hamburger menu (☰) → **APIs & Services** → **OAuth consent screen**

2. **Select User Type:**
   - If for internal organization only: Select **Internal**
   - If for external users: Select **External** (requires verification for production)
   - Click **Create**

3. **Fill in App Information:**
   - **App name:** `The Village Hub`
   - **User support email:** Your email
   - **App logo:** (optional, upload if you have one)
   - **Application home page:** (leave blank for now, or add your domain)
   - **Authorized domains:** (leave blank if testing, or add `supabase.co`)
   - **Developer contact email:** Your email
   - Click **Save and Continue**

4. **Scopes:**
   - Click **Add or Remove Scopes**
   - Select these scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`
   - Click **Update**
   - Click **Save and Continue**

5. **Test Users** (if External):
   - Add your email and any test user emails
   - Click **Save and Continue**

6. **Summary:**
   - Review and click **Back to Dashboard**

---

### Step 5: Create OAuth Credentials

1. **Go to Credentials**
   - Hamburger menu (☰) → **APIs & Services** → **Credentials**

2. **Create OAuth Client ID**
   - Click **+ Create Credentials** (top)
   - Select **OAuth client ID**

3. **Configure OAuth Client:**
   - **Application type:** `Web application`
   - **Name:** `The Village Hub Web Client`
   - **Authorized JavaScript origins:** (leave empty)
   - **Authorized redirect URIs:**
     - Click **+ Add URI**
     - Paste: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - Click **Create**

4. **Copy Your Credentials**
   - A modal will appear with your credentials
   - Copy the **Client ID** ⚠️ Save this
   - Copy the **Client Secret** ⚠️ Save this
   - Click **OK**

---

### Step 6: Add to Supabase

1. **Go back to Supabase Dashboard**
2. **Authentication** → **Providers** → **Google**
3. **Enable Google provider** (toggle on)
4. Fill in:
   - **Client ID:** (paste your Google Client ID from Step 5)
   - **Client Secret:** (paste your Google Client Secret from Step 5)
5. Click **Save**

---

## Part 3: Test Your OAuth Setup (5 minutes)

### Option 1: Test in Supabase Dashboard

1. **Go to Authentication** → **Users** in Supabase
2. Click **Invite user** or open your app login page

### Option 2: Test in Your App

1. **Run your development server:**
   ```bash
   cd /Users/josh/stmartinsapp
   npm run dev
   ```

2. **Create a test login page** (if you don't have one yet):
   - Go to http://localhost:3000
   - You'll build the login page in Phase 1

3. **Quick Test with Supabase Client:**
   - Open your browser console on localhost:3000
   - Run this:
   ```javascript
   // Test Microsoft login
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'azure',
     options: {
       redirectTo: 'http://localhost:3000/auth/callback'
     }
   })
   
   // Test Google login
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: 'http://localhost:3000/auth/callback'
     }
   })
   ```

---

## Troubleshooting

### Microsoft Azure AD Issues

**Error: "AADSTS50011: The reply URL specified in the request does not match"**
- Solution: Check redirect URI in Azure matches exactly: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

**Error: "AADSTS7000218: Invalid client secret"**
- Solution: Generate a new client secret in Azure and update in Supabase

**Error: "Need admin approval"**
- Solution: Grant admin consent in Azure Portal → API permissions

---

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Solution: Verify redirect URI in Google Cloud Console matches: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

**Error: "Access blocked: This app's request is invalid"**
- Solution: Complete the OAuth consent screen configuration

**Error: "This app isn't verified"**
- Solution: For testing, click "Advanced" → "Go to [App name] (unsafe)". For production, submit for verification.

---

## Security Best Practices

### ✅ Do's
- ✅ Store client secrets securely (Supabase handles this)
- ✅ Use HTTPS in production (Supabase provides this)
- ✅ Limit OAuth scopes to only what you need
- ✅ Regularly rotate client secrets (every 6-12 months)

### ❌ Don'ts
- ❌ Never commit client secrets to Git
- ❌ Don't share client secrets in public forums
- ❌ Don't use production OAuth apps for development (create separate ones)

---

## After Setup: What's Next?

Once OAuth is configured, users can:

1. **Sign in with Microsoft** (Azure AD)
   - Ideal for organization email accounts
   - Single Sign-On (SSO) support

2. **Sign in with Google**
   - For Gmail and Google Workspace accounts
   - Familiar login flow

3. **First Login:**
   - User clicks "Sign in with Microsoft/Google"
   - OAuth provider authenticates
   - User is redirected back to your app
   - Supabase creates a user record automatically
   - You'll need to assign their role manually (or build a flow)

4. **Make First User Admin:**
   ```sql
   -- Run this in Supabase SQL Editor after your first login
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

---

## Quick Reference: What You Need to Save

| Provider | What to Save | Where to Save It |
|----------|--------------|------------------|
| **Microsoft** | Application (client) ID | Supabase → Auth → Providers → Microsoft |
| **Microsoft** | Client Secret Value | Supabase → Auth → Providers → Microsoft |
| **Google** | Client ID | Supabase → Auth → Providers → Google |
| **Google** | Client Secret | Supabase → Auth → Providers → Google |

---

## Verification Checklist

After completing setup:

- [ ] Microsoft provider enabled in Supabase
- [ ] Microsoft Client ID & Secret saved in Supabase
- [ ] Google provider enabled in Supabase
- [ ] Google Client ID & Secret saved in Supabase
- [ ] Redirect URIs match in all places
- [ ] Tested login with Microsoft
- [ ] Tested login with Google
- [ ] First user can log in
- [ ] First user made admin (via SQL)

---

## Resources

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Azure AD Setup Guide:** https://supabase.com/docs/guides/auth/social-login/auth-azure
- **Google OAuth Setup Guide:** https://supabase.com/docs/guides/auth/social-login/auth-google
- **OAuth 2.0 Explained:** https://oauth.net/2/

---

**Status:** Ready for Phase 1 Development! 🚀  
**Next Step:** Build authentication pages (Phase 1 - Sprint 1)


