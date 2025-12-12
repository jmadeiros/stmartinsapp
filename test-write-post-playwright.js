const { chromium } = require('playwright');

async function testWritePost() {
  console.log('🚀 Starting Playwright test for writing a post...\n');

  let browser;
  let context;
  let page;
  let success = false;
  let errorMessage = null;

  try {
    // Launch Chrome browser in headed mode (visible)
    console.log('🌐 Launching Chrome browser...');
    browser = await chromium.launch({
      headless: false,
      channel: 'chrome', // Use Chrome specifically
      slowMo: 300 // Slow down operations to see what's happening
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page = await context.newPage();

    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page...');
    const baseUrl = 'http://localhost:3000';
    
    await page.goto(`${baseUrl}/login`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.screenshot({ path: 'test-screenshots/01-login-page.png', fullPage: true });
    console.log('✅ Login page loaded');

    // Step 2: Click Development Login button
    console.log('📍 Step 2: Clicking Dev Login button...');
    // Try multiple selectors for the dev login button
    const devLoginButton = page.getByRole('button', { name: /dev login/i }).or(
      page.getByRole('button', { name: /test mode/i })
    ).or(
      page.locator('button:has-text("Dev Login")')
    );
    
    await devLoginButton.waitFor({ state: 'visible', timeout: 15000 });
    await devLoginButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await devLoginButton.click();
    console.log('✅ Dev Login clicked');

    // Step 3: Wait for redirect to dashboard
    console.log('📍 Step 3: Waiting for redirect to dashboard...');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any animations
    await page.screenshot({ path: 'test-screenshots/02-dashboard-loaded.png', fullPage: true });
    console.log('✅ Successfully redirected to dashboard');

    // Step 4: Find and interact with the post creation textarea
    console.log('📍 Step 4: Looking for post creation textarea...');
    
    // Try multiple selectors for the textarea
    const textareaSelectors = [
      'textarea[placeholder*="Share an update"]',
      'textarea[placeholder*="Share"]',
      'textarea',
    ];

    let textarea = null;
    for (const selector of textareaSelectors) {
      try {
        textarea = page.locator(selector).first();
        await textarea.waitFor({ state: 'visible', timeout: 5000 });
        console.log(`✅ Found textarea with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`⚠️  Selector "${selector}" not found, trying next...`);
      }
    }

    if (!textarea) {
      throw new Error('Post creation textarea not found on the page');
    }

    await textarea.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/03-textarea-found.png', fullPage: true });

    // Step 5: Click on textarea to focus it
    console.log('📍 Step 5: Focusing textarea...');
    await textarea.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/04-textarea-focused.png', fullPage: true });
    console.log('✅ Textarea focused');

    // Step 6: Type a test message
    const timestamp = new Date().toISOString();
    const testMessage = `Test post from Playwright Chrome - ${timestamp}`;
    console.log(`📍 Step 6: Typing test message: "${testMessage}"`);
    
    await textarea.fill(testMessage);
    await page.waitForTimeout(1000); // Wait for any UI updates
    await page.screenshot({ path: 'test-screenshots/05-message-typed.png', fullPage: true });
    console.log('✅ Message typed');

    // Step 7: Verify the Post button is enabled
    console.log('📍 Step 7: Looking for Post button...');
    
    // Try multiple selectors for the Post button
    const postButtonSelectors = [
      page.getByRole('button', { name: /^post$/i }),
      page.locator('button:has-text("Post")'),
      page.locator('button').filter({ hasText: /post/i }),
    ];

    let postButton = null;
    for (const buttonLocator of postButtonSelectors) {
      try {
        const buttons = await buttonLocator.all();
        for (const btn of buttons) {
          const isVisible = await btn.isVisible();
          const isEnabled = await btn.isEnabled();
          if (isVisible && isEnabled) {
            postButton = btn;
            console.log('✅ Found enabled Post button');
            break;
          }
        }
        if (postButton) break;
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!postButton) {
      // Take a screenshot to debug
      await page.screenshot({ path: 'test-screenshots/05b-post-button-not-found.png', fullPage: true });
      throw new Error('Post button not found or not enabled');
    }

    await postButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/06-post-button-ready.png', fullPage: true });

    // Step 8: Click the Post button
    console.log('📍 Step 8: Clicking Post button...');
    await postButton.click();
    console.log('✅ Post button clicked');

    // Step 9: Wait for post submission to complete
    console.log('📍 Step 9: Waiting for post submission...');
    
    // Wait for the textarea to be cleared (indicating successful submission)
    await page.waitForFunction(
      (selector) => {
        const textarea = document.querySelector(selector);
        return textarea && textarea.value === '';
      },
      textareaSelectors[0],
      { timeout: 10000 }
    ).catch(() => {
      console.log('⚠️  Textarea not cleared immediately, continuing...');
    });

    await page.waitForTimeout(3000); // Wait for any async operations
    await page.screenshot({ path: 'test-screenshots/07-after-post-submit.png', fullPage: true });
    console.log('✅ Post submission completed');

    // Step 10: Refresh the page to verify post appears
    console.log('📍 Step 10: Refreshing page to verify post appears...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/08-after-refresh.png', fullPage: true });
    console.log('✅ Page refreshed');

    // Step 11: Check if the post appears in the feed
    console.log('📍 Step 11: Searching for the new post in the feed...');
    
    // Try to find the post content
    const postContentLocator = page.locator(`text="${testMessage}"`).first();
    
    try {
      await postContentLocator.waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ SUCCESS: Post found in the feed!');
      await postContentLocator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-screenshots/09-post-found-in-feed.png', fullPage: true });
      success = true;
    } catch (e) {
      // Try alternative search - maybe the text is split across elements
      const pageContent = await page.content();
      if (pageContent.includes(testMessage)) {
        console.log('✅ SUCCESS: Post content found in page HTML!');
        await page.screenshot({ path: 'test-screenshots/09-post-found-in-feed.png', fullPage: true });
        success = true;
      } else {
        throw new Error('Post not found in the feed after refresh. Post may not have been created successfully.');
      }
    }

    // Keep browser open for a few seconds to see the result
    console.log('📍 Waiting 5 seconds before closing browser...');
    await page.waitForTimeout(5000);

  } catch (error) {
    errorMessage = error.message;
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);

    if (page) {
      try {
        await page.screenshot({ path: 'test-screenshots/error-screenshot.png', fullPage: true });
        console.log('📸 Error screenshot saved');
      } catch (screenshotError) {
        console.error('Could not save error screenshot:', screenshotError.message);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    if (errorMessage) {
      console.log(`Error: ${errorMessage}`);
    }
    console.log('Screenshots saved to: test-screenshots/');
    console.log('='.repeat(60));

    process.exit(success ? 0 : 1);
  }
}

// Run the test
testWritePost().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

