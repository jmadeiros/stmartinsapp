"use client"

import { useState, useEffect, useCallback } from "react"
import { MonthlyCalendarView, type CalendarEvent } from "@/components/calendar/monthly-calendar"
import { fetchCalendarEvents } from "./actions"
import { startOfMonth, isSameMonth } from "date-fns"

type CalendarPageClientProps = {
  initialEvents: CalendarEvent[]
  initialDate: Date
  userId?: string
}

export function CalendarPageClient({
  initialEvents,
  initialDate,
  userId,
}: CalendarPageClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(initialDate))
  const [isLoading, setIsLoading] = useState(false)
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(() => {
    // Mark the initial month as loaded
    const key = `${initialDate.getFullYear()}-${initialDate.getMonth()}`
    return new Set([key])
  })

  // Function to fetch events for a month
  const loadEventsForMonth = useCallback(async (year: number, month: number) => {
    const key = `${year}-${month}`

    // Don't reload if we've already fetched this month
    if (loadedMonths.has(key)) {
      return
    }

    setIsLoading(true)
    try {
      const result = await fetchCalendarEvents(year, month, userId)

      if (result.success && result.data) {
        // Merge new events with existing ones, avoiding duplicates
        setEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id))
          const newEvents = result.data!.filter(e => !existingIds.has(e.id))
          return [...prev, ...newEvents]
        })

        // Mark this month as loaded
        setLoadedMonths(prev => {
          const newSet = new Set(prev)
          newSet.add(key)
          return newSet
        })
      } else {
        console.error('[CalendarPageClient] Failed to fetch events:', result.error)
      }
    } catch (error) {
      console.error('[CalendarPageClient] Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }, [loadedMonths, userId])

  // Load events when month changes
  useEffect(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    loadEventsForMonth(year, month)

    // Also preload adjacent months for smoother navigation
    loadEventsForMonth(year, month - 1) // Previous month
    loadEventsForMonth(year, month + 1) // Next month
  }, [currentMonth, loadEventsForMonth])

  // Filter events for the visible range (current month and adjacent days)
  const visibleEvents = events.filter(event => {
    const eventDate = new Date(event.start)
    // Show events that are within ~1 week of the current month display
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), -7)
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 7)
    return eventDate >= monthStart && eventDate <= monthEnd
  })

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute top-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 shadow-md">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      )}
      <MonthlyCalendarView
        events={visibleEvents}
        initialDate={initialDate}
        onMonthChange={(newMonth) => {
          if (!isSameMonth(newMonth, currentMonth)) {
            setCurrentMonth(startOfMonth(newMonth))
          }
        }}
      />
    </div>
  )
}
