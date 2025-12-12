import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';

/**
 * Detect if dev server is already running and on which port
 */
function detectDevServerPort(): number | null {
  try {
    // Check common Next.js dev ports
    const ports = [3000, 3001, 3002];
    for (const port of ports) {
      try {
        const result = execSync(`lsof -ti:${port}`, { encoding: 'utf-8', stdio: 'pipe' });
        if (result.trim()) {
          // Verify it's actually responding
          try {
            execSync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`, { encoding: 'utf-8', stdio: 'pipe' });
            console.log(`[Playwright] Detected dev server running on port ${port}`);
            return port;
          } catch {
            // Port is in use but not responding, skip it
          }
        }
      } catch {
        // Port not in use, continue checking
      }
    }
  } catch (error) {
    // If detection fails, fall back to default
  }
  return null;
}

const detectedPort = detectDevServerPort();
const defaultPort = 3000;
const serverPort = detectedPort || defaultPort;
const serverUrl = `http://localhost:${serverPort}`;

console.log(`[Playwright] Using dev server at ${serverUrl}${detectedPort ? ' (detected)' : ' (will start if needed)'}`);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || serverUrl,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /* Run tests in headless mode */
    headless: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true, // Force headless mode - no browser window
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  // Only start server if not already detected and PLAYWRIGHT_BASE_URL not set
  ...(!detectedPort && !process.env.PLAYWRIGHT_BASE_URL ? {
    webServer: {
      command: `npm run dev -- --port ${defaultPort}`,
      url: `http://localhost:${defaultPort}`,
      reuseExistingServer: true,
      timeout: 120 * 1000, // 2 minutes - Next.js can be slow to start
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'development', // Ensure dev mode for dev-login route
      },
    },
  } : {}),
});
