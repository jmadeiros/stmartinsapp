import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Temporarily disabled for development
  // if (!user) {
  //   redirect("/login")
  // }

  return <>{children}</>
}
