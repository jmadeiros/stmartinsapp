import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Test user configurations
const TEST_USERS = [
  { email: 'admin@stmartins.dev', password: 'dev-admin-123', role: 'admin', displayName: 'Admin User' },
  { email: 'staff@stmartins.dev', password: 'dev-staff-123', role: 'st_martins_staff', displayName: 'Staff Member' },
  { email: 'partner@stmartins.dev', password: 'dev-partner-123', role: 'partner_staff', displayName: 'Partner User' },
  { email: 'volunteer@stmartins.dev', password: 'dev-volunteer-123', role: 'volunteer', displayName: 'Volunteer User' },
] as const;

const SCREENSHOT_DIR = 'test-screenshots';

// Helper function to take screenshots
async function takeScreenshot(page: any, name: string) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

// Increase timeout and run tests serially to avoid overloading the dev server
test.setTimeout(60_000);
test.describe.configure({ mode: 'serial' });

// Helper function to perform dev login with a specific role
// 
// IMPORTANT: The Dev Login button in the UI (src/app/login/dev-login.tsx) calls the API
// without a role parameter, so it always logs in as admin. To test all 4 roles, we:
// 1. Call the API directly with a role parameter to get credentials for that role
// 2. Sign in programmatically using Supabase's auth endpoint
// 3. Set the session in browser storage so the app recognizes the user
async function devLogin(page: any, role: string) {
  const appBaseUrl = process.env.E2E_BASE_URL || 'http://localhost:3001';

  // Navigate to login page first
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, `01-${role}-login-page`);

  // Step 1: Call the dev-login API with the specific role to get credentials
  // The API endpoint supports a 'role' parameter in the request body
  const apiResponse = await page.request.post(`${appBaseUrl}/api/dev-login`, {
    data: { role: role }
  });
  
  if (!apiResponse.ok()) {
    throw new Error(`Dev login API failed: ${await apiResponse.text()}`);
  }

  const apiData = await apiResponse.json();
  const { email, password } = apiData;
  
  // Step 2: Get Supabase URL and anon key from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment (.env.local).');
  }

  // Step 3: Sign in using Supabase's REST API
  const authResponse = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    data: {
      email,
      password,
    },
  });

  if (!authResponse.ok()) {
    const errorText = await authResponse.text();
    throw new Error(`Supabase auth failed: ${errorText}`);
  }

  const authData: any = await authResponse.json();
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

  // Set cookies that Supabase SSR expects
  await page.context().addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: JSON.stringify({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_at: authData.expires_at,
        expires_in: authData.expires_in,
        token_type: authData.token_type,
        user: authData.user,
      }),
      domain: new URL(supabaseUrl).hostname,
      path: '/',
      httpOnly: false,
      secure: supabaseUrl.startsWith('https'),
      sameSite: 'Lax' as const,
    },
  ]);

  // Also set in localStorage (used by browser client)
  await page.evaluate(
    ({ authData, projectRef }: { authData: any; projectRef: string }) => {
      localStorage.setItem(
        `sb-${projectRef}-auth-token`,
        JSON.stringify({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          expires_at: authData.expires_at,
          expires_in: authData.expires_in,
          token_type: authData.token_type,
          user: authData.user,
        }),
      );
    },
    { authData, projectRef },
  );

  // Step 4: Navigate to dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for any animations and data loading
  await takeScreenshot(page, `02-${role}-dashboard-loaded`);
}

// Test suite for each user role
for (const user of TEST_USERS) {
  test.describe(`${user.role} user`, () => {
    test(`can log in via Dev Login and see dashboard`, async ({ page }) => {
      // Perform dev login
      await devLogin(page, user.role);

      // Verify we're on the dashboard
      await expect(page).toHaveURL(/.*\/dashboard.*/);

      // Verify user name is displayed (check in left sidebar welcome card)
      // The userName should be visible somewhere on the page
      // Based on the code, it's displayed in the left sidebar
      const userNameElement = page.locator(`text=${user.displayName.split(' ')[0]}`).first();
      await expect(userNameElement).toBeVisible({ timeout: 5000 });
    });

    test(`can create a post and see it in the feed`, async ({ page }) => {
      // Perform dev login
      await devLogin(page, user.role);

      // Find the post creation textarea
      const textarea = page.locator('textarea[placeholder*="Share an update"]').first();
      await expect(textarea).toBeVisible({ timeout: 10000 });
      await textarea.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await takeScreenshot(page, `03-${user.role}-textarea-found`);

      // Click on textarea to focus it
      await textarea.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, `04-${user.role}-textarea-focused`);

      // Type a test message
      const timestamp = new Date().toISOString();
      const testMessage = `Test post from ${user.role} - ${timestamp}`;
      await textarea.fill(testMessage);
      await page.waitForTimeout(1000); // Wait for UI updates
      await takeScreenshot(page, `05-${user.role}-message-typed`);

      // Find and click the Post button
      const postButton = page.getByRole('button', { name: /^Post$/i }).first();
      await expect(postButton).toBeVisible({ timeout: 5000 });
      await expect(postButton).toBeEnabled();
      await postButton.click();

      // Wait for post to be submitted (button should show "Posting..." then back to "Post")
      await page.waitForTimeout(2000); // Wait for submission
      
      // Wait for the post to appear in the feed
      // The post content should be visible in the feed
      await page.waitForSelector(`text=${testMessage}`, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Wait for any animations
      await takeScreenshot(page, `06-${user.role}-post-in-feed`);

      // Verify the post appears in the feed
      const postInFeed = page.locator(`text=${testMessage}`).first();
      await expect(postInFeed).toBeVisible({ timeout: 10000 });
    });

    test(`full flow: login, verify dashboard, create post, verify in feed`, async ({ page }) => {
      // Step 1: Perform dev login (uses API with role parameter)
      await devLogin(page, user.role);
      await takeScreenshot(page, `full-flow-${user.role}-01-logged-in`);

      // Step 2: Verify user name is displayed
      const userNameElement = page.locator(`text=${user.displayName.split(' ')[0]}`).first();
      await expect(userNameElement).toBeVisible({ timeout: 5000 });

      // Step 5: Find and interact with post creation textarea
      const textarea = page.locator('textarea[placeholder*="Share an update"]').first();
      await expect(textarea).toBeVisible({ timeout: 10000 });
      await textarea.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await textarea.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, `full-flow-${user.role}-04-textarea-focused`);

      // Step 6: Type and submit post
      const timestamp = new Date().toISOString();
      const testMessage = `E2E test post from ${user.role} user - ${timestamp}`;
      await textarea.fill(testMessage);
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `full-flow-${user.role}-05-post-typed`);

      // Step 7: Submit post
      const postButton = page.getByRole('button', { name: /^Post$/i }).first();
      await expect(postButton).toBeEnabled();
      await postButton.click();
      await takeScreenshot(page, `full-flow-${user.role}-06-post-submitting`);

      // Step 8: Wait for post to appear in feed
      await page.waitForSelector(`text=${testMessage}`, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, `full-flow-${user.role}-07-post-verified-in-feed`);

      // Step 9: Verify post is visible in feed
      const postInFeed = page.locator(`text=${testMessage}`).first();
      await expect(postInFeed).toBeVisible({ timeout: 10000 });
    });

    test(`can create an event and see it in the feed`, async ({ page }) => {
      // Perform dev login
      await devLogin(page, user.role);

      // Find and click the "Create" button
      const createButton = page.getByRole('button', { name: /^Create$/i }).first();
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await takeScreenshot(page, `event-${user.role}-01-create-button-found`);

      // Click the Create button to open dropdown
      await createButton.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, `event-${user.role}-02-dropdown-opened`);

      // Click "Create Event" from the dropdown
      const createEventOption = page.getByRole('menuitem', { name: /^Create Event$/i }).first();
      await expect(createEventOption).toBeVisible({ timeout: 5000 });
      await createEventOption.click();
      await page.waitForTimeout(1000); // Wait for dialog to open
      await takeScreenshot(page, `event-${user.role}-03-dialog-opened`);

      // Fill in the event form
      const timestamp = new Date().toISOString();
      const eventTitle = `Test Event from ${user.role} - ${timestamp}`;
      const eventDescription = `This is a test event created by ${user.role} user for E2E testing.`;
      
      // Fill title
      const titleInput = page.locator('input[id="title"]').first();
      await expect(titleInput).toBeVisible({ timeout: 5000 });
      await titleInput.fill(eventTitle);
      await page.waitForTimeout(500);

      // Fill description
      const descriptionTextarea = page.locator('textarea[id="description"]').first();
      await expect(descriptionTextarea).toBeVisible({ timeout: 5000 });
      await descriptionTextarea.fill(eventDescription);
      await page.waitForTimeout(500);

      // Set date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
      const dateInput = page.locator('input[id="date"]').first();
      await expect(dateInput).toBeVisible({ timeout: 5000 });
      await dateInput.fill(dateStr);
      await page.waitForTimeout(500);

      // Set time (2:00 PM)
      const timeInput = page.locator('input[id="time"]').first();
      await expect(timeInput).toBeVisible({ timeout: 5000 });
      await timeInput.fill('14:00');
      await page.waitForTimeout(500);

      // Fill location
      const locationInput = page.locator('input[id="location"]').first();
      await expect(locationInput).toBeVisible({ timeout: 5000 });
      await locationInput.fill('Test Community Center');
      await page.waitForTimeout(500);

      // Category defaults to "other" which is valid, so we can skip changing it
      // If we want to test category selection, we can add it here later

      await takeScreenshot(page, `event-${user.role}-04-form-filled`);

      // Submit the form
      const createEventButton = page.getByRole('button', { name: /^Create Event$/i }).first();
      await expect(createEventButton).toBeVisible({ timeout: 5000 });
      await expect(createEventButton).toBeEnabled();
      await createEventButton.click();

      // Wait for dialog to close and event to be created
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `event-${user.role}-05-event-submitted`);

      // Verify the event appears in the feed
      // The event title should be visible in the feed
      await page.waitForSelector(`text=${eventTitle}`, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `event-${user.role}-06-event-in-feed`);

      // Verify the event is visible in the feed
      const eventInFeed = page.locator(`text=${eventTitle}`).first();
      await expect(eventInFeed).toBeVisible({ timeout: 10000 });
    });
  });
}

// Additional test: Verify all roles can access the login page
test('login page is accessible and shows Dev Login button', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  const devLoginButton = page.getByRole('button', { name: /dev login|test mode/i });
  await expect(devLoginButton).toBeVisible({ timeout: 10000 });
  
  await takeScreenshot(page, 'login-page-accessible');
});
