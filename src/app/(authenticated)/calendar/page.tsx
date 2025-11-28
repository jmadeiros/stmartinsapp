import { MonthlyCalendarView, mockMonthlyEvents } from "@/components/calendar/monthly-calendar"
import { SocialHeader } from "@/components/social/header"

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <MonthlyCalendarView
          events={mockMonthlyEvents}
          initialDate={new Date("2024-11-28T14:00:00")}
        />
      </div>
    </div>
  )
}


