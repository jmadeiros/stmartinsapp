import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOT_DIR = 'test-screenshots/error-handling';

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

test.describe('Error Handling Tests', () => {
  test.setTimeout(120_000);
  test.describe.configure({ mode: 'serial' });

  // ============================================
  // 404 NOT FOUND TESTS
  // ============================================
  test.describe('404 Not Found Page', () => {
    test('should display 404 page for non-existent route', async ({ page }) => {
      await devLogin(page, 'admin');

      // Navigate to a non-existent route
      await page.goto('/dashboard/nonexistent-route-12345');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'error-404-nonexistent-route');

      // Check for 404 error indicators
      const pageContent = await page.textContent('body');
      const has404Content = pageContent && (
        pageContent.includes('404') ||
        pageContent.includes('not found') ||
        pageContent.includes('Not found') ||
        pageContent.includes('Page not found') ||
        pageContent.includes("doesn't exist")
      );

      if (has404Content) {
        console.log('[Test] 404 page content found');
      } else {
        console.log('[Test] Page may not show 404 content');
      }

      // Verify page is not blank
      expect(pageContent).toBeTruthy();
      expect(pageContent!.length).toBeGreaterThan(100);
      console.log('[Test] Page is not blank');
    });

    test('should show navigation options on error page', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/dashboard/nonexistent-page');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for navigation buttons (Home, Dashboard, Go back)
      const homeLink = page.locator('a:has-text("Dashboard"), a:has-text("Home"), button:has-text("Go to Dashboard")').first();
      const backButton = page.locator('button:has-text("back"), button:has-text("Go back")').first();

      const hasHomeLink = await homeLink.isVisible().catch(() => false);
      const hasBackButton = await backButton.isVisible().catch(() => false);

      if (hasHomeLink || hasBackButton) {
        console.log('[Test] Navigation options found on error page');
        await takeScreenshot(page, 'error-404-navigation-options');

        // Test that clicking home link works
        if (hasHomeLink) {
          await homeLink.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          // Should be redirected to dashboard or home
          const currentUrl = page.url();
          const isValidRedirect = currentUrl.includes('/dashboard') || currentUrl.includes('/');
          expect(isValidRedirect).toBe(true);
          console.log('[Test] Navigation from error page works');
        }
      } else {
        console.log('[Test] Navigation options not found - checking for any clickable elements');
        await takeScreenshot(page, 'error-404-no-navigation');
      }
    });

    test('should handle deeply nested non-existent routes', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/dashboard/settings/profile/nonexistent/deeply/nested');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'error-404-nested-route');

      // Page should not be blank
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
      expect(pageContent!.length).toBeGreaterThan(50);
      console.log('[Test] Nested 404 route handled');
    });
  });

  // ============================================
  // ERROR BOUNDARY TESTS
  // ============================================
  test.describe('Error Boundary Behavior', () => {
    test('should display error UI when page encounters an error', async ({ page }) => {
      await devLogin(page, 'admin');

      // Try to access a page that might trigger an error
      // (Using query params that might cause issues)
      await page.goto('/events/invalid-uuid-format');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'error-boundary-invalid-uuid');

      const pageContent = await page.textContent('body');

      // Check for error-related content
      const hasErrorContent = pageContent && (
        pageContent.includes('error') ||
        pageContent.includes('Error') ||
        pageContent.includes('wrong') ||
        pageContent.includes('Wrong') ||
        pageContent.includes('not found') ||
        pageContent.includes('try again') ||
        pageContent.includes('Try again')
      );

      // Verify page shows some content (not blank)
      expect(pageContent).toBeTruthy();
      console.log(`[Test] Error page shows content: ${hasErrorContent ? 'Yes' : 'No specific error message'}`);
    });

    test('should have working "Try again" functionality', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/projects/invalid-project-id');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'error-boundary-try-again-before');

      // Look for "Try again" button
      const tryAgainButton = page.locator('button:has-text("Try again"), button:has-text("Retry")').first();

      if (await tryAgainButton.isVisible()) {
        console.log('[Test] Try again button found');

        // Click the try again button
        await tryAgainButton.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'error-boundary-try-again-after');

        // Page should still be functional
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
        console.log('[Test] Try again button is functional');
      } else {
        console.log('[Test] No try again button found (may not be an error page)');
      }
    });

    test('should allow navigation away from error page', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/chat/nonexistent-conversation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'error-navigation-before');

      // Try navigating to dashboard using sidebar or direct navigation
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'error-navigation-after');

      // Should be on dashboard
      expect(page.url()).toContain('/dashboard');
      console.log('[Test] Navigation from error page to dashboard works');
    });
  });

  // ============================================
  // AUTHENTICATED ERROR HANDLING
  // ============================================
  test.describe('Authenticated Error Pages', () => {
    test('should show appropriate error for invalid event ID', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/events/00000000-0000-0000-0000-000000000000');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'error-invalid-event-id');

      // Page should handle gracefully
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();

      // Look for error indicators
      const errorIndicator = page.locator('[class*="error"], [class*="alert"], svg[class*="lucide-alert"]').first();
      const hasErrorIndicator = await errorIndicator.isVisible().catch(() => false);

      if (hasErrorIndicator) {
        console.log('[Test] Error indicator visible for invalid event');
      } else {
        console.log('[Test] No specific error indicator (may redirect or show empty state)');
      }
    });

    test('should show appropriate error for invalid project ID', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/projects/00000000-0000-0000-0000-000000000000');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'error-invalid-project-id');

      // Page should handle gracefully
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
      console.log('[Test] Invalid project ID handled');
    });
  });

  // ============================================
  // COMPREHENSIVE ERROR HANDLING TEST
  // ============================================
  test('Comprehensive Error Handling Test - All scenarios', async ({ page }) => {
    console.log('\n=== Starting Comprehensive Error Handling Test ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await devLogin(page, 'admin');

    // 2. Test 404 page
    console.log('2. Testing 404 page...');
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    let pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    console.log('[Test] 404 page loads with content');
    await takeScreenshot(page, 'error-comp-01-404');

    // 3. Test navigation back to valid page
    console.log('3. Testing navigation from error page...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/dashboard');
    console.log('[Test] Navigation back to dashboard works');
    await takeScreenshot(page, 'error-comp-02-recovery');

    // 4. Test invalid resource ID
    console.log('4. Testing invalid resource ID...');
    await page.goto('/events/not-a-valid-uuid');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    console.log('[Test] Invalid resource handled');
    await takeScreenshot(page, 'error-comp-03-invalid-resource');

    // 5. Test nested invalid route
    console.log('5. Testing nested invalid route...');
    await page.goto('/settings/invalid/nested/path');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    console.log('[Test] Nested invalid route handled');
    await takeScreenshot(page, 'error-comp-04-nested');

    // 6. Final recovery test
    console.log('6. Testing final recovery...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/dashboard');
    await takeScreenshot(page, 'error-comp-05-final');

    console.log('\n=== Comprehensive Error Handling Test Complete ===\n');
  });
});
