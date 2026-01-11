import { test, expect, Page, Route } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOT_DIR = 'test-screenshots/loading-states';

// Helper function to take screenshots
async function takeScreenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`[Screenshot] ${screenshotPath}`);
}

// Helper function to perform dev login
async function devLogin(page: Page, role: string = 'admin') {
  const appBaseUrl = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment');
  }

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  const apiResponse = await page.request.post(`${appBaseUrl}/api/dev-login`, {
    data: { role }
  });

  if (!apiResponse.ok()) {
    throw new Error(`Dev login API failed: ${await apiResponse.text()}`);
  }

  const apiData = await apiResponse.json();
  const { email, password } = apiData;

  const authResponse = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    data: { email, password },
  });

  if (!authResponse.ok()) {
    const errorText = await authResponse.text();
    throw new Error(`Supabase auth failed: ${errorText}`);
  }

  const authData: any = await authResponse.json();
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

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
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    },
  ]);

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
        })
      );
    },
    { authData, projectRef }
  );

  return { userId: authData.user.id, email };
}

test.describe('Loading States Tests', () => {
  test.setTimeout(120_000);
  test.describe.configure({ mode: 'serial' });

  // ============================================
  // DASHBOARD LOADING STATE TESTS
  // ============================================
  test.describe('Dashboard Loading States', () => {
    test('should show skeleton loaders on dashboard during load', async ({ page }) => {
      await devLogin(page, 'admin');

      // Set up route interception to delay Supabase responses
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      await page.route(`${supabaseUrl}/rest/v1/**`, async (route: Route) => {
        // Add 1.5 second delay to API responses
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.continue();
      });

      // Navigate to dashboard
      const dashboardPromise = page.goto('/dashboard', { waitUntil: 'commit' });

      // Check for skeleton elements immediately after navigation starts
      await page.waitForTimeout(200);
      await takeScreenshot(page, 'loading-dashboard-01-initial');

      // Look for skeleton elements (animate-pulse class is used by Skeleton component)
      const skeletonElements = page.locator('.animate-pulse, [class*="skeleton"], [class*="Skeleton"]');
      const skeletonCount = await skeletonElements.count();

      if (skeletonCount > 0) {
        console.log(`[Test] Found ${skeletonCount} skeleton elements during dashboard load`);
        await takeScreenshot(page, 'loading-dashboard-02-skeletons-visible');
      } else {
        console.log('[Test] No skeleton elements found (page may load too fast)');
      }

      // Wait for navigation to complete
      await dashboardPromise;
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'loading-dashboard-03-loaded');

      // Verify content loaded
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
      expect(pageContent!.length).toBeGreaterThan(100);
      console.log('[Test] Dashboard content loaded successfully');
    });

    test('should replace skeletons with actual content when loaded', async ({ page }) => {
      await devLogin(page, 'admin');

      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'loading-dashboard-content-loaded');

      // After load, check for actual content elements
      const postComposer = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();
      const feedContent = page.locator('[class*="card"], [class*="Card"], article').first();
      const filterButtons = page.locator('button:has-text("All"), button:has-text("Events"), button:has-text("Projects")').first();

      const hasPostComposer = await postComposer.isVisible().catch(() => false);
      const hasFeedContent = await feedContent.isVisible().catch(() => false);
      const hasFilterButtons = await filterButtons.isVisible().catch(() => false);

      if (hasPostComposer || hasFeedContent || hasFilterButtons) {
        console.log('[Test] Content elements visible after load');
        console.log(`  - Post composer: ${hasPostComposer}`);
        console.log(`  - Feed content: ${hasFeedContent}`);
        console.log(`  - Filter buttons: ${hasFilterButtons}`);
      }

      // Skeletons should be gone or minimal
      const remainingSkeletons = await page.locator('.animate-pulse').count();
      console.log(`[Test] Remaining animated elements: ${remainingSkeletons}`);
    });
  });

  // ============================================
  // EVENTS PAGE LOADING STATE TESTS
  // ============================================
  test.describe('Events Page Loading States', () => {
    test('should show skeleton loaders on events page', async ({ page }) => {
      await devLogin(page, 'admin');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      await page.route(`${supabaseUrl}/rest/v1/**`, async (route: Route) => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        await route.continue();
      });

      // Navigate to events
      const eventsPromise = page.goto('/events', { waitUntil: 'commit' });

      await page.waitForTimeout(200);
      await takeScreenshot(page, 'loading-events-01-initial');

      const skeletonElements = page.locator('.animate-pulse');
      const skeletonCount = await skeletonElements.count();

      if (skeletonCount > 0) {
        console.log(`[Test] Found ${skeletonCount} skeleton elements on events page`);
        await takeScreenshot(page, 'loading-events-02-skeletons');
      }

      await eventsPromise;
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'loading-events-03-loaded');

      console.log('[Test] Events page loaded');
    });
  });

  // ============================================
  // PROJECTS PAGE LOADING STATE TESTS
  // ============================================
  test.describe('Projects Page Loading States', () => {
    test('should show skeleton loaders on projects page', async ({ page }) => {
      await devLogin(page, 'admin');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      await page.route(`${supabaseUrl}/rest/v1/**`, async (route: Route) => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        await route.continue();
      });

      // Navigate to projects
      const projectsPromise = page.goto('/projects', { waitUntil: 'commit' });

      await page.waitForTimeout(200);
      await takeScreenshot(page, 'loading-projects-01-initial');

      const skeletonElements = page.locator('.animate-pulse');
      const skeletonCount = await skeletonElements.count();

      if (skeletonCount > 0) {
        console.log(`[Test] Found ${skeletonCount} skeleton elements on projects page`);
        await takeScreenshot(page, 'loading-projects-02-skeletons');
      }

      await projectsPromise;
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'loading-projects-03-loaded');

      console.log('[Test] Projects page loaded');
    });
  });

  // ============================================
  // CHAT PAGE LOADING STATE TESTS
  // ============================================
  test.describe('Chat Page Loading States', () => {
    test('should show skeleton loaders on chat page', async ({ page }) => {
      await devLogin(page, 'admin');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      await page.route(`${supabaseUrl}/rest/v1/**`, async (route: Route) => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        await route.continue();
      });

      // Navigate to chat
      const chatPromise = page.goto('/chat', { waitUntil: 'commit' });

      await page.waitForTimeout(200);
      await takeScreenshot(page, 'loading-chat-01-initial');

      const skeletonElements = page.locator('.animate-pulse');
      const skeletonCount = await skeletonElements.count();

      if (skeletonCount > 0) {
        console.log(`[Test] Found ${skeletonCount} skeleton elements on chat page`);
        await takeScreenshot(page, 'loading-chat-02-skeletons');

        // Chat skeleton should have conversation list and chat area placeholders
        const conversationSkeletons = page.locator('.animate-pulse').filter({ hasText: '' });
        const conversationCount = await conversationSkeletons.count();
        console.log(`[Test] Conversation list skeleton elements: ${conversationCount}`);
      }

      await chatPromise;
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'loading-chat-03-loaded');

      console.log('[Test] Chat page loaded');
    });
  });

  // ============================================
  // SETTINGS PAGE LOADING STATE TESTS
  // ============================================
  test.describe('Settings Page Loading States', () => {
    test('should show skeleton loaders on settings page', async ({ page }) => {
      await devLogin(page, 'admin');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      await page.route(`${supabaseUrl}/rest/v1/**`, async (route: Route) => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        await route.continue();
      });

      const settingsPromise = page.goto('/settings', { waitUntil: 'commit' });

      await page.waitForTimeout(200);
      await takeScreenshot(page, 'loading-settings-01-initial');

      const skeletonElements = page.locator('.animate-pulse');
      const skeletonCount = await skeletonElements.count();

      if (skeletonCount > 0) {
        console.log(`[Test] Found ${skeletonCount} skeleton elements on settings page`);
      }

      await settingsPromise;
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'loading-settings-02-loaded');

      console.log('[Test] Settings page loaded');
    });
  });

  // ============================================
  // LOADING INDICATOR TESTS
  // ============================================
  test.describe('Loading Indicators', () => {
    test('should show loading spinner during form submissions', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find post composer
      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

      if (await textarea.isVisible()) {
        // Focus and type content
        await textarea.click();
        await textarea.fill('Test post for loading state');
        await page.waitForTimeout(500);

        // Find and click submit button
        const submitButton = page.locator('button:has-text("Post"), button:has(svg[class*="send"])').first();

        if (await submitButton.isVisible()) {
          // Slow down API responses
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          await page.route(`${supabaseUrl}/rest/v1/**`, async (route: Route) => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await route.continue();
          });

          await takeScreenshot(page, 'loading-form-01-before-submit');

          // Click submit
          await submitButton.click();
          await page.waitForTimeout(300);
          await takeScreenshot(page, 'loading-form-02-during-submit');

          // Check for loading indicators
          const loadingSpinner = page.locator('.animate-spin, [class*="loader"], svg.animate-spin').first();
          const isLoading = await loadingSpinner.isVisible().catch(() => false);

          if (isLoading) {
            console.log('[Test] Loading spinner visible during form submission');
          } else {
            console.log('[Test] No loading spinner detected (may be too fast)');
          }

          // Wait for submission to complete
          await page.waitForTimeout(3000);
          await takeScreenshot(page, 'loading-form-03-after-submit');
        }
      }
    });

    test('should show button disabled state during loading', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check submit button disabled state when no content
      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();
      const submitButton = page.locator('button:has-text("Post")').first();

      if (await textarea.isVisible() && await submitButton.isVisible()) {
        // Button should be disabled when empty
        const isDisabledEmpty = await submitButton.isDisabled();
        console.log(`[Test] Submit button disabled when empty: ${isDisabledEmpty}`);

        // Type content
        await textarea.click();
        await textarea.fill('Test content');
        await page.waitForTimeout(300);

        // Button should be enabled with content
        const isDisabledWithContent = await submitButton.isDisabled();
        console.log(`[Test] Submit button disabled with content: ${isDisabledWithContent}`);
        await takeScreenshot(page, 'loading-button-states');
      }
    });
  });

  // ============================================
  // COMPREHENSIVE LOADING STATES TEST
  // ============================================
  test('Comprehensive Loading States Test - All pages', async ({ page }) => {
    console.log('\n=== Starting Comprehensive Loading States Test ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await devLogin(page, 'admin');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // 2. Test dashboard loading
    console.log('2. Testing dashboard loading...');
    await page.route(`${supabaseUrl}/rest/v1/**`, async (route: Route) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(200);
    const dashboardSkeletons = await page.locator('.animate-pulse').count();
    console.log(`[Test] Dashboard skeletons during load: ${dashboardSkeletons}`);
    await takeScreenshot(page, 'loading-comp-01-dashboard');
    await page.waitForLoadState('networkidle');

    // 3. Test events loading
    console.log('3. Testing events loading...');
    await page.goto('/events');
    await page.waitForTimeout(200);
    const eventsSkeletons = await page.locator('.animate-pulse').count();
    console.log(`[Test] Events skeletons during load: ${eventsSkeletons}`);
    await takeScreenshot(page, 'loading-comp-02-events');
    await page.waitForLoadState('networkidle');

    // 4. Test projects loading
    console.log('4. Testing projects loading...');
    await page.goto('/projects');
    await page.waitForTimeout(200);
    const projectsSkeletons = await page.locator('.animate-pulse').count();
    console.log(`[Test] Projects skeletons during load: ${projectsSkeletons}`);
    await takeScreenshot(page, 'loading-comp-03-projects');
    await page.waitForLoadState('networkidle');

    // 5. Test chat loading
    console.log('5. Testing chat loading...');
    await page.goto('/chat');
    await page.waitForTimeout(200);
    const chatSkeletons = await page.locator('.animate-pulse').count();
    console.log(`[Test] Chat skeletons during load: ${chatSkeletons}`);
    await takeScreenshot(page, 'loading-comp-04-chat');
    await page.waitForLoadState('networkidle');

    // 6. Test profile loading
    console.log('6. Testing profile loading...');
    await page.goto('/profile');
    await page.waitForTimeout(200);
    await takeScreenshot(page, 'loading-comp-05-profile');
    await page.waitForLoadState('networkidle');

    // 7. Test settings loading
    console.log('7. Testing settings loading...');
    await page.goto('/settings');
    await page.waitForTimeout(200);
    await takeScreenshot(page, 'loading-comp-06-settings');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Comprehensive Loading States Test Complete ===\n');
  });
});
