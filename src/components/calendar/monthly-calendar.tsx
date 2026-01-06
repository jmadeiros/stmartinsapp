"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Monitor,
  CheckCircle2,
  Share2,
  Pencil,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export type CalendarEventKind =
  | "meeting"
  | "interview"
  | "workshop"
  | "training"
  | "partner"
  | "milestone"
  | "outreach"
  | "work"

export type CalendarRsvp = "yes" | "no" | "maybe" | "pending"

export type CalendarAttendee = {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  status?: CalendarRsvp
  isOrganizer?: boolean
  isYou?: boolean
}

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  start: string
  end: string
  timezone?: string
  location?: string
  meetingPlatform?: string
  meetingUrl?: string
  meetingCode?: string
  organizer: {
    name: string
    email: string
    phone?: string
    avatar?: string
  }
  attendees: CalendarAttendee[]
  reminderMinutes?: number
  notes?: string
  tags?: string[]
  kind?: CalendarEventKind
}

type MonthlyCalendarProps = {
  events: CalendarEvent[]
  initialDate?: Date
  onMonthChange?: (newMonth: Date) => void
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const kindThemes: Record<
  CalendarEventKind | "default",
  { card: string; dot: string; badge: string; text: string }
> = {
  meeting: {
    card: "border-blue-100 bg-blue-50/70",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    text: "text-blue-700",
  },
  interview: {
    card: "border-purple-100 bg-purple-50/70",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    text: "text-purple-700",
  },
  workshop: {
    card: "border-amber-100 bg-amber-50/70",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    text: "text-amber-700",
  },
  training: {
    card: "border-emerald-100 bg-emerald-50/70",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
  },
  partner: {
    card: "border-cyan-100 bg-cyan-50/70",
    dot: "bg-cyan-500",
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
    text: "text-cyan-700",
  },
  milestone: {
    card: "border-rose-100 bg-rose-50/70",
    dot: "bg-rose-500",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    text: "text-rose-700",
  },
  outreach: {
    card: "border-slate-200 bg-slate-50/70",
    dot: "bg-slate-500",
    badge: "bg-slate-200 text-slate-800 border-slate-200",
    text: "text-slate-700",
  },
  work: {
    card: "border-gray-200 bg-gray-50/70",
    dot: "bg-gray-500",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    text: "text-gray-700",
  },
  default: {
    card: "border-gray-100 bg-gray-50/80",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    text: "text-gray-600",
  },
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase()

const formatTimeRange = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`
}

const toDayKey = (date: Date) => format(date, "yyyy-MM-dd")

export function MonthlyCalendarView({ events, initialDate, onMonthChange }: MonthlyCalendarProps) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [events],
  )

  const defaultReference = initialDate ?? (sortedEvents[0] ? new Date(sortedEvents[0].start) : new Date())

  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(defaultReference))
  const [selectedDate, setSelectedDate] = useState<Date>(defaultReference)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(sortedEvents[0]?.id ?? null)
  const [rsvp, setRsvp] = useState<CalendarRsvp>("yes")

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    return Array.from({ length: 6 }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => addDays(start, weekIndex * 7 + dayIndex)),
    )
  }, [currentMonth])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    sortedEvents.forEach(event => {
      const key = format(new Date(event.start), "yyyy-MM-dd")
      const existing = map.get(key) ?? []
      existing.push(event)
      existing.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      map.set(key, existing)
    })
    return map
  }, [sortedEvents])

  const selectedEvent = selectedEventId ? sortedEvents.find(event => event.id === selectedEventId) ?? null : null

  const eventsInCurrentMonth = useMemo(
    () => sortedEvents.filter(event => isSameMonth(new Date(event.start), currentMonth)),
    [sortedEvents, currentMonth],
  )

  useEffect(() => {
    if (!selectedEventId && sortedEvents[0]) {
      setSelectedEventId(sortedEvents[0].id)
      setSelectedDate(new Date(sortedEvents[0].start))
      setCurrentMonth(startOfMonth(new Date(sortedEvents[0].start)))
      return
    }
    if (selectedEventId && !sortedEvents.some(event => event.id === selectedEventId)) {
      const fallback = sortedEvents[0]
      setSelectedEventId(fallback?.id ?? null)
      if (fallback) {
        setSelectedDate(new Date(fallback.start))
        setCurrentMonth(startOfMonth(new Date(fallback.start)))
      }
    }
  }, [sortedEvents, selectedEventId])

  useEffect(() => {
    if (
      eventsInCurrentMonth.length &&
      selectedEventId &&
      !eventsInCurrentMonth.some(event => event.id === selectedEventId)
    ) {
      const firstInMonth = eventsInCurrentMonth[0]
      setSelectedEventId(firstInMonth.id)
      setSelectedDate(new Date(firstInMonth.start))
    }
  }, [eventsInCurrentMonth, selectedEventId])

  useEffect(() => {
    if (!selectedEvent) return
    const you = selectedEvent.attendees.find(attendee => attendee.isYou)
    if (you?.status) {
      setRsvp(you.status)
    } else {
      setRsvp("yes")
    }
  }, [selectedEvent])

  const handleGoToday = () => {
    const today = new Date()
    const todayMonth = startOfMonth(today)
    setSelectedDate(today)
    if (!isSameMonth(currentMonth, todayMonth)) {
      setCurrentMonth(todayMonth)
      onMonthChange?.(todayMonth)
    }
    const todaysEvents = eventsByDay.get(toDayKey(today))
    setSelectedEventId(todaysEvents?.[0]?.id ?? selectedEventId)
  }

  const handlePreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
    setSelectedDate(prev => {
      if (isSameMonth(prev, newMonth)) return prev
      return newMonth
    })
    onMonthChange?.(newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
    setSelectedDate(prev => {
      if (isSameMonth(prev, newMonth)) return prev
      return newMonth
    })
    onMonthChange?.(newMonth)
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    if (!isSameMonth(day, currentMonth)) {
      const newMonth = startOfMonth(day)
      setCurrentMonth(newMonth)
      onMonthChange?.(newMonth)
    }
    const dayEvents = eventsByDay.get(toDayKey(day))
    if (dayEvents?.length) {
      setSelectedEventId(dayEvents[0].id)
    } else {
      setSelectedEventId(null)
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEventId(event.id)
    const eventDate = new Date(event.start)
    setSelectedDate(eventDate)
    if (!isSameMonth(eventDate, currentMonth)) {
      setCurrentMonth(startOfMonth(eventDate))
    }
  }

  const goingCount = selectedEvent?.attendees.filter(a => a.status === "yes").length ?? 0

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      {/* Left Panel Column */}
      <div className="space-y-6">
        {/* Page Header with Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(135deg, oklch(0.6 0.118 184.704), oklch(0.52 0.12 166 / 0.8), oklch(0.769 0.188 70.08))",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <CalendarIcon className="h-5 w-5 text-white/80" />
                <span className="text-sm font-medium text-white/80 uppercase tracking-wide">Calendar</span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                {format(currentMonth, "MMMM yyyy")}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  className="p-2 min-h-[44px] min-w-[44px] md:p-2 md:min-h-0 md:min-w-0 text-white/80 transition hover:text-white focus-visible:outline-none flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4 md:h-4 md:w-4" />
                </button>
                <div className="h-4 w-px bg-white/20" />
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 min-h-[44px] min-w-[44px] md:p-2 md:min-h-0 md:min-w-0 text-white/80 transition hover:text-white focus-visible:outline-none flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4 md:h-4 md:w-4" />
                </button>
              </div>
              <Button
                size="sm"
                onClick={handleGoToday}
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm min-h-[44px] md:min-h-0 px-4"
              >
                Today
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl border border-gray-100 bg-white/95 shadow-2xl ring-1 ring-black/5 overflow-hidden"
        >
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {dayLabels.map(label => (
              <div key={label} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                {label}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {weeks.map((week, weekIndex) =>
              week.map((day, dayIndex) => {
                const isCurrentMonthDay = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())
                const isSelected = isSameDay(day, selectedDate)
                const dayEvents = eventsByDay.get(toDayKey(day)) ?? []
                const isLastRow = weekIndex === weeks.length - 1
                const isLastCol = dayIndex === 6

                return (
                  <div
                    key={day.toISOString()}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDayClick(day)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleDayClick(day)
                      }
                    }}
                    className={cn(
                      "relative h-28 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 cursor-pointer",
                      !isLastCol && "border-r border-gray-100",
                      !isLastRow && "border-b border-gray-100",
                      !isCurrentMonthDay && "bg-gray-50/50",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    {/* Date number - absolutely positioned top-left */}
                    <span
                      className={cn(
                        "absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium",
                        isToday && "bg-primary text-white",
                        !isToday && isCurrentMonthDay && "text-gray-900",
                        !isToday && !isCurrentMonthDay && "text-gray-400",
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Event Pills */}
                    <div className="pt-8 px-1 pb-1 space-y-1">
                      {dayEvents.slice(0, 2).map(event => {
                        const theme = kindThemes[event.kind ?? "default"]
                        const isActive = selectedEventId === event.id
                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                            className={cn(
                              "w-full truncate rounded px-1.5 py-1 text-left text-xs font-medium transition-all",
                              theme.card,
                              theme.text,
                              isActive && "ring-1 ring-primary",
                            )}
                          >
                            {event.title}
                          </button>
                        )
                      })}
                      {dayEvents.length > 2 && (
                        <p className="text-[10px] font-medium text-gray-500 pl-1">
                          +{dayEvents.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                )
              }),
            )}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Event Details */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="lg:sticky lg:top-6 lg:self-start"
      >
        {selectedEvent ? (
          <div className="rounded-3xl border border-gray-100 bg-white/95 shadow-2xl ring-1 ring-black/5 overflow-hidden">
            {/* Header with green theme gradient */}
            <div className="border-b border-primary/10 bg-gradient-to-r from-primary/15 via-emerald-50 to-teal-50/80 px-5 py-4">
              <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  kindThemes[selectedEvent.kind ?? "default"].badge,
                )}
              >
                {selectedEvent.kind ?? "Event"}
              </Badge>
              <div className="flex items-center gap-1">
                <button className="rounded-lg p-2 text-primary/60 transition hover:bg-white/60 hover:text-primary">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-primary/60 transition hover:bg-white/60 hover:text-primary">
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-primary/60 transition hover:bg-white/60 hover:text-primary">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-primary/60 transition hover:bg-white/60 hover:text-primary">
                  <X className="h-4 w-4" />
                </button>
              </div>
              </div>
            </div>

            {/* Event Content */}
            <div className="p-5 space-y-5">
              {/* Title & Date */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                  {selectedEvent.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {format(new Date(selectedEvent.start), "EEEE, MMMM d")} · {formatTimeRange(selectedEvent.start, selectedEvent.end)}
                  {selectedEvent.location && ` · ${selectedEvent.location}`}
                </p>
              </div>

              {/* Host */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 shadow-sm">
                  {selectedEvent.organizer.avatar ? (
                    <AvatarImage src={selectedEvent.organizer.avatar} alt={selectedEvent.organizer.name} />
                  ) : (
                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-emerald-100 text-primary">
                      {getInitials(selectedEvent.organizer.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary/60">Hosted by</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedEvent.organizer.name}</p>
                </div>
              </div>

              {/* Going Count & RSVP */}
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-emerald-50/50 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{goingCount}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Going</p>
                </div>
                <Button
                  size="sm"
                  className={cn(
                    "rounded-lg px-6 shadow-sm",
                    rsvp === "yes"
                      ? "bg-primary hover:bg-primary/90 text-white"
                      : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20",
                  )}
                  onClick={() => setRsvp(rsvp === "yes" ? "no" : "yes")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {rsvp === "yes" ? "You're going" : "Going?"}
                </Button>
              </div>

              {/* About */}
              {selectedEvent.description && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    About this event
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Virtual Access */}
              {selectedEvent.meetingUrl && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    Virtual Access
                  </div>
                  <a
                    href={selectedEvent.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                  >
                    {selectedEvent.meetingPlatform ?? "Join meeting"}
                  </a>
                </div>
              )}

              {/* Who's Going */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary/60">Who&apos;s going</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.attendees
                    .filter(a => a.status === "yes")
                    .map(attendee => (
                      <div key={attendee.id} className="group relative">
                        <Avatar className="h-10 w-10 border-2 border-background ring-1 ring-primary/10 shadow-sm transition-transform hover:scale-110">
                          {attendee.avatar ? (
                            <AvatarImage src={attendee.avatar} alt={attendee.name} />
                          ) : (
                            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/10 to-emerald-50 text-primary/80">
                              {getInitials(attendee.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {attendee.isOrganizer && (
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] text-white shadow-sm">
                            ★
                          </span>
                        )}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="rounded-lg bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
                            {attendee.name}
                            {attendee.isOrganizer && " (Host)"}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Notes */}
              {selectedEvent.notes && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700 mb-2">
                    Notes from Organizer
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {selectedEvent.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-primary/20 bg-gradient-to-br from-white/95 to-emerald-50/30 shadow-xl ring-1 ring-black/5 p-8 text-center">
            <CalendarIcon className="mx-auto h-10 w-10 text-primary/30" />
            <p className="mt-3 text-sm font-medium text-gray-600">No event selected</p>
            <p className="mt-1 text-xs text-gray-500">
              Click on an event in the calendar to view details
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
