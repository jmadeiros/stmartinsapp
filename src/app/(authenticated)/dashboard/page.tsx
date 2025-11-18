import { createClient } from "@/lib/supabase/server"

import { SocialDashboard } from "@/components/social/dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single()

  const userName = profile?.full_name?.split(" ")[0] ?? "there"

  return <SocialDashboard userName={userName} />
}
