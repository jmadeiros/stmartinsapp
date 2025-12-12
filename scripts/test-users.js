// Test script to verify all users can login and create posts
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing environment variables. Run: source .env.local')
  process.exit(1)
}

const TEST_USERS = [
  { email: 'admin@stmartins.dev', password: 'dev-admin-123', role: 'admin' },
  { email: 'staff@stmartins.dev', password: 'dev-staff-123', role: 'st_martins_staff' },
  { email: 'partner@stmartins.dev', password: 'dev-partner-123', role: 'partner_staff' },
  { email: 'volunteer@stmartins.dev', password: 'dev-volunteer-123', role: 'volunteer' },
]

const ORG_ID = '00000000-0000-0000-0000-000000000001'

async function testUser(user) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  console.log(`\n--- Testing ${user.role}: ${user.email} ---`)

  // Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password
  })

  if (authError) {
    console.log(`  [FAIL] Login failed: ${authError.message}`)
    return { success: false, role: user.role, step: 'login', error: authError.message }
  }

  console.log(`  [OK] Login successful - User ID: ${authData.user.id}`)

  // Create a test post
  const postContent = `Test post from ${user.role} at ${new Date().toISOString()}`
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: authData.user.id,
      org_id: ORG_ID,
      content: postContent,
      category: 'general'
    })
    .select()
    .single()

  if (postError) {
    console.log(`  [FAIL] Post creation failed: ${postError.message}`)
    return { success: false, role: user.role, step: 'post', error: postError.message }
  }

  console.log(`  [OK] Post created - Post ID: ${post.id}`)

  // Cleanup - delete the test post
  await supabase.from('posts').delete().eq('id', post.id)
  console.log(`  [OK] Test post cleaned up`)

  // Sign out
  await supabase.auth.signOut()

  return { success: true, role: user.role }
}

async function main() {
  console.log('=== Testing All User Roles ===')
  console.log(`Supabase URL: ${SUPABASE_URL}`)

  const results = []

  for (const user of TEST_USERS) {
    const result = await testUser(user)
    results.push(result)
  }

  console.log('\n=== SUMMARY ===')
  const successes = results.filter(r => r.success)
  const failures = results.filter(r => !r.success)

  console.log(`Passed: ${successes.length}/${results.length}`)

  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach(f => console.log(`  - ${f.role}: ${f.step} - ${f.error}`))
  } else {
    console.log('\nAll users can login and create posts!')
  }
}

main().catch(console.error)
