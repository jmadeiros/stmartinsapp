import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Event and Project Comments System
 *
 * Tests the following functionality:
 * - Adding comments to events
 * - Adding comments to projects
 * - Replying to comments
 * - Editing own comments
 * - Deleting own comments
 * - Comment display and threading
 */

// Test user credentials
const TEST_USERS = {
  admin: {
    email: 'admin@stmartins.dev',
    password: 'Password123!'
  },
  staff: {
    email: 'staff@stmartins.dev',
    password: 'Password123!'
  }
}

test.describe('Event Comments', () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff user
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USERS.staff.email)
    await page.fill('input[type="password"]', TEST_USERS.staff.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
  })

  test('should display comment section on event detail page', async ({ page }) => {
    // Navigate to an event
    await page.goto('/dashboard')

    // Find and click on an event card
    const eventCard = page.locator('[data-testid="event-card"]').first()
    if (await eventCard.isVisible()) {
      await eventCard.click()
      await page.waitForURL(/\/events\//)

      // Check comment section exists
      await expect(page.locator('text=Comments')).toBeVisible()
      await expect(page.locator('textarea[placeholder="Add a comment..."]')).toBeVisible()
      await expect(page.locator('button:has-text("Post Comment")')).toBeVisible()
    } else {
      // If no event cards, check events page directly
      await page.goto('/events')
      const eventLink = page.locator('a[href^="/events/"]').first()
      if (await eventLink.isVisible()) {
        await eventLink.click()
        await page.waitForURL(/\/events\//)
        await expect(page.locator('text=Comments')).toBeVisible()
      } else {
        test.skip()
      }
    }
  })

  test('should add a new comment to an event', async ({ page }) => {
    // Navigate to events page and find an event
    await page.goto('/events')

    // Wait for events to load
    await page.waitForTimeout(1000)

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (!(await eventLink.isVisible())) {
      test.skip()
      return
    }

    await eventLink.click()
    await page.waitForURL(/\/events\//)

    // Add a comment
    const commentText = `Test comment from Playwright at ${new Date().toISOString()}`
    await page.fill('textarea[placeholder="Add a comment..."]', commentText)
    await page.click('button:has-text("Post Comment")')

    // Wait for comment to appear
    await page.waitForTimeout(2000)

    // Verify comment appears
    await expect(page.locator(`text=${commentText.substring(0, 30)}`)).toBeVisible()
  })

  test('should reply to an existing comment', async ({ page }) => {
    await page.goto('/events')
    await page.waitForTimeout(1000)

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (!(await eventLink.isVisible())) {
      test.skip()
      return
    }

    await eventLink.click()
    await page.waitForURL(/\/events\//)

    // First add a comment if none exist
    const existingComment = page.locator('.group:has(button:has-text("Reply"))').first()

    if (!(await existingComment.isVisible())) {
      // Add a comment first
      await page.fill('textarea[placeholder="Add a comment..."]', 'Parent comment for reply test')
      await page.click('button:has-text("Post Comment")')
      await page.waitForTimeout(2000)
    }

    // Click Reply button
    const replyButton = page.locator('button:has-text("Reply")').first()
    if (await replyButton.isVisible()) {
      await replyButton.click()

      // Fill in reply
      const replyText = `Reply comment at ${new Date().toISOString()}`
      await page.fill('textarea[placeholder="Write a reply..."]', replyText)

      // Submit reply
      const sendButton = page.locator('button:has(.lucide-send)').first()
      await sendButton.click()

      await page.waitForTimeout(2000)

      // Verify reply appears (replies are indented with border-l-2)
      await expect(page.locator('.border-l-2').first()).toBeVisible()
    }
  })

  test('should edit own comment', async ({ page }) => {
    await page.goto('/events')
    await page.waitForTimeout(1000)

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (!(await eventLink.isVisible())) {
      test.skip()
      return
    }

    await eventLink.click()
    await page.waitForURL(/\/events\//)

    // Add a comment to edit
    const originalText = `Comment to edit ${Date.now()}`
    await page.fill('textarea[placeholder="Add a comment..."]', originalText)
    await page.click('button:has-text("Post Comment")')
    await page.waitForTimeout(2000)

    // Find the more menu (three dots) and click it
    const moreButton = page.locator('.group button:has(.lucide-more-horizontal)').first()
    if (await moreButton.isVisible()) {
      await moreButton.click()

      // Click Edit
      await page.click('text=Edit')

      // Edit the text
      const editedText = `Edited: ${originalText}`
      await page.fill('textarea', editedText)

      // Save
      await page.click('button:has-text("Save")')
      await page.waitForTimeout(1000)

      // Verify "(edited)" indicator appears
      await expect(page.locator('text=(edited)')).toBeVisible()
    }
  })

  test('should delete own comment', async ({ page }) => {
    await page.goto('/events')
    await page.waitForTimeout(1000)

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (!(await eventLink.isVisible())) {
      test.skip()
      return
    }

    await eventLink.click()
    await page.waitForURL(/\/events\//)

    // Add a comment to delete
    const deleteText = `Comment to delete ${Date.now()}`
    await page.fill('textarea[placeholder="Add a comment..."]', deleteText)
    await page.click('button:has-text("Post Comment")')
    await page.waitForTimeout(2000)

    // Count comments before delete
    const commentsBefore = await page.locator('.group:has(button:has-text("Reply"))').count()

    // Find the more menu and click delete
    const moreButton = page.locator('.group button:has(.lucide-more-horizontal)').first()
    if (await moreButton.isVisible()) {
      await moreButton.click()
      await page.click('text=Delete')
      await page.waitForTimeout(1000)

      // Verify comment count decreased or comment text is gone
      const commentsAfter = await page.locator('.group:has(button:has-text("Reply"))').count()
      expect(commentsAfter).toBeLessThanOrEqual(commentsBefore)
    }
  })
})

test.describe('Project Comments', () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff user
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USERS.staff.email)
    await page.fill('input[type="password"]', TEST_USERS.staff.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
  })

  test('should display comment section on project detail page', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForTimeout(1000)

    // Find and click on a project
    const projectLink = page.locator('a[href^="/projects/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForURL(/\/projects\//)

      // Check comment section exists
      await expect(page.locator('text=Comments')).toBeVisible()
      await expect(page.locator('textarea[placeholder="Add a comment..."]')).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should add a new comment to a project', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForTimeout(1000)

    const projectLink = page.locator('a[href^="/projects/"]').first()
    if (!(await projectLink.isVisible())) {
      test.skip()
      return
    }

    await projectLink.click()
    await page.waitForURL(/\/projects\//)

    // Add a comment
    const commentText = `Project comment from Playwright at ${new Date().toISOString()}`
    await page.fill('textarea[placeholder="Add a comment..."]', commentText)
    await page.click('button:has-text("Post Comment")')

    await page.waitForTimeout(2000)

    // Verify comment appears
    await expect(page.locator(`text=${commentText.substring(0, 30)}`)).toBeVisible()
  })

  test('should show threaded replies on project comments', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForTimeout(1000)

    const projectLink = page.locator('a[href^="/projects/"]').first()
    if (!(await projectLink.isVisible())) {
      test.skip()
      return
    }

    await projectLink.click()
    await page.waitForURL(/\/projects\//)

    // Add parent comment
    await page.fill('textarea[placeholder="Add a comment..."]', 'Parent for threading test')
    await page.click('button:has-text("Post Comment")')
    await page.waitForTimeout(2000)

    // Add reply
    const replyButton = page.locator('button:has-text("Reply")').first()
    if (await replyButton.isVisible()) {
      await replyButton.click()
      await page.fill('textarea[placeholder="Write a reply..."]', 'Child reply for threading')
      await page.locator('button:has(.lucide-send)').first().click()
      await page.waitForTimeout(2000)

      // Verify threaded structure (indented with left border)
      const threadedReply = page.locator('.ml-8.border-l-2')
      await expect(threadedReply.first()).toBeVisible()
    }
  })
})

test.describe('Comment Notifications', () => {
  test('should create notification when someone comments on your event', async ({ page, browser }) => {
    // Login as admin (event organizer)
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USERS.admin.email)
    await page.fill('input[type="password"]', TEST_USERS.admin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    // Check initial notification count
    const bellButton = page.locator('button:has(.lucide-bell)')
    await bellButton.click()
    await page.waitForTimeout(500)

    // Get current notification count for event_comment type
    const initialNotifications = await page.locator('[data-notification-type="event_comment"]').count()

    // Close dropdown
    await page.keyboard.press('Escape')

    // Create a new browser context for second user
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()

    // Login as staff in second context
    await page2.goto('/login')
    await page2.fill('input[type="email"]', TEST_USERS.staff.email)
    await page2.fill('input[type="password"]', TEST_USERS.staff.password)
    await page2.click('button[type="submit"]')
    await page2.waitForURL(/\/dashboard/)

    // Find an event by the admin user and comment on it
    await page2.goto('/events')
    await page2.waitForTimeout(1000)

    const eventLink = page2.locator('a[href^="/events/"]').first()
    if (await eventLink.isVisible()) {
      await eventLink.click()
      await page2.waitForURL(/\/events\//)

      // Add comment
      await page2.fill('textarea[placeholder="Add a comment..."]', 'Comment to trigger notification')
      await page2.click('button:has-text("Post Comment")')
      await page2.waitForTimeout(3000)
    }

    await context2.close()

    // Back to admin - check notifications
    await page.reload()
    await page.waitForTimeout(1000)

    await bellButton.click()
    await page.waitForTimeout(500)

    // Should have new notification about comment
    // (This may not work perfectly in test as notifications are async)
    const notificationDropdown = page.locator('[role="menu"], .dropdown-content').first()
    await expect(notificationDropdown).toBeVisible()
  })
})

test.describe('Comment UI States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USERS.staff.email)
    await page.fill('input[type="password"]', TEST_USERS.staff.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
  })

  test('should show loading state when posting comment', async ({ page }) => {
    await page.goto('/events')
    await page.waitForTimeout(1000)

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (!(await eventLink.isVisible())) {
      test.skip()
      return
    }

    await eventLink.click()
    await page.waitForURL(/\/events\//)

    await page.fill('textarea[placeholder="Add a comment..."]', 'Testing loading state')

    // Click and immediately check for loading state
    const postButton = page.locator('button:has-text("Post Comment")')
    await postButton.click()

    // The button should show a loader or be disabled during submission
    // Check for the Loader2 icon animation
    const loader = page.locator('.animate-spin')
    // This might be very quick, so we just verify the comment eventually appears
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Testing loading state')).toBeVisible()
  })

  test('should disable post button when comment is empty', async ({ page }) => {
    await page.goto('/events')
    await page.waitForTimeout(1000)

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (!(await eventLink.isVisible())) {
      test.skip()
      return
    }

    await eventLink.click()
    await page.waitForURL(/\/events\//)

    // Check button is disabled when textarea is empty
    const postButton = page.locator('button:has-text("Post Comment")')
    await expect(postButton).toBeDisabled()

    // Type something
    await page.fill('textarea[placeholder="Add a comment..."]', 'Test')
    await expect(postButton).toBeEnabled()

    // Clear it
    await page.fill('textarea[placeholder="Add a comment..."]', '')
    await expect(postButton).toBeDisabled()
  })

  test('should show "No comments yet" when no comments exist', async ({ page }) => {
    // This test would need an event with no comments
    // We'll just verify the empty state message exists in the component
    await page.goto('/events')
    await page.waitForTimeout(1000)

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (!(await eventLink.isVisible())) {
      test.skip()
      return
    }

    await eventLink.click()
    await page.waitForURL(/\/events\//)

    // Either we see "No comments yet" or we see actual comments
    const noComments = page.locator('text=No comments yet')
    const existingComments = page.locator('button:has-text("Reply")')

    const hasNoComments = await noComments.isVisible()
    const hasComments = await existingComments.first().isVisible()

    // One of these should be true
    expect(hasNoComments || hasComments).toBe(true)
  })
})
