import { createClient } from "@/lib/supabase/server"
import { getFeedData } from "../dashboard/actions"
import { SocialHeader } from "@/components/social/header"
import { ProjectDiscoveryView } from "@/components/social/project-discovery-view"
import type { ProjectPost } from "@/lib/types"

// Mock project to ensure the list is never empty during demo
// Re-saving to trigger rebuild
const MOCK_PROJECTS: ProjectPost[] = [
  {
    id: "demo-project-1",
    type: "project",
    author: {
      name: "Sarah Jenkins",
      handle: "@sarah.j",
      avatar: "/placeholder.svg",
      role: "Program Director",
      organization: "Youth Forward"
    },
    collaborations: [],
    title: "Summer Youth Coding Bootcamp",
    description: "We are launching a comprehensive 6-week summer program combining digital literacy education with nutritional support.",
    impactGoal: "Equip 50 at-risk youth with Python basics.",
    cause: "Education",
    targetDate: "June 15, 2024",
    serviceArea: "Eastside",
    needs: {
      volunteersNeeded: 12,
      fundraisingGoal: "$15,000"
    },
    progress: {
      current: 35,
      target: 50,
      unit: "students",
      lastUpdated: "2 days ago"
    },
    timeAgo: "1 week ago"
  },
  {
    id: "demo-project-2",
    type: "project",
    author: {
      name: "David Chen",
      handle: "@david.c",
      avatar: "/placeholder.svg",
      role: "Coordinator",
      organization: "Green City"
    },
    collaborations: [],
    title: "Urban Garden Initiative 2024",
    description: "Transforming 3 vacant lots into community gardens to provide fresh produce for local food banks.",
    impactGoal: "Create 3 new sustainable food sources.",
    cause: "Environment",
    targetDate: "May 1, 2024",
    serviceArea: "Downtown",
    needs: {
      volunteersNeeded: 25,
      resourcesRequested: ["Tools", "Soil"]
    },
    progress: {
      current: 1,
      target: 3,
      unit: "gardens",
      lastUpdated: "1 day ago"
    },
    timeAgo: "3 days ago"
  },
  {
    id: "demo-project-3",
    type: "project",
    author: {
      name: "Maria Rodriguez",
      handle: "@maria.r",
      avatar: "/placeholder.svg",
      role: "Director",
      organization: "Senior Connect"
    },
    collaborations: [],
    title: "Digital Seniors Outreach",
    description: "Helping seniors connect with their families through technology training and device donation.",
    impactGoal: "Connect 100 seniors with digital tools.",
    cause: "Community",
    targetDate: "Ongoing",
    serviceArea: "Metro Area",
    needs: {
      volunteersNeeded: 8,
      seekingPartners: true
    },
    progress: {
      current: 42,
      target: 100,
      unit: "seniors",
      lastUpdated: "5 hours ago"
    },
    timeAgo: "2 weeks ago"
  },
  {
    id: "demo-project-4",
    type: "project",
    author: {
      name: "James Wilson",
      handle: "@j.wilson",
      avatar: "/placeholder.svg",
      role: "Lead",
      organization: "Food Rescue"
    },
    collaborations: [],
    title: "Weekend Food Backpacks",
    description: "Ensuring no child goes hungry over the weekend by providing backpacks filled with nutritious meals.",
    impactGoal: "Feed 200 children weekly.",
    cause: "Hunger",
    targetDate: "Sep 1, 2024",
    serviceArea: "School District 4",
    needs: {
      fundraisingGoal: "$5,000",
      resourcesRequested: ["Backpacks", "Canned Goods"]
    },
    progress: {
      current: 120,
      target: 200,
      unit: "children",
      lastUpdated: "1 week ago"
    },
    timeAgo: "1 month ago"
  },
  {
    id: "demo-project-5",
    type: "project",
    author: {
      name: "Emily White",
      handle: "@emily.w",
      avatar: "/placeholder.svg",
      role: "Organizer",
      organization: "Art for All"
    },
    collaborations: [],
    title: "Community Mural Project",
    description: "Beautifying our neighborhood with a collaborative mural designed and painted by local residents.",
    impactGoal: "Paint 2000sqft of public art.",
    cause: "Arts & Culture",
    targetDate: "July 20, 2024",
    serviceArea: "Main Street",
    needs: {
      volunteersNeeded: 15,
      seekingPartners: false
    },
    progress: {
      current: 10,
      target: 100,
      unit: "% complete",
      lastUpdated: "Yesterday"
    },
    timeAgo: "4 days ago"
  }
]

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*, organization_id")
    .eq("user_id", user?.id)
    .single()

  const orgId = profile?.organization_id

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
  let projectItems = feedItems.filter(item => item.type === 'project')

  // Combine with mock data for a full demo experience
  const allProjects = [...projectItems, ...MOCK_PROJECTS]

  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <ProjectDiscoveryView initialProjects={allProjects} userOrgId={orgId} />
    </div>
  )
}
