import { createClient } from "@/lib/supabase/server"
import { getCalendarEvents } from "@/lib/queries/calendar"
import { CalendarPageClient } from "./calendar-page-client"
import { SocialHeader } from "@/components/social/header"

export default async function CalendarPage() {
  const supabase = await createClient()

  // Get the current user (optional, used to mark "isYou" on attendees)
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch events for the current month
  const now = new Date()
  const { data: events, error } = await getCalendarEvents(
    supabase,
    now.getFullYear(),
    now.getMonth(),
    user?.id
  )

  if (error) {
    console.error('[CalendarPage] Error fetching events:', error)
  }

  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <CalendarPageClient
          initialEvents={events ?? []}
          initialDate={now}
          userId={user?.id}
        />
      </div>
    </div>
  )
}


