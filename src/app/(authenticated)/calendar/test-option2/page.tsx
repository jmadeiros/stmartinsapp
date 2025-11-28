import { MonthlyCalendarOption2 } from "@/components/calendar/monthly-calendar-option2"
import { mockMonthlyEvents } from "@/components/calendar/monthly-calendar"
import { SocialHeader } from "@/components/social/header"

export default function CalendarOption2Page() {
  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <MonthlyCalendarOption2
          events={mockMonthlyEvents}
          initialDate={new Date("2024-11-28T14:00:00")}
        />
      </div>
    </div>
  )
}

