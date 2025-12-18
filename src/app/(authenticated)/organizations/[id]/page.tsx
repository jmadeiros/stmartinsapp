import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrganization } from "@/lib/actions/organizations"
import { OrgProfile } from "@/components/organizations/org-profile"

interface OrganizationPageProps {
  params: {
    id: string
  }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile to pass role info
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .single()

  // Fetch organization with members
  const { data: organization, error } = await getOrganization(params.id)

  if (error || !organization) {
    notFound()
  }

  // Determine if user can edit
  const canEdit = userProfile && (
    userProfile.role === 'admin' ||
    (userProfile.organization_id === params.id && userProfile.role === 'st_martins_staff')
  )

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <OrgProfile organization={organization} canEdit={!!canEdit} />
    </div>
  )
}
