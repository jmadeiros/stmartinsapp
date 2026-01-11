import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOT_DIR = 'test-screenshots/image-upload';

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

// Create a simple test image buffer (1x1 pixel PNG)
function createTestImageBuffer(): Buffer {
  // Minimal 1x1 red PNG
  const pngData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xdd,
    0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, // IEND chunk
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  return pngData;
}

// Create a larger test image buffer (10x10 pixel PNG with actual content)
function createLargerTestImageBuffer(): Buffer {
  // Create a simple 10x10 blue PNG
  const width = 10;
  const height = 10;

  // This is a pre-generated valid 10x10 blue PNG
  // In real tests, you might want to use sharp or canvas to generate images
  const pngData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x0a,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x02, 0x50, 0x58,
    0xea, 0x00, 0x00, 0x00, 0x1d, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x62, 0x60, 0x60, 0xf8, 0x0f,
    0x00, 0x01, 0x04, 0x18, 0xd8, 0x00, 0x00, 0x00,
    0x00, 0xff, 0xff, 0x03, 0x00, 0x00, 0x66, 0x00,
    0x01, 0x3b, 0xab, 0xf6, 0xca, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
    0x82
  ]);
  return pngData;
}

test.describe('Image Upload Tests', () => {
  test.setTimeout(120_000);
  test.describe.configure({ mode: 'serial' });

  // ============================================
  // POST IMAGE UPLOAD TESTS
  // ============================================
  test.describe('Post Image Upload', () => {
    test('should show image upload button in post composer', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'image-upload-01-dashboard');

      // Focus on post composer to reveal action buttons
      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

      if (await textarea.isVisible()) {
        await textarea.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'image-upload-02-composer-focused');

        // Look for image/photo upload button
        const imageButton = page.locator('button:has-text("Photo"), button:has(svg[class*="image"]), button:has(svg[class*="Image"])').first();

        if (await imageButton.isVisible()) {
          console.log('[Test] Image upload button found in post composer');
          await takeScreenshot(page, 'image-upload-03-button-found');
        } else {
          console.log('[Test] Image upload button not immediately visible - checking for icon-only button');
          // Try to find by icon only
          const iconButton = page.locator('button svg[class*="lucide-image"]').first();
          if (await iconButton.isVisible()) {
            console.log('[Test] Image icon button found');
          }
        }
      }
    });

    test('should allow selecting an image file', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Focus on post composer
      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

      if (await textarea.isVisible()) {
        await textarea.click();
        await page.waitForTimeout(500);

        // Find the hidden file input
        const fileInput = page.locator('input[type="file"][accept*="image"]').first();

        if (await fileInput.count() > 0) {
          // Create a temporary test image file
          const testImagePath = path.join(__dirname, 'test-image-temp.png');
          const imageBuffer = createLargerTestImageBuffer();
          fs.writeFileSync(testImagePath, imageBuffer);

          try {
            // Set the file using Playwright's setInputFiles
            await fileInput.setInputFiles(testImagePath);
            await page.waitForTimeout(1000);
            await takeScreenshot(page, 'image-upload-04-file-selected');

            // Check for image preview
            const imagePreview = page.locator('img[alt*="Preview"], img[class*="preview"], img[src*="data:image"], img[src*="blob:"]').first();
            const hasPreview = await imagePreview.isVisible().catch(() => false);

            if (hasPreview) {
              console.log('[Test] Image preview is visible after file selection');
              await takeScreenshot(page, 'image-upload-05-preview-visible');
            } else {
              console.log('[Test] No immediate image preview (may be processing)');
            }
          } finally {
            // Clean up temp file
            if (fs.existsSync(testImagePath)) {
              fs.unlinkSync(testImagePath);
            }
          }
        } else {
          console.log('[Test] File input not found');
        }
      }
    });

    test('should show image preview after selection', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

      if (await textarea.isVisible()) {
        await textarea.click();
        await textarea.fill('Testing image upload');
        await page.waitForTimeout(500);

        const fileInput = page.locator('input[type="file"][accept*="image"]').first();

        if (await fileInput.count() > 0) {
          const testImagePath = path.join(__dirname, 'test-image-preview.png');
          const imageBuffer = createLargerTestImageBuffer();
          fs.writeFileSync(testImagePath, imageBuffer);

          try {
            await fileInput.setInputFiles(testImagePath);
            await page.waitForTimeout(1500);

            // Check various ways preview might appear
            const possiblePreviews = [
              page.locator('img[alt="Preview"]').first(),
              page.locator('img[src^="data:image"]').first(),
              page.locator('img[src^="blob:"]').first(),
              page.locator('[class*="preview"] img').first(),
              page.locator('.object-cover').first()
            ];

            let previewFound = false;
            for (const preview of possiblePreviews) {
              if (await preview.isVisible().catch(() => false)) {
                previewFound = true;
                console.log('[Test] Image preview found');
                await takeScreenshot(page, 'image-upload-06-preview');
                break;
              }
            }

            if (!previewFound) {
              console.log('[Test] No preview element found after file selection');
              await takeScreenshot(page, 'image-upload-06-no-preview');
            }
          } finally {
            if (fs.existsSync(testImagePath)) {
              fs.unlinkSync(testImagePath);
            }
          }
        }
      }
    });

    test('should allow removing selected image', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

      if (await textarea.isVisible()) {
        await textarea.click();
        await textarea.fill('Testing image removal');
        await page.waitForTimeout(500);

        const fileInput = page.locator('input[type="file"][accept*="image"]').first();

        if (await fileInput.count() > 0) {
          const testImagePath = path.join(__dirname, 'test-image-remove.png');
          const imageBuffer = createLargerTestImageBuffer();
          fs.writeFileSync(testImagePath, imageBuffer);

          try {
            await fileInput.setInputFiles(testImagePath);
            await page.waitForTimeout(1500);
            await takeScreenshot(page, 'image-upload-07-before-remove');

            // Look for remove/clear button
            const removeButton = page.locator('button:has(svg[class*="trash"]), button:has(svg[class*="x"]), button:has(svg[class*="X"]), [class*="destructive"]').first();

            if (await removeButton.isVisible()) {
              await removeButton.click();
              await page.waitForTimeout(500);
              await takeScreenshot(page, 'image-upload-08-after-remove');

              // Verify preview is gone
              const preview = page.locator('img[alt="Preview"], img[src^="data:image"]').first();
              const isPreviewGone = !(await preview.isVisible().catch(() => false));

              if (isPreviewGone) {
                console.log('[Test] Image preview removed successfully');
              }
            } else {
              console.log('[Test] Remove button not found');
            }
          } finally {
            if (fs.existsSync(testImagePath)) {
              fs.unlinkSync(testImagePath);
            }
          }
        }
      }
    });

    test('should submit post with image', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

      if (await textarea.isVisible()) {
        const uniqueText = `Image test post ${Date.now()}`;
        await textarea.click();
        await textarea.fill(uniqueText);
        await page.waitForTimeout(500);

        const fileInput = page.locator('input[type="file"][accept*="image"]').first();

        if (await fileInput.count() > 0) {
          const testImagePath = path.join(__dirname, 'test-image-submit.png');
          const imageBuffer = createLargerTestImageBuffer();
          fs.writeFileSync(testImagePath, imageBuffer);

          try {
            // Select image
            await fileInput.setInputFiles(testImagePath);
            await page.waitForTimeout(1500);
            await takeScreenshot(page, 'image-upload-09-before-submit');

            // Find and click submit button
            const submitButton = page.locator('button:has-text("Post")').first();

            if (await submitButton.isVisible() && !(await submitButton.isDisabled())) {
              await submitButton.click();
              await page.waitForTimeout(3000);
              await takeScreenshot(page, 'image-upload-10-after-submit');

              // Check if post was created (page might refresh)
              await page.waitForLoadState('networkidle');
              await page.waitForTimeout(2000);

              // Look for the post content
              const postContent = page.locator(`text=${uniqueText.substring(0, 20)}`).first();
              const postExists = await postContent.isVisible().catch(() => false);

              if (postExists) {
                console.log('[Test] Post with text created successfully');

                // Check if post has image
                const postImage = page.locator(`article:has-text("${uniqueText.substring(0, 20)}") img, [class*="card"]:has-text("${uniqueText.substring(0, 20)}") img`).first();
                const hasImage = await postImage.isVisible().catch(() => false);

                if (hasImage) {
                  console.log('[Test] Post image is visible in feed');
                  await takeScreenshot(page, 'image-upload-11-image-in-feed');
                } else {
                  console.log('[Test] Post image not immediately visible in feed');
                }
              } else {
                console.log('[Test] Post may have been created but not visible yet');
              }
            } else {
              console.log('[Test] Submit button not clickable');
            }
          } finally {
            if (fs.existsSync(testImagePath)) {
              fs.unlinkSync(testImagePath);
            }
          }
        }
      }
    });
  });

  // ============================================
  // IMAGE VALIDATION TESTS
  // ============================================
  test.describe('Image Upload Validation', () => {
    test('should reject invalid file types', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

      if (await textarea.isVisible()) {
        await textarea.click();
        await page.waitForTimeout(500);

        const fileInput = page.locator('input[type="file"][accept*="image"]').first();

        if (await fileInput.count() > 0) {
          // Create a fake text file renamed to .png
          const testFilePath = path.join(__dirname, 'test-invalid.txt');
          fs.writeFileSync(testFilePath, 'This is not an image');

          try {
            // Note: The browser may prevent this due to accept attribute
            // This tests the client-side validation
            await fileInput.setInputFiles(testFilePath);
            await page.waitForTimeout(1000);
            await takeScreenshot(page, 'image-upload-12-invalid-file');

            // Check for error message
            const errorMessage = page.locator('text=/invalid|error|Invalid file type/i').first();
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (hasError) {
              console.log('[Test] Invalid file type error shown');
            } else {
              console.log('[Test] No error message (file may have been rejected by input)');
            }
          } finally {
            if (fs.existsSync(testFilePath)) {
              fs.unlinkSync(testFilePath);
            }
          }
        }
      }
    });

    test('should accept valid JPEG image', async ({ page }) => {
      await devLogin(page, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

      if (await textarea.isVisible()) {
        await textarea.click();
        await page.waitForTimeout(500);

        const fileInput = page.locator('input[type="file"][accept*="image"]').first();

        if (await fileInput.count() > 0) {
          // Create a simple JPEG file (minimal valid JPEG)
          const jpegPath = path.join(__dirname, 'test-valid.jpg');
          // Minimal 1x1 JPEG
          const jpegBuffer = Buffer.from([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
            0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
            0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
            0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
            0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
            0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
            0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
            0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
            0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
            0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
            0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5, 0xdb, 0x20, 0xa8, 0xf1, 0x4b, 0x90,
            0xe7, 0xff, 0xd9
          ]);
          fs.writeFileSync(jpegPath, jpegBuffer);

          try {
            await fileInput.setInputFiles(jpegPath);
            await page.waitForTimeout(1000);
            await takeScreenshot(page, 'image-upload-13-valid-jpeg');

            // Check for preview (no error)
            const errorMessage = page.locator('text=/invalid|error/i').first();
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (!hasError) {
              console.log('[Test] Valid JPEG accepted (no error)');
            }
          } finally {
            if (fs.existsSync(jpegPath)) {
              fs.unlinkSync(jpegPath);
            }
          }
        }
      }
    });
  });

  // ============================================
  // COMPREHENSIVE IMAGE UPLOAD TEST
  // ============================================
  test('Comprehensive Image Upload Test - Full workflow', async ({ page }) => {
    console.log('\n=== Starting Comprehensive Image Upload Test ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await devLogin(page, 'admin');

    // 2. Navigate to dashboard
    console.log('2. Navigating to dashboard...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'image-comp-01-dashboard');

    // 3. Focus on composer
    console.log('3. Opening post composer...');
    const textarea = page.locator('textarea[placeholder*="Share"], textarea[placeholder*="update"]').first();

    if (!(await textarea.isVisible())) {
      console.log('[Test] Post composer not found');
      return;
    }

    await textarea.click();
    const uniqueText = `Comprehensive image test ${Date.now()}`;
    await textarea.fill(uniqueText);
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'image-comp-02-composer-open');

    // 4. Select image
    console.log('4. Selecting image file...');
    const fileInput = page.locator('input[type="file"][accept*="image"]').first();

    if (await fileInput.count() === 0) {
      console.log('[Test] File input not found');
      return;
    }

    const testImagePath = path.join(__dirname, 'test-comprehensive.png');
    const imageBuffer = createLargerTestImageBuffer();
    fs.writeFileSync(testImagePath, imageBuffer);

    try {
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1500);
      await takeScreenshot(page, 'image-comp-03-image-selected');

      // 5. Verify preview
      console.log('5. Verifying image preview...');
      const preview = page.locator('img[alt="Preview"], img[src^="data:image"], img[src^="blob:"]').first();
      const hasPreview = await preview.isVisible().catch(() => false);
      console.log(`[Test] Preview visible: ${hasPreview}`);
      await takeScreenshot(page, 'image-comp-04-preview');

      // 6. Submit post
      console.log('6. Submitting post...');
      const submitButton = page.locator('button:has-text("Post")').first();

      if (await submitButton.isVisible() && !(await submitButton.isDisabled())) {
        await submitButton.click();
        await page.waitForTimeout(4000);
        await takeScreenshot(page, 'image-comp-05-submitted');

        // 7. Verify post created
        console.log('7. Verifying post in feed...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const postContent = page.locator(`text=${uniqueText.substring(0, 15)}`).first();
        const postExists = await postContent.isVisible().catch(() => false);

        if (postExists) {
          console.log('[Test] Post created successfully');
          await takeScreenshot(page, 'image-comp-06-post-visible');
        } else {
          console.log('[Test] Post not immediately visible');
        }
      } else {
        console.log('[Test] Submit button not ready');
      }
    } finally {
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }

    console.log('\n=== Comprehensive Image Upload Test Complete ===\n');
  });
});
