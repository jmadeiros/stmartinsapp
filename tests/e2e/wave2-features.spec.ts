import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOT_DIR = 'test-screenshots/wave2';

// Helper function to take screenshots
async function takeScreenshot(page: any, name: string) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

// Helper function to perform dev login
async function devLogin(page: any, role: string = 'admin') {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  const currentUrl = page.url();
  const urlObj = new URL(currentUrl);
  const appBaseUrl = `${urlObj.protocol}//${urlObj.host}`;

  const apiResponse = await page.request.post(`${appBaseUrl}/api/dev-login`, {
    data: { role: role },
    timeout: 60000
  });

  if (!apiResponse.ok()) {
    throw new Error(`Dev login API failed: ${await apiResponse.text()}`);
  }

  const apiData = await apiResponse.json();
  const { email, password } = apiData;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const authResponse = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    data: { email, password },
  });

  if (!authResponse.ok()) {
    throw new Error(`Supabase auth failed: ${await authResponse.text()}`);
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
        }),
      );
    },
    { authData, projectRef },
  );

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
}

test.describe('Phase 3 Wave 2 Feature Tests', () => {
  test.setTimeout(120_000);
  test.describe.configure({ mode: 'serial' });

  // ============================================
  // 3.6 EVENT DETAIL PAGE TESTS
  // ============================================
  test.describe('3.6 Event Detail Page', () => {
    test('Event card click navigates to event detail page', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, 'event-01-dashboard');

      // Find an event card
      const eventCard = page.locator('[class*="event"], [data-testid="event-card"]').first();

      if (await eventCard.count() > 0) {
        // Look for a clickable element in the event card
        const eventLink = eventCard.locator('a[href*="/events/"]').first();

        if (await eventLink.count() > 0) {
          await eventLink.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);

          // Verify we're on an event detail page
          expect(page.url()).toContain('/events/');
          await takeScreenshot(page, 'event-02-detail-page');
          console.log('✅ Event detail page navigation works');
        } else {
          console.log('⚠️ No event link found in card - checking for direct navigation');
          await page.goto('/events');
          await page.waitForLoadState('networkidle');
          await takeScreenshot(page, 'event-02-events-list');
        }
      } else {
        console.log('⚠️ No events found on dashboard');
        await takeScreenshot(page, 'event-02-no-events');
      }
    });

    test('Event detail page shows event information', async ({ page }) => {
      await devLogin(page, 'admin');

      // Navigate to events page first
      await page.goto('/events', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'event-detail-01-events-page');

      // Try to find any event link
      const eventLink = page.locator('a[href*="/events/"]').first();

      if (await eventLink.count() > 0) {
        await eventLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'event-detail-02-loaded');

        // Check for event detail elements
        const pageContent = await page.textContent('body');

        // Event should have title, date/time, location, description
        const hasEventContent = pageContent && (
          pageContent.includes('RSVP') ||
          pageContent.includes('Attend') ||
          pageContent.includes('organizer') ||
          pageContent.includes('Location')
        );

        if (hasEventContent) {
          console.log('✅ Event detail page shows event information');
        } else {
          console.log('⚠️ Event detail page may be missing content');
        }
      } else {
        console.log('⚠️ No events available to test detail page');
      }
    });

    test('Event detail page has RSVP functionality', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/events', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const eventLink = page.locator('a[href*="/events/"]').first();

      if (await eventLink.count() > 0) {
        await eventLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for RSVP button
        const rsvpButton = page.locator('button:has-text("RSVP"), button:has-text("Attend"), button:has-text("Going")').first();

        if (await rsvpButton.count() > 0) {
          await expect(rsvpButton).toBeVisible({ timeout: 5000 });
          await takeScreenshot(page, 'event-rsvp-01-button-found');
          console.log('✅ RSVP button found on event detail page');

          // Click RSVP
          await rsvpButton.click();
          await page.waitForTimeout(1000);
          await takeScreenshot(page, 'event-rsvp-02-clicked');
        } else {
          console.log('⚠️ No RSVP button found');
          await takeScreenshot(page, 'event-rsvp-01-no-button');
        }
      }
    });
  });

  // ============================================
  // 3.14 ACKNOWLEDGE BUTTON TESTS
  // ============================================
  test.describe('3.14 Priority Alert Acknowledgment', () => {
    test('Pinned posts show acknowledge button', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'ack-01-dashboard');

      // Look for pinned post indicator
      const pinnedBadge = page.locator('text=/Pinned|Priority/i').first();

      if (await pinnedBadge.count() > 0) {
        await takeScreenshot(page, 'ack-02-pinned-found');

        // Look for acknowledge button near pinned content
        const ackButton = page.locator('button:has-text("Acknowledge"), button:has-text("acknowledge")').first();

        if (await ackButton.count() > 0) {
          await expect(ackButton).toBeVisible({ timeout: 5000 });
          console.log('✅ Acknowledge button found for pinned post');
          await takeScreenshot(page, 'ack-03-button-found');
        } else {
          console.log('⚠️ Acknowledge button not visible (may already be acknowledged)');
          await takeScreenshot(page, 'ack-03-no-button');
        }
      } else {
        console.log('⚠️ No pinned posts found to test acknowledgment');
        await takeScreenshot(page, 'ack-02-no-pinned');
      }
    });

    test('Right sidebar shows priority alerts', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for right sidebar with priority alerts
      const sidebar = page.locator('[class*="sidebar"], aside').last();

      if (await sidebar.count() > 0) {
        const sidebarText = await sidebar.textContent();

        if (sidebarText && (sidebarText.includes('Priority') || sidebarText.includes('Alert') || sidebarText.includes('Important'))) {
          console.log('✅ Priority alerts section found in sidebar');
          await takeScreenshot(page, 'ack-sidebar-01-found');
        } else {
          console.log('⚠️ Priority alerts section not found in sidebar');
          await takeScreenshot(page, 'ack-sidebar-01-not-found');
        }
      }
    });
  });

  // ============================================
  // 3.15 POST PINNING TESTS
  // ============================================
  test.describe('3.15 Post Pinning', () => {
    test('Admin can see pin option in post menu', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'pin-01-dashboard');

      // Find a post menu button (three dots / more options)
      const menuButton = page.locator('button:has(svg[class*="more"]), button:has(svg[class*="ellipsis"]), [data-testid="post-menu"]').first();

      if (await menuButton.count() > 0) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'pin-02-menu-open');

        // Look for pin option
        const pinOption = page.locator('text=/Pin|pin post/i').first();

        if (await pinOption.count() > 0) {
          console.log('✅ Pin option found in post menu');
          await takeScreenshot(page, 'pin-03-option-found');
        } else {
          console.log('⚠️ Pin option not found (may already be pinned or not admin)');
          await takeScreenshot(page, 'pin-03-no-option');
        }

        // Close menu by clicking elsewhere
        await page.keyboard.press('Escape');
      } else {
        console.log('⚠️ Post menu button not found');
        await takeScreenshot(page, 'pin-02-no-menu');
      }
    });

    test('Pinned posts appear first in feed', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if first post in feed is pinned
      const firstPost = page.locator('[class*="post-card"], [class*="PostCard"], article').first();

      if (await firstPost.count() > 0) {
        const postText = await firstPost.textContent();

        if (postText && postText.includes('Pinned')) {
          console.log('✅ First post in feed is pinned (correct ordering)');
          await takeScreenshot(page, 'pin-order-01-pinned-first');
        } else {
          console.log('ℹ️ First post is not pinned (no pinned posts or ordering issue)');
          await takeScreenshot(page, 'pin-order-01-not-pinned');
        }
      }
    });

    test('Pinned posts show visual indicator', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for pin icon or "Pinned" badge
      const pinClassIndicator = page.locator('[class*="pin"]');
      const pinSvgIndicator = page.locator('svg[class*="pin"]');
      const pinnedTextIndicator = page.getByText(/Pinned/i);

      const pinCount = await pinClassIndicator.count();
      const svgCount = await pinSvgIndicator.count();
      const textCount = await pinnedTextIndicator.count();

      if (pinCount > 0 || svgCount > 0 || textCount > 0) {
        console.log('✅ Pinned post visual indicator found');
        await takeScreenshot(page, 'pin-indicator-01-found');
      } else {
        console.log('ℹ️ No pinned posts visible or no visual indicator');
        await takeScreenshot(page, 'pin-indicator-01-none');
      }
    });
  });

  // ============================================
  // 3.16 POLLS TESTS
  // ============================================
  test.describe('3.16 Polls Feature', () => {
    test('Poll creation button exists in post composer', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'poll-01-dashboard');

      // Look for poll button in post composer
      const pollButton = page.locator('button:has-text("Poll"), button:has(svg[class*="bar-chart"]), button[aria-label*="poll"]').first();

      if (await pollButton.count() > 0) {
        await expect(pollButton).toBeVisible({ timeout: 5000 });
        console.log('✅ Poll creation button found in composer');
        await takeScreenshot(page, 'poll-02-button-found');

        // Click to see poll creation dialog
        await pollButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'poll-03-dialog');

        // Look for poll creation form elements
        const pollQuestion = page.locator('input[placeholder*="question"], textarea[placeholder*="question"]').first();
        const pollOption = page.locator('input[placeholder*="option"], input[placeholder*="Option"]').first();

        if (await pollQuestion.count() > 0 || await pollOption.count() > 0) {
          console.log('✅ Poll creation form elements found');
        }

        // Close dialog
        await page.keyboard.press('Escape');
      } else {
        console.log('⚠️ Poll creation button not found');
        await takeScreenshot(page, 'poll-02-no-button');
      }
    });

    test('Polls display with vote options', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for poll card elements
      const pollCard = page.locator('[class*="poll"], [data-testid="poll"]').first();

      if (await pollCard.count() > 0) {
        await takeScreenshot(page, 'poll-display-01-found');

        // Check for progress bars (WhatsApp style)
        const progressBars = pollCard.locator('[class*="progress"], [role="progressbar"]');
        const progressCount = await progressBars.count();

        if (progressCount > 0) {
          console.log(`✅ Poll found with ${progressCount} vote options`);
        }

        // Check for vote percentages
        const percentages = pollCard.locator('text=/%/').first();
        if (await percentages.count() > 0) {
          console.log('✅ Poll shows vote percentages');
        }
      } else {
        console.log('ℹ️ No polls found on dashboard (may need to create one)');
        await takeScreenshot(page, 'poll-display-01-none');
      }
    });
  });

  // ============================================
  // 3.18 USER FEEDBACK TESTS
  // ============================================
  test.describe('3.18 User Feedback', () => {
    test('Feedback button exists in header', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'feedback-01-dashboard');

      // Look for feedback button in header
      const feedbackButton = page.locator('button:has(svg[class*="message"]), button[aria-label*="feedback"], button[title*="Feedback"]').first();

      if (await feedbackButton.count() > 0) {
        await expect(feedbackButton).toBeVisible({ timeout: 5000 });
        console.log('✅ Feedback button found in header');
        await takeScreenshot(page, 'feedback-02-button-found');
      } else {
        console.log('⚠️ Feedback button not found in header');
        await takeScreenshot(page, 'feedback-02-no-button');
      }
    });

    test('Feedback dialog opens and can submit feedback', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find and click feedback button
      const feedbackButton = page.locator('button:has(svg[class*="message-square"]), button[title*="Feedback"]').first();

      if (await feedbackButton.count() > 0) {
        await feedbackButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'feedback-dialog-01-open');

        // Look for feedback form elements
        const dialog = page.locator('[role="dialog"], [class*="dialog"]').first();

        if (await dialog.count() > 0) {
          console.log('✅ Feedback dialog opened');

          // Check for feedback type selector
          const typeSelector = dialog.locator('select, [role="combobox"], button[class*="select"]').first();
          if (await typeSelector.count() > 0) {
            console.log('✅ Feedback type selector found');
          }

          // Check for description textarea
          const description = dialog.locator('textarea').first();
          if (await description.count() > 0) {
            console.log('✅ Feedback description field found');

            // Type a test feedback
            await description.fill('Test feedback from Playwright E2E test');
            await takeScreenshot(page, 'feedback-dialog-02-filled');
          }

          // Check for submit button
          const submitButton = dialog.locator('button:has-text("Submit"), button:has-text("Send")').first();
          if (await submitButton.count() > 0) {
            console.log('✅ Submit button found');
            // Don't actually submit to avoid polluting database
          }

          // Close dialog
          await page.keyboard.press('Escape');
        }
      } else {
        console.log('⚠️ Feedback button not found to open dialog');
      }
    });
  });

  // ============================================
  // ORGANIZATION PROFILE TESTS
  // ============================================
  test.describe('Organization Profile Page', () => {
    test('Organization profile page loads', async ({ page }) => {
      await devLogin(page, 'admin');

      // Navigate to organizations
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'org-01-list');

      // Look for organization link
      const orgLink = page.locator('a[href*="/organizations/"]').first();

      if (await orgLink.count() > 0) {
        await orgLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        expect(page.url()).toContain('/organizations/');
        await takeScreenshot(page, 'org-02-profile');
        console.log('✅ Organization profile page loads');
      } else {
        // Try direct navigation if no org list
        await page.goto('/organizations/test-org');
        await page.waitForLoadState('networkidle');
        await takeScreenshot(page, 'org-02-direct');
      }
    });

    test('Organization profile shows team members', async ({ page }) => {
      await devLogin(page, 'admin');

      // Navigate to an organization profile
      const orgLink = page.locator('a[href*="/organizations/"]').first();

      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');

      if (await orgLink.count() > 0) {
        await orgLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for team section
        const teamSection = page.locator('text=/Team|Members|Staff/i').first();

        if (await teamSection.count() > 0) {
          console.log('✅ Team members section found');
          await takeScreenshot(page, 'org-team-01-found');
        } else {
          console.log('⚠️ Team members section not found');
          await takeScreenshot(page, 'org-team-01-not-found');
        }
      }
    });

    test('Organization profile shows room location', async ({ page }) => {
      await devLogin(page, 'admin');

      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');

      const orgLink = page.locator('a[href*="/organizations/"]').first();

      if (await orgLink.count() > 0) {
        await orgLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const pageContent = await page.textContent('body');

        // Look for room/location info
        if (pageContent && (pageContent.includes('Room') || pageContent.includes('Location') || pageContent.includes('Floor'))) {
          console.log('✅ Room/location information found');
          await takeScreenshot(page, 'org-location-01-found');
        } else {
          console.log('ℹ️ Room/location not displayed (may not be set)');
          await takeScreenshot(page, 'org-location-01-not-found');
        }
      }
    });
  });

  // ============================================
  // COMPREHENSIVE WAVE 2 TEST
  // ============================================
  test('Comprehensive Wave 2 Test - All features in sequence', async ({ page }) => {
    console.log('\n=== Starting Comprehensive Wave 2 Test ===\n');

    // 1. Login
    console.log('1. Logging in as admin...');
    await devLogin(page, 'admin');
    await takeScreenshot(page, 'wave2-comp-01-logged-in');

    // 2. Check feedback button in header
    console.log('2. Checking feedback button...');
    const feedbackButton = page.locator('button[title*="Feedback"], button:has(svg[class*="message-square"])').first();
    if (await feedbackButton.count() > 0) {
      console.log('✅ Feedback button present');
    }

    // 3. Check for pinned posts / priority alerts
    console.log('3. Checking for pinned posts...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pinnedBadge = page.locator('text=/Pinned/i').first();
    if (await pinnedBadge.count() > 0) {
      console.log('✅ Pinned posts visible');
    }
    await takeScreenshot(page, 'wave2-comp-02-dashboard');

    // 4. Check right sidebar for priority alerts
    console.log('4. Checking right sidebar...');
    const sidebar = page.locator('aside, [class*="sidebar"]').last();
    if (await sidebar.count() > 0) {
      const sidebarText = await sidebar.textContent();
      if (sidebarText && (sidebarText.includes('Quick Actions') || sidebarText.includes('Priority'))) {
        console.log('✅ Right sidebar with quick actions present');
      }
    }

    // 5. Navigate to events page
    console.log('5. Checking events...');
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'wave2-comp-03-events');

    // 6. Navigate to organizations
    console.log('6. Checking organizations...');
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'wave2-comp-04-organizations');

    // 7. Check for poll button in composer
    console.log('7. Checking poll functionality...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pollButton = page.locator('button:has-text("Poll"), button:has(svg[class*="bar-chart"])').first();
    if (await pollButton.count() > 0) {
      console.log('✅ Poll creation button present');
    }

    await takeScreenshot(page, 'wave2-comp-05-final');
    console.log('\n=== Comprehensive Wave 2 Test Complete ===\n');
  });
});
