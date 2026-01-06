import { createClient } from "@/lib/supabase/server"
import { SocialDashboard } from "@/components/social/dashboard"
import { getFeedData } from "./actions"

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export type UserRole = 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // user_profiles has organization_id and role directly
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, organization_id, role")
    .eq("user_id", user?.id ?? '')
    .single()

  const profileData = profile as { full_name?: string; organization_id?: string; role?: string } | null

  const userName = profileData?.full_name?.split(" ")[0] ?? "there"
  const userRole = (profileData?.role as UserRole) || 'volunteer'

  // For development: use test org ID if no profile exists
  const testOrgId = '00000000-0000-0000-0000-000000000001'
  const orgId = profileData?.organization_id || testOrgId
  const userId = user?.id

  // Fetch feed data
  const feedItems = await getFeedData(orgId)

  return <SocialDashboard userName={userName} feedItems={feedItems} userId={userId} orgId={orgId} userRole={userRole} />
}
