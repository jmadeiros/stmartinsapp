import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function resetPasswords() {
  // Get all dev users
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .in('full_name', ['Sarah Mitchell', 'James Chen', 'Emma Wilson'])

  if (!profiles) {
    console.log('No profiles found')
    return
  }

  const passwords: Record<string, string> = {
    'Sarah Mitchell': 'dev-admin-123',
    'James Chen': 'dev-staff-123',
    'Emma Wilson': 'dev-partner-123'
  }

  for (const profile of profiles) {
    const password = passwords[profile.full_name]
    if (password) {
      const { error } = await supabase.auth.admin.updateUserById(
        profile.user_id,
        { password }
      )
      if (error) {
        console.log(`Failed to reset ${profile.full_name}: ${error.message}`)
      } else {
        console.log(`✓ Reset password for ${profile.full_name}`)
      }
    }
  }

  console.log('\nYou can now login with:')
  console.log('  Email: admin@stmartins.dev')
  console.log('  Password: dev-admin-123')
}

resetPasswords()
