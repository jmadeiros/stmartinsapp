import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from database
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return <DashboardShell user={profile}>{children}</DashboardShell>
}
