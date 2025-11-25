import { createClient } from "@/lib/supabase/server"
import { SocialDashboard } from "@/components/social/dashboard"
import { getFeedData } from "./actions"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*, organization_id")
    .eq("user_id", user?.id)
    .single()

  const userName = profile?.full_name?.split(" ")[0] ?? "there"

  // For development: use test org ID if no profile exists
  const testOrgId = '00000000-0000-0000-0000-000000000001'
  const orgId = profile?.organization_id || testOrgId
  const userId = user?.id

  // Fetch feed data
  const feedItems = await getFeedData(orgId)

  return <SocialDashboard userName={userName} feedItems={feedItems} userId={userId} orgId={orgId} />
}
