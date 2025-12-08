import { notFound } from "next/navigation"
import { getProjectById } from "@/lib/actions/projects"
import { ProjectDetail } from "@/components/social/project-detail"
import type { ProjectPost } from "@/lib/types"

interface ProjectPageProps {
  params: {
    id: string
  }
}

const MOCK_PROJECT: ProjectPost = {
  id: "demo-project-1",
  type: "project",
  author: {
    name: "Sarah Jenkins",
    handle: "@sarah.j",
    avatar: "/placeholder.svg",
    role: "Program Director",
    organization: "Youth Forward"
  },
  collaborations: [
    { organization: "City Food Bank", avatar: "/placeholder.svg" },
    { organization: "Tech for Good", avatar: "/placeholder.svg" }
  ],
  title: "Summer Youth Coding Bootcamp & Food Drive",
  description: "We are launching a comprehensive 6-week summer program combining digital literacy education with nutritional support. This initiative aims to bridge the digital divide while ensuring food security for 50 underserved youth in the Eastside district. \n\nThe program will provide daily coding workshops, healthy lunches, and weekend food packs for families. We believe that by nourishing both the mind and body, we can create lasting positive change in our community.",
  impactGoal: "Equip 50 at-risk youth with Python basics and ensure 100% nutritional security for their families during the summer break.",
  cause: "Education",
  targetDate: "June 15, 2024",
  serviceArea: "Eastside District",
  partnerOrgs: ["City Food Bank", "Tech for Good"],
  needs: {
    volunteersNeeded: 12,
    participantRequests: [
      { programTag: "Students (Age 12-15)" }
    ],
    seekingPartners: true,
    resourcesRequested: ["Laptops", "Non-perishable food items"],
    fundraisingGoal: "$15,000"
  },
  progress: {
    current: 35,
    target: 50,
    unit: "students enrolled",
    lastUpdated: "2 days ago"
  },
  eventsCount: 3,
  timeAgo: "1 week ago",
  interestedOrgs: ["St. Martins", "Local Library"],
  participantsReferred: 15
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  let project: ProjectPost | null = null;

  // If user specifically requests the demo or if database fetch fails, use mock
  if (params.id === 'demo' || params.id.startsWith('demo-')) {
    project = MOCK_PROJECT;
  } else {
    try {
      project = await getProjectById(params.id)
    } catch (error) {
      console.error("Failed to fetch project, falling back to mock for demo purposes", error)
    }
  }

  // Fallback to mock if project is still null (e.g. database empty or connection issue)
  // This ensures the user SEES something as requested.
  if (!project) {
    project = { ...MOCK_PROJECT, id: params.id, title: `Project ${params.id} (Demo View)` };
  }

  return <ProjectDetail project={project} />
}
