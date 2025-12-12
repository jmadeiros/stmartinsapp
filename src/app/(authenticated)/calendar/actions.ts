'use server'

import { createClient } from "@/lib/supabase/server"
import { getCalendarEvents } from "@/lib/queries/calendar"
import type { CalendarEvent } from "@/components/calendar/monthly-calendar"

export type FetchCalendarEventsResult = {
  success: boolean
  data: CalendarEvent[] | null
  error: string | null
}

/**
 * Server action to fetch calendar events for a specific month
 */
export async function fetchCalendarEvents(
  year: number,
  month: number,
  userId?: string
): Promise<FetchCalendarEventsResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await getCalendarEvents(supabase, year, month, userId)

    if (error) {
      console.error('[fetchCalendarEvents] Error:', error)
      return {
        success: false,
        data: null,
        error: error.message,
      }
    }

    return {
      success: true,
      data,
      error: null,
    }
  } catch (error) {
    console.error('[fetchCalendarEvents] Exception:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
