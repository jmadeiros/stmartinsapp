import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProjectById } from "@/lib/actions/projects"
import { ProjectDetail } from "@/components/social/project-detail"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("user_id", user.id)
    .single()

  const profileData = profile as { organization_id?: string } | null
  const currentUserOrgId = profileData?.organization_id || ''

  const project = await getProjectById(id)

  if (!project) {
    notFound()
  }

  return <ProjectDetail project={project} currentUserId={user.id} currentUserOrgId={currentUserOrgId} />
}
