import { createClient } from "@/lib/supabase/server"
import { getFeedData } from "../dashboard/actions"
import { SocialHeader } from "@/components/social/header"
import { ProjectDiscoveryView } from "@/components/social/project-discovery-view"

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get org_id from user_profiles (has organization_id directly)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("user_id", user?.id ?? '')
    .single()

  const profileData = profile as { organization_id?: string } | null
  const orgId = profileData?.organization_id

  // Fetch feed data
  let feedItems: any[] = []
  try {
    if (orgId) {
      feedItems = await getFeedData(orgId)
    }
  } catch (e) {
    console.error("Error fetching feed data:", e)
  }

  // Filter for projects only
  const projectItems = feedItems.filter(item => item.type === 'project')

  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <ProjectDiscoveryView initialProjects={projectItems} userOrgId={orgId} />
    </div>
  )
}
