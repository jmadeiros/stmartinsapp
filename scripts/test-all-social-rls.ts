/**
 * Test RLS policies on all social feature tables
 *
 * This script tests INSERT, SELECT, UPDATE, and DELETE operations
 * on all social feature tables to verify RLS is working correctly.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

type TestResult = {
  table: string
  operation: string
  success: boolean
  error?: string
  note?: string
}

const results: TestResult[] = []

async function getTestUsers() {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const testUser = users?.users?.find(u => u.email === 'test@stmartins.dev')
  const sarah = users?.users?.find(u => u.email === 'admin@stmartins.dev')
  return { testUser, sarah }
}

async function getTestData() {
  // Get an existing post
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('id, author_id, org_id')
    .limit(1)

  // Get an existing org
  const { data: orgs } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .limit(1)

  // Get an existing event
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, organizer_id')
    .limit(1)

  // Get an existing project
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('id, author_id')
    .limit(1)

  return {
    post: posts?.[0],
    org: orgs?.[0],
    event: events?.[0],
    project: projects?.[0]
  }
}

async function testPostsRLS(userClient: any, userId: string, testData: any) {
  console.log('\n--- Testing posts table ---')

  // SELECT
  const { error: selectError } = await userClient
    .from('posts')
    .select('id, content')
    .limit(1)

  results.push({
    table: 'posts',
    operation: 'SELECT',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT: ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // INSERT
  const { data: insertData, error: insertError } = await userClient
    .from('posts')
    .insert({
      author_id: userId,
      org_id: testData.org?.id || '00000000-0000-0000-0000-000000000001',
      content: 'RLS test post',
      category: 'general'
    })
    .select()
    .single()

  results.push({
    table: 'posts',
    operation: 'INSERT',
    success: !insertError,
    error: insertError?.message
  })
  console.log(`  INSERT: ${!insertError ? 'OK' : 'FAILED - ' + insertError?.message}`)

  // Cleanup
  if (insertData?.id) {
    await supabaseAdmin.from('posts').delete().eq('id', insertData.id)
  }
}

async function testPostCommentsRLS(userClient: any, userId: string, testData: any) {
  console.log('\n--- Testing post_comments table ---')

  if (!testData.post) {
    console.log('  Skipping - no test post available')
    return
  }

  // SELECT
  const { error: selectError } = await userClient
    .from('post_comments')
    .select('id, content')
    .limit(1)

  results.push({
    table: 'post_comments',
    operation: 'SELECT',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT: ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // INSERT
  const { data: insertData, error: insertError } = await userClient
    .from('post_comments')
    .insert({
      post_id: testData.post.id,
      author_id: userId,
      content: 'RLS test comment'
    })
    .select()
    .single()

  results.push({
    table: 'post_comments',
    operation: 'INSERT',
    success: !insertError,
    error: insertError?.message
  })
  console.log(`  INSERT: ${!insertError ? 'OK' : 'FAILED - ' + insertError?.message}`)

  // UPDATE (own comment)
  if (insertData?.id) {
    const { error: updateError } = await userClient
      .from('post_comments')
      .update({ content: 'RLS test comment updated' })
      .eq('id', insertData.id)

    results.push({
      table: 'post_comments',
      operation: 'UPDATE (own)',
      success: !updateError,
      error: updateError?.message
    })
    console.log(`  UPDATE (own): ${!updateError ? 'OK' : 'FAILED - ' + updateError?.message}`)

    // DELETE (own comment)
    const { error: deleteError } = await userClient
      .from('post_comments')
      .delete()
      .eq('id', insertData.id)

    results.push({
      table: 'post_comments',
      operation: 'DELETE (own)',
      success: !deleteError,
      error: deleteError?.message
    })
    console.log(`  DELETE (own): ${!deleteError ? 'OK' : 'FAILED - ' + deleteError?.message}`)

    // Cleanup if delete failed
    if (deleteError) {
      await supabaseAdmin.from('post_comments').delete().eq('id', insertData.id)
    }
  }
}

async function testPostReactionsRLS(userClient: any, userId: string, testData: any) {
  console.log('\n--- Testing post_reactions table ---')

  if (!testData.post) {
    console.log('  Skipping - no test post available')
    return
  }

  // SELECT
  const { error: selectError } = await userClient
    .from('post_reactions')
    .select('id')
    .limit(1)

  results.push({
    table: 'post_reactions',
    operation: 'SELECT',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT: ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // INSERT
  const { data: insertData, error: insertError } = await userClient
    .from('post_reactions')
    .insert({
      post_id: testData.post.id,
      user_id: userId,
      reaction_type: 'like'
    })
    .select()
    .single()

  results.push({
    table: 'post_reactions',
    operation: 'INSERT',
    success: !insertError,
    error: insertError?.message
  })
  console.log(`  INSERT: ${!insertError ? 'OK' : 'FAILED - ' + insertError?.message}`)

  // DELETE (own reaction)
  if (insertData?.id) {
    const { error: deleteError } = await userClient
      .from('post_reactions')
      .delete()
      .eq('id', insertData.id)

    results.push({
      table: 'post_reactions',
      operation: 'DELETE (own)',
      success: !deleteError,
      error: deleteError?.message
    })
    console.log(`  DELETE (own): ${!deleteError ? 'OK' : 'FAILED - ' + deleteError?.message}`)

    if (deleteError) {
      await supabaseAdmin.from('post_reactions').delete().eq('id', insertData.id)
    }
  }
}

async function testNotificationsRLS(userClient: any, userId: string, targetUserId: string) {
  console.log('\n--- Testing notifications table ---')

  // SELECT (can only read own notifications)
  const { error: selectError } = await userClient
    .from('notifications')
    .select('id, title')
    .eq('user_id', userId)
    .limit(1)

  results.push({
    table: 'notifications',
    operation: 'SELECT (own)',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT (own): ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // INSERT (actor_id must match auth.uid())
  // Creating a notification for another user (where WE are the actor)
  const { data: insertData, error: insertError } = await userClient
    .from('notifications')
    .insert({
      user_id: targetUserId, // Notify this user
      actor_id: userId,      // We are the actor (must match auth.uid())
      type: 'test',
      title: 'RLS test notification',
      read: false
    })

  results.push({
    table: 'notifications',
    operation: 'INSERT (as actor)',
    success: !insertError,
    error: insertError?.message,
    note: 'actor_id must equal auth.uid()'
  })
  console.log(`  INSERT (as actor): ${!insertError ? 'OK' : 'FAILED - ' + insertError?.message}`)

  // Cleanup
  if (!insertError) {
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('title', 'RLS test notification')
      .eq('actor_id', userId)
  }

  // UPDATE (own notifications - mark as read)
  // First create a notification TO the test user
  const { data: ownNotif } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,  // For the test user
      actor_id: targetUserId, // From another user
      type: 'test',
      title: 'RLS test - update test',
      read: false
    })
    .select()
    .single()

  if (ownNotif) {
    const { error: updateError } = await userClient
      .from('notifications')
      .update({ read: true })
      .eq('id', ownNotif.id)

    results.push({
      table: 'notifications',
      operation: 'UPDATE (own)',
      success: !updateError,
      error: updateError?.message
    })
    console.log(`  UPDATE (own): ${!updateError ? 'OK' : 'FAILED - ' + updateError?.message}`)

    await supabaseAdmin.from('notifications').delete().eq('id', ownNotif.id)
  }
}

async function testEventsRLS(userClient: any, userId: string, testData: any) {
  console.log('\n--- Testing events table ---')

  // SELECT
  const { error: selectError } = await userClient
    .from('events')
    .select('id, title')
    .limit(1)

  results.push({
    table: 'events',
    operation: 'SELECT',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT: ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // INSERT
  const { data: insertData, error: insertError } = await userClient
    .from('events')
    .insert({
      organizer_id: userId,
      org_id: testData.org?.id || '00000000-0000-0000-0000-000000000001',
      title: 'RLS test event',
      description: 'Test event for RLS',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString()
    })
    .select()
    .single()

  results.push({
    table: 'events',
    operation: 'INSERT',
    success: !insertError,
    error: insertError?.message
  })
  console.log(`  INSERT: ${!insertError ? 'OK' : 'FAILED - ' + insertError?.message}`)

  if (insertData?.id) {
    await supabaseAdmin.from('events').delete().eq('id', insertData.id)
  }
}

async function testEventRsvpsRLS(userClient: any, userId: string, testData: any) {
  console.log('\n--- Testing event_rsvps table ---')

  if (!testData.event || !testData.org) {
    console.log('  Skipping - no test event/org available')
    return
  }

  // SELECT
  const { error: selectError } = await userClient
    .from('event_rsvps')
    .select('*')
    .limit(1)

  results.push({
    table: 'event_rsvps',
    operation: 'SELECT',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT: ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // INSERT
  const { data: insertData, error: insertError } = await userClient
    .from('event_rsvps')
    .insert({
      event_id: testData.event.id,
      user_id: userId,
      org_id: testData.org.id,
      status: 'interested'
    })
    .select()
    .single()

  results.push({
    table: 'event_rsvps',
    operation: 'INSERT',
    success: !insertError,
    error: insertError?.message
  })
  console.log(`  INSERT: ${!insertError ? 'OK' : 'FAILED - ' + insertError?.message}`)

  // Cleanup
  if (insertData) {
    await supabaseAdmin
      .from('event_rsvps')
      .delete()
      .eq('event_id', testData.event.id)
      .eq('user_id', userId)
  }
}

async function testProjectsRLS(userClient: any, userId: string, testData: any) {
  console.log('\n--- Testing projects table ---')

  // SELECT
  const { error: selectError } = await userClient
    .from('projects')
    .select('id, title')
    .limit(1)

  results.push({
    table: 'projects',
    operation: 'SELECT',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT: ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // INSERT
  const { data: insertData, error: insertError } = await userClient
    .from('projects')
    .insert({
      author_id: userId,
      org_id: testData.org?.id || '00000000-0000-0000-0000-000000000001',
      title: 'RLS test project',
      description: 'Test project for RLS'
    })
    .select()
    .single()

  results.push({
    table: 'projects',
    operation: 'INSERT',
    success: !insertError,
    error: insertError?.message
  })
  console.log(`  INSERT: ${!insertError ? 'OK' : 'FAILED - ' + insertError?.message}`)

  if (insertData?.id) {
    await supabaseAdmin.from('projects').delete().eq('id', insertData.id)
  }
}

async function testProjectInterestRLS(userClient: any, userId: string, testData: any) {
  console.log('\n--- Testing project_interest table ---')

  if (!testData.project || !testData.org) {
    console.log('  Skipping - no test project/org available')
    return
  }

  // SELECT
  const { error: selectError } = await userClient
    .from('project_interest')
    .select('*')
    .limit(1)

  results.push({
    table: 'project_interest',
    operation: 'SELECT',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT: ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // INSERT
  const { error: insertError } = await userClient
    .from('project_interest')
    .insert({
      project_id: testData.project.id,
      user_id: userId,
      org_id: testData.org.id
    })

  results.push({
    table: 'project_interest',
    operation: 'INSERT',
    success: !insertError,
    error: insertError?.message
  })
  console.log(`  INSERT: ${!insertError ? 'OK' : 'FAILED - ' + insertError?.message}`)

  // Cleanup
  await supabaseAdmin
    .from('project_interest')
    .delete()
    .eq('project_id', testData.project.id)
    .eq('user_id', userId)
}

async function testUserProfilesRLS(userClient: any, userId: string) {
  console.log('\n--- Testing user_profiles table ---')

  // SELECT (all profiles visible to authenticated users)
  const { error: selectError } = await userClient
    .from('user_profiles')
    .select('user_id, full_name')
    .limit(1)

  results.push({
    table: 'user_profiles',
    operation: 'SELECT',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT: ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // UPDATE (own profile)
  const { error: updateError } = await userClient
    .from('user_profiles')
    .update({ bio: 'RLS test bio update' })
    .eq('user_id', userId)

  results.push({
    table: 'user_profiles',
    operation: 'UPDATE (own)',
    success: !updateError,
    error: updateError?.message
  })
  console.log(`  UPDATE (own): ${!updateError ? 'OK' : 'FAILED - ' + updateError?.message}`)
}

async function testPostMentionsRLS(userClient: any, userId: string, testData: any) {
  console.log('\n--- Testing post_mentions table ---')

  if (!testData.post) {
    console.log('  Skipping - no test post available')
    return
  }

  // SELECT
  const { error: selectError } = await userClient
    .from('post_mentions')
    .select('*')
    .limit(1)

  results.push({
    table: 'post_mentions',
    operation: 'SELECT',
    success: !selectError,
    error: selectError?.message
  })
  console.log(`  SELECT: ${!selectError ? 'OK' : 'FAILED - ' + selectError?.message}`)

  // INSERT
  const { error: insertError } = await userClient
    .from('post_mentions')
    .insert({
      post_id: testData.post.id,
      mentioned_user_id: userId
    })

  results.push({
    table: 'post_mentions',
    operation: 'INSERT',
    success: !insertError,
    error: insertError?.message
  })
  console.log(`  INSERT: ${!insertError ? 'OK' : 'FAILED - ' + insertError?.message}`)

  // Cleanup
  await supabaseAdmin
    .from('post_mentions')
    .delete()
    .eq('post_id', testData.post.id)
    .eq('mentioned_user_id', userId)
}

async function runAllTests() {
  console.log('='.repeat(80))
  console.log('RLS POLICY TEST SUITE - SOCIAL FEATURE TABLES')
  console.log('='.repeat(80))
  console.log('')

  // Get test users
  const { testUser, sarah } = await getTestUsers()

  if (!testUser) {
    console.error('ERROR: Test user (test@stmartins.dev) not found!')
    console.log('Run the dev-login endpoint first to create test users.')
    return
  }

  console.log(`Test user: ${testUser.email} (${testUser.id})`)
  console.log(`Target user (Sarah): ${sarah?.email || 'Not found'} (${sarah?.id || 'N/A'})`)

  // Sign in as test user
  const userClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
    email: 'test@stmartins.dev',
    password: 'dev-password-123'
  })

  if (authError || !authData.user) {
    console.error('ERROR: Could not sign in as test user:', authError?.message)
    return
  }

  console.log(`Signed in successfully as: ${authData.user.id}`)

  // Get test data
  const testData = await getTestData()
  console.log(`Test post: ${testData.post?.id || 'None'}`)
  console.log(`Test org: ${testData.org?.id || 'None'}`)
  console.log(`Test event: ${testData.event?.id || 'None'}`)
  console.log(`Test project: ${testData.project?.id || 'None'}`)

  // Run all tests
  await testPostsRLS(userClient, authData.user.id, testData)
  await testPostCommentsRLS(userClient, authData.user.id, testData)
  await testPostReactionsRLS(userClient, authData.user.id, testData)
  await testPostMentionsRLS(userClient, authData.user.id, testData)
  await testNotificationsRLS(userClient, authData.user.id, sarah?.id || testData.post?.author_id || authData.user.id)
  await testEventsRLS(userClient, authData.user.id, testData)
  await testEventRsvpsRLS(userClient, authData.user.id, testData)
  await testProjectsRLS(userClient, authData.user.id, testData)
  await testProjectInterestRLS(userClient, authData.user.id, testData)
  await testUserProfilesRLS(userClient, authData.user.id)

  // Summary
  console.log('')
  console.log('='.repeat(80))
  console.log('TEST RESULTS SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  const passed = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`Total tests: ${results.length}`)
  console.log(`Passed: ${passed.length}`)
  console.log(`Failed: ${failed.length}`)
  console.log('')

  if (failed.length > 0) {
    console.log('FAILED TESTS:')
    console.log('-'.repeat(40))
    for (const result of failed) {
      console.log(`  [FAIL] ${result.table}.${result.operation}`)
      console.log(`         Error: ${result.error}`)
      if (result.note) {
        console.log(`         Note: ${result.note}`)
      }
    }
    console.log('')
    console.log('ACTION REQUIRED:')
    console.log('  Apply the comprehensive RLS migration:')
    console.log('  supabase/migrations/20251215_comprehensive_rls_fix.sql')
  } else {
    console.log('ALL TESTS PASSED!')
    console.log('RLS policies are correctly configured for all social feature tables.')
  }
}

runAllTests().catch(console.error)
