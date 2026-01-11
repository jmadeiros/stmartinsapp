import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OpportunitiesPage } from "@/components/opportunities/opportunities-page"
import { getOpportunitiesData } from "./actions"
import type { CardVariant } from "@/components/opportunities/opportunity-card"

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ clean?: string }>
}

export default async function OpportunitiesPageRoute({ searchParams }: PageProps) {
  const params = await searchParams
  const variant: CardVariant = params.clean === 'true' ? 'clean' : 'board'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization from profile (matches dashboard pattern)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("user_id", user.id)
    .single()

  // For development: use test org ID if no profile exists
  const testOrgId = '00000000-0000-0000-0000-000000000001'
  const orgId = (profile as { organization_id?: string } | null)?.organization_id || testOrgId

  // Fetch opportunities data
  const { opportunities, counts } = await getOpportunitiesData(orgId)

  return (
    <OpportunitiesPage
      opportunities={opportunities}
      counts={counts}
      currentUserId={user.id}
      variant={variant}
    />
  )
}
