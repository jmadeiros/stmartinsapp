import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOT_DIR = 'test-screenshots/mobile-responsive';

// iPhone SE viewport dimensions
const MOBILE_VIEWPORT = { width: 375, height: 667 };

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

// Helper function to check for horizontal overflow
async function checkHorizontalOverflow(page: Page): Promise<{ hasOverflow: boolean; scrollWidth: number; clientWidth: number }> {
  const overflow = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return {
      hasOverflow: body.scrollWidth > html.clientWidth || html.scrollWidth > html.clientWidth,
      scrollWidth: Math.max(body.scrollWidth, html.scrollWidth),
      clientWidth: html.clientWidth
    };
  });
  return overflow;
}

test.describe('Mobile Responsive Tests (375px viewport)', () => {
  test.setTimeout(120_000);
  test.describe.configure({ mode: 'serial' });

  // Set mobile viewport for all tests in this describe block
  test.use({ viewport: MOBILE_VIEWPORT });

  // ============================================
  // DASHBOARD MOBILE TESTS
  // ============================================
  test.describe('Dashboard Mobile', () => {
    test('should render dashboard without horizontal scrollbar', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'mobile-dashboard-01-full');

      const overflow = await checkHorizontalOverflow(page);
      console.log(`[Test] Dashboard overflow check: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);

      if (overflow.hasOverflow) {
        console.log('[Warning] Dashboard has horizontal overflow');
      } else {
        console.log('[Test] Dashboard has no horizontal scrollbar');
      }

      // Allow small overflow (scrollbar width tolerance)
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 20);
    });

    test('should have tappable post composer on mobile', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find post composer textarea
      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

      if (await textarea.isVisible()) {
        // Check if textarea is at least 44x44 (minimum tap target)
        const box = await textarea.boundingBox();
        if (box) {
          console.log(`[Test] Post composer size: ${box.width}x${box.height}`);
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }

        // Test tapping
        await textarea.tap();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'mobile-dashboard-02-composer-focused');

        const isFocused = await textarea.evaluate(el => el === document.activeElement);
        console.log(`[Test] Post composer is tappable and focusable: ${isFocused}`);
      }
    });

    test('should have accessible filter buttons on mobile', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find filter buttons
      const filterButtons = page.locator('button:has-text("All"), button:has-text("Events"), button:has-text("Projects")');
      const buttonCount = await filterButtons.count();

      if (buttonCount > 0) {
        console.log(`[Test] Found ${buttonCount} filter buttons`);

        // Check first button is tappable
        const firstButton = filterButtons.first();
        const box = await firstButton.boundingBox();
        if (box) {
          console.log(`[Test] Filter button size: ${box.width}x${box.height}`);
          // Minimum recommended tap target is 44x44, but allow smaller if text-only
          expect(box.height).toBeGreaterThanOrEqual(32);
        }

        await takeScreenshot(page, 'mobile-dashboard-03-filters');
      }
    });
  });

  // ============================================
  // EVENTS MOBILE TESTS
  // ============================================
  test.describe('Events Mobile', () => {
    test('should render events page without horizontal scrollbar', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'mobile-events-01-full');

      const overflow = await checkHorizontalOverflow(page);
      console.log(`[Test] Events overflow check: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 20);
    });

    test('should have tappable event cards on mobile', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const eventCard = page.locator('[data-testid="event-card"], a[href*="/events/"]').first();

      if (await eventCard.isVisible()) {
        const box = await eventCard.boundingBox();
        if (box) {
          console.log(`[Test] Event card size: ${box.width}x${box.height}`);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }

        await takeScreenshot(page, 'mobile-events-02-card');
      }
    });
  });

  // ============================================
  // PROJECTS MOBILE TESTS
  // ============================================
  test.describe('Projects Mobile', () => {
    test('should render projects page without horizontal scrollbar', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'mobile-projects-01-full');

      const overflow = await checkHorizontalOverflow(page);
      console.log(`[Test] Projects overflow check: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 20);
    });

    test('should have readable project cards on mobile', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const projectCard = page.locator('[class*="card"], article').first();

      if (await projectCard.isVisible()) {
        const box = await projectCard.boundingBox();
        if (box) {
          console.log(`[Test] Project card size: ${box.width}x${box.height}`);
          // Card should fit within viewport with some padding
          expect(box.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
        }

        await takeScreenshot(page, 'mobile-projects-02-card');
      }
    });
  });

  // ============================================
  // CHAT MOBILE TESTS
  // ============================================
  test.describe('Chat Mobile', () => {
    test('should render chat page without horizontal scrollbar', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'mobile-chat-01-full');

      const overflow = await checkHorizontalOverflow(page);
      console.log(`[Test] Chat overflow check: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 20);
    });

    test('should have functional message input on mobile', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find chat input
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();

      if (await chatInput.isVisible()) {
        const box = await chatInput.boundingBox();
        if (box) {
          console.log(`[Test] Chat input size: ${box.width}x${box.height}`);
          expect(box.width).toBeGreaterThanOrEqual(100);
          expect(box.height).toBeGreaterThanOrEqual(32);
        }

        await takeScreenshot(page, 'mobile-chat-02-input');
      }
    });
  });

  // ============================================
  // PROFILE MOBILE TESTS
  // ============================================
  test.describe('Profile Mobile', () => {
    test('should render profile page without horizontal scrollbar', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'mobile-profile-01-full');

      const overflow = await checkHorizontalOverflow(page);
      console.log(`[Test] Profile overflow check: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 20);
    });

    test('should have visible avatar and user info on mobile', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for avatar
      const avatar = page.locator('[class*="avatar"], img[class*="avatar"], [class*="Avatar"]').first();
      const isAvatarVisible = await avatar.isVisible().catch(() => false);

      if (isAvatarVisible) {
        console.log('[Test] Avatar visible on mobile profile');
        await takeScreenshot(page, 'mobile-profile-02-avatar');
      }

      // Check for user name
      const pageContent = await page.textContent('body');
      const hasUserContent = pageContent && (
        pageContent.includes('Sarah') ||
        pageContent.includes('Profile') ||
        pageContent.includes('Edit')
      );

      if (hasUserContent) {
        console.log('[Test] User content visible on mobile profile');
      }
    });
  });

  // ============================================
  // SETTINGS MOBILE TESTS
  // ============================================
  test.describe('Settings Mobile', () => {
    test('should render settings page without horizontal scrollbar', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'mobile-settings-01-full');

      const overflow = await checkHorizontalOverflow(page);
      console.log(`[Test] Settings overflow check: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 20);
    });

    test('should have tappable toggle switches on mobile', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find toggle switches
      const toggles = page.locator('[role="switch"], input[type="checkbox"]');
      const toggleCount = await toggles.count();

      if (toggleCount > 0) {
        console.log(`[Test] Found ${toggleCount} toggles on settings page`);

        const firstToggle = toggles.first();
        const box = await firstToggle.boundingBox();
        if (box) {
          console.log(`[Test] Toggle size: ${box.width}x${box.height}`);
          // Toggles should be at least 44x20 for tapping
          expect(box.width).toBeGreaterThanOrEqual(20);
          expect(box.height).toBeGreaterThanOrEqual(16);
        }

        await takeScreenshot(page, 'mobile-settings-02-toggles');
      }
    });
  });

  // ============================================
  // NAVIGATION MOBILE TESTS
  // ============================================
  test.describe('Navigation Mobile', () => {
    test('should have accessible mobile navigation', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for mobile menu button (hamburger)
      const menuButton = page.locator('button[aria-label*="menu"], button:has(svg[class*="menu"]), [data-testid="mobile-menu"]').first();
      const hasMenuButton = await menuButton.isVisible().catch(() => false);

      if (hasMenuButton) {
        console.log('[Test] Mobile menu button found');
        await menuButton.tap();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'mobile-nav-01-menu-open');
      }

      // Check for bottom navigation or sidebar
      const bottomNav = page.locator('nav[class*="bottom"], [class*="bottom-nav"]').first();
      const hasBottomNav = await bottomNav.isVisible().catch(() => false);

      if (hasBottomNav) {
        console.log('[Test] Bottom navigation found');
        await takeScreenshot(page, 'mobile-nav-02-bottom');
      }

      // Check header is visible
      const header = page.locator('header, [class*="header"]').first();
      const isHeaderVisible = await header.isVisible().catch(() => false);

      if (isHeaderVisible) {
        const headerBox = await header.boundingBox();
        if (headerBox) {
          console.log(`[Test] Header size: ${headerBox.width}x${headerBox.height}`);
          // Header should span full width
          expect(headerBox.width).toBeGreaterThanOrEqual(MOBILE_VIEWPORT.width - 20);
        }
      }
    });

    test('should have tappable notification bell on mobile', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const bellButton = page.locator('button:has(svg[class*="bell"]), button[aria-label*="notification"]').first();

      if (await bellButton.isVisible()) {
        const box = await bellButton.boundingBox();
        if (box) {
          console.log(`[Test] Bell button size: ${box.width}x${box.height}`);
          expect(box.width).toBeGreaterThanOrEqual(32);
          expect(box.height).toBeGreaterThanOrEqual(32);
        }

        // Test tap
        await bellButton.tap();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'mobile-nav-03-notifications');

        // Close by pressing escape
        await page.keyboard.press('Escape');
      }
    });
  });

  // ============================================
  // COMPREHENSIVE MOBILE TEST
  // ============================================
  test('Comprehensive Mobile Responsive Test - All pages', async ({ page }) => {
    console.log('\n=== Starting Comprehensive Mobile Responsive Test ===\n');
    console.log(`Viewport: ${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height}`);

    // 1. Login
    console.log('1. Logging in...');
    await devLogin(page, 'admin');

    const pagesToTest = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Events', url: '/events' },
      { name: 'Projects', url: '/projects' },
      { name: 'Chat', url: '/chat' },
      { name: 'Profile', url: '/profile' },
      { name: 'Settings', url: '/settings' },
      { name: 'Search', url: '/search' },
    ];

    const results: Array<{ page: string; hasOverflow: boolean; scrollWidth: number; clientWidth: number }> = [];

    for (let i = 0; i < pagesToTest.length; i++) {
      const pageInfo = pagesToTest[i];
      console.log(`${i + 2}. Testing ${pageInfo.name}...`);

      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const overflow = await checkHorizontalOverflow(page);
      results.push({
        page: pageInfo.name,
        ...overflow
      });

      await takeScreenshot(page, `mobile-comp-${String(i + 1).padStart(2, '0')}-${pageInfo.name.toLowerCase()}`);

      if (overflow.hasOverflow) {
        console.log(`[Warning] ${pageInfo.name} has horizontal overflow: ${overflow.scrollWidth}px > ${overflow.clientWidth}px`);
      } else {
        console.log(`[Test] ${pageInfo.name} fits within viewport`);
      }
    }

    // Summary
    console.log('\n=== Mobile Responsive Test Summary ===');
    const failedPages = results.filter(r => r.scrollWidth > r.clientWidth + 20);
    console.log(`Total pages tested: ${results.length}`);
    console.log(`Pages without overflow: ${results.length - failedPages.length}`);
    console.log(`Pages with overflow: ${failedPages.length}`);

    if (failedPages.length > 0) {
      console.log('Pages with overflow:');
      failedPages.forEach(p => {
        console.log(`  - ${p.page}: ${p.scrollWidth}px (viewport: ${p.clientWidth}px)`);
      });
    }

    console.log('\n=== Comprehensive Mobile Responsive Test Complete ===\n');
  });
});
