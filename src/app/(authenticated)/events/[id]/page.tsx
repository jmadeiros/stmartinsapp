import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getEventById } from "@/lib/actions/events"
import { EventDetail } from "@/components/social/event-detail"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user's organization
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("user_id", user.id)
    .single()

  const profileData = profile as { organization_id?: string } | null
  const currentUserOrgId = profileData?.organization_id || ''

  // Fetch event details
  const result = await getEventById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return <EventDetail event={result.data} currentUserId={user.id} currentUserOrgId={currentUserOrgId} />
}
