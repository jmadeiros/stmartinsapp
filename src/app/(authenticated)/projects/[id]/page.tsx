import { notFound } from "next/navigation"
import { getProjectById } from "@/lib/actions/projects"
import { ProjectDetail } from "@/components/social/project-detail"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProjectById(params.id)

  if (!project) {
    notFound()
  }

  return <ProjectDetail project={project} />
}
