import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check approval status - redirect unapproved users to pending page
  type ProfileApproval = { approval_status: 'pending' | 'approved' | 'rejected' | null }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('approval_status')
    .eq('user_id', user.id)
    .single()

  const typedProfile = profile as ProfileApproval | null

  // If user has a profile but is not approved, redirect to pending page
  if (typedProfile && typedProfile.approval_status !== 'approved') {
    redirect("/pending-approval")
  }

  return <>{children}</>
}
