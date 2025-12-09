import { createClient } from "@/lib/supabase/server"
import { PeoplePage } from "@/components/people/people-page"
import { getPeopleData, getOrganizationsData } from "./actions"

export default async function PeopleDirectoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch people and organizations data
  const [people, organizations] = await Promise.all([
    getPeopleData(),
    getOrganizationsData(),
  ])

  return (
    <PeoplePage 
      people={people} 
      organizations={organizations}
      currentUserId={user?.id}
    />
  )
}

