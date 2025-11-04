import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // User is logged in, redirect to dashboard
    redirect('/dashboard')
  } else {
    // User is not logged in, redirect to login page
    redirect('/login')
  }
}
