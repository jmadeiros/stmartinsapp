/**
 * Phase 3 Wave 1 Feature Test Script
 *
 * Tests the following features:
 * - 3.1 Notifications (cleanup verified - no console.logs)
 * - 3.8 Search action
 * - 3.9 Profile actions
 * - 3.10 Settings actions
 * - 3.11 Admin actions
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration?: number
}

const results: TestResult[] = []

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now()
  try {
    await testFn()
    const duration = Date.now() - start
    results.push({ name, passed: true, message: 'Test passed', duration })
    console.log(`[PASS] ${name} (${duration}ms)`)
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({ name, passed: false, message: error.message || String(error), duration })
    console.log(`[FAIL] ${name}: ${error.message}`)
  }
}

// Test Search Functionality
async function testSearch(): Promise<void> {
  // Test that the search table/view exists
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, content, title, category, created_at, author_id, org_id')
    .limit(5)

  if (postsError) {
    throw new Error(`Posts query failed: ${postsError.message}`)
  }

  // Test people search
  const { data: people, error: peopleError } = await supabase
    .from('people')
    .select('*')
    .limit(5)

  if (peopleError) {
    throw new Error(`People query failed: ${peopleError.message}`)
  }

  // Test events search
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, description, start_time, end_time, location, organizer_id, org_id')
    .limit(5)

  if (eventsError) {
    throw new Error(`Events query failed: ${eventsError.message}`)
  }

  // Test projects search
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, description, status, created_at, author_id, org_id')
    .limit(5)

  if (projectsError) {
    throw new Error(`Projects query failed: ${projectsError.message}`)
  }
}

// Test Profile Functionality
async function testProfileFetch(): Promise<void> {
  // Test that user_profiles table exists and is queryable
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select(`
      user_id,
      full_name,
      bio,
      job_title,
      avatar_url,
      role,
      organization_id,
      skills,
      interests,
      created_at,
      updated_at
    `)
    .limit(5)

  if (error) {
    throw new Error(`Profile fetch failed: ${error.message}`)
  }

  if (!profiles || profiles.length === 0) {
    console.log('  [INFO] No profiles found, but query succeeded')
  }
}

// Test Profile with Organization Join
async function testProfileWithOrganization(): Promise<void> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      organization:organizations(
        id,
        name,
        logo_url
      )
    `)
    .limit(5)

  if (error) {
    throw new Error(`Profile with org join failed: ${error.message}`)
  }
}

// Test Settings Functionality
async function testSettingsFetch(): Promise<void> {
  // Test that user_settings table exists
  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('*')
    .limit(5)

  if (error) {
    throw new Error(`Settings fetch failed: ${error.message}`)
  }
}

// Test Admin Stats Functionality
async function testAdminStats(): Promise<void> {
  // Test user count
  const { count: userCount, error: userError } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  if (userError) {
    throw new Error(`User count failed: ${userError.message}`)
  }

  // Test posts count
  const { count: postCount, error: postError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  if (postError) {
    throw new Error(`Posts count failed: ${postError.message}`)
  }

  // Test pending approvals count (users without org)
  const { count: pendingCount, error: pendingError } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .is('organization_id', null)

  if (pendingError) {
    throw new Error(`Pending approvals count failed: ${pendingError.message}`)
  }

  console.log(`  [INFO] Stats: ${userCount} users, ${postCount} posts, ${pendingCount} pending`)
}

// Test Admin User Management
async function testAdminUserManagement(): Promise<void> {
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select(`
      user_id,
      full_name,
      contact_email,
      role,
      job_title,
      organization_id,
      created_at,
      last_active_at,
      organizations:organization_id (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    throw new Error(`Admin user list failed: ${error.message}`)
  }
}

// Test Organizations List
async function testOrganizations(): Promise<void> {
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  if (error) {
    throw new Error(`Organizations list failed: ${error.message}`)
  }

  if (orgs && orgs.length > 0) {
    console.log(`  [INFO] Found ${orgs.length} organizations`)
  }
}

// Test User Memberships
async function testUserMemberships(): Promise<void> {
  const { data: memberships, error } = await supabase
    .from('user_memberships')
    .select(`
      *,
      organizations (
        id,
        name,
        slug
      )
    `)
    .limit(10)

  if (error) {
    throw new Error(`User memberships query failed: ${error.message}`)
  }
}

// Test Notifications Table
async function testNotifications(): Promise<void> {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(5)

  if (error) {
    throw new Error(`Notifications query failed: ${error.message}`)
  }
}

// Test Website Queue (posts, events, projects with joins)
async function testWebsiteQueue(): Promise<void> {
  // Test opportunities posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      author_id,
      org_id,
      created_at,
      category
    `)
    .eq('category', 'opportunities')
    .is('deleted_at', null)
    .limit(5)

  if (postsError) {
    throw new Error(`Website queue posts failed: ${postsError.message}`)
  }

  // Test upcoming events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      organizer_id,
      org_id,
      created_at,
      start_time
    `)
    .is('deleted_at', null)
    .limit(5)

  if (eventsError) {
    throw new Error(`Website queue events failed: ${eventsError.message}`)
  }

  // Test active projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      author_id,
      org_id,
      created_at,
      status
    `)
    .eq('status', 'active')
    .is('deleted_at', null)
    .limit(5)

  if (projectsError) {
    throw new Error(`Website queue projects failed: ${projectsError.message}`)
  }
}

async function main() {
  console.log('\n========================================')
  console.log('Phase 3 Wave 1 Feature Tests')
  console.log('========================================\n')

  // Run all tests
  await runTest('3.8 Search - Posts query', testSearch)
  await runTest('3.9 Profile - Basic fetch', testProfileFetch)
  await runTest('3.9 Profile - With organization join', testProfileWithOrganization)
  await runTest('3.10 Settings - Fetch', testSettingsFetch)
  await runTest('3.11 Admin - Stats queries', testAdminStats)
  await runTest('3.11 Admin - User management', testAdminUserManagement)
  await runTest('3.11 Admin - Organizations list', testOrganizations)
  await runTest('3.11 Admin - User memberships', testUserMemberships)
  await runTest('3.1 Notifications - Query', testNotifications)
  await runTest('3.11 Admin - Website queue', testWebsiteQueue)

  // Summary
  console.log('\n========================================')
  console.log('Test Summary')
  console.log('========================================')
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  console.log(`Total: ${results.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)

  if (failed > 0) {
    console.log('\nFailed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`)
    })
  }

  console.log('\n========================================\n')

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(console.error)
