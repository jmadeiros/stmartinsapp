"use client"

import { useMemo, useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Clock, MapPin, ArrowLeft, ArrowRight } from "lucide-react"

interface Event {
  title: string
  badge?: string
  date: string
  time: string
  location: string
  description: string
  src: string
  attendees: number
  avatars: string[]
}

const events: Event[] = [
  {
    title: "Community Cleanup",
    badge: "Tomorrow",
    date: "March 15, 2024",
    time: "9:00 AM - 12:00 PM",
    location: "Central Park",
    description: "Join us for our monthly neighborhood cleanup event",
    src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2048&auto=format&fit=crop",
    attendees: 24,
    avatars: ["/avatars/1.png", "/avatars/2.png", "/avatars/3.png"],
  },
  {
    title: "Coding Workshop",
    badge: "This Week",
    date: "March 18, 2024",
    time: "2:00 PM - 5:00 PM",
    location: "Tech Hub Downtown",
    description: "Learn web development basics in this hands-on workshop",
    src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2048&auto=format&fit=crop",
    attendees: 15,
    avatars: ["/avatars/4.png", "/avatars/5.png", "/avatars/6.png"],
  },
  {
    title: "Charity Run",
    badge: "Next Week",
    date: "March 22, 2024",
    time: "7:00 AM - 10:00 AM",
    location: "Riverside Trail",
    description: "5K run to raise funds for local children's hospital",
    src: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=2048&auto=format&fit=crop",
    attendees: 42,
    avatars: ["/avatars/7.png", "/avatars/8.png", "/avatars/9.png"],
  },
  {
    title: "Art Exhibition",
    badge: "This Month",
    date: "March 28, 2024",
    time: "6:00 PM - 9:00 PM",
    location: "City Gallery",
    description: "Showcase of local artists' work with wine and refreshments",
    src: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=2048&auto=format&fit=crop",
    attendees: 38,
    avatars: ["/avatars/10.png", "/avatars/11.png", "/avatars/12.png"],
  },
  {
    title: "Food Festival",
    badge: "Next Month",
    date: "April 5, 2024",
    time: "11:00 AM - 8:00 PM",
    location: "Main Street Plaza",
    description: "Taste dishes from 30+ local restaurants and food trucks",
    src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2048&auto=format&fit=crop",
    attendees: 156,
    avatars: ["/avatars/13.png", "/avatars/14.png", "/avatars/15.png"],
  },
]

interface AnimatedEventsProps {
  className?: string
}

export function AnimatedEvents({ className }: AnimatedEventsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const event = useMemo(() => events[activeIndex], [activeIndex])

  const handlePrevWithDirection = () => {
    setActiveIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1))
  }

  const handleNextWithDirection = () => {
    setActiveIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1))
  }

  // Auto-scroll through events every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1))
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("w-full overflow-hidden rounded-xl border shadow-sm bg-card text-card-foreground", className)}>
      <div className="p-4 space-y-4">
        <div className="relative h-48 w-full rounded-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={event.title}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={event.src}
                alt={event.title}
                fill
                sizes="(min-width: 1024px) 320px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {event.badge && (
            <div className="absolute top-3 left-3">
              <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-sm">
                {event.badge}
              </span>
            </div>
          )}

        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground leading-tight">{event.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{event.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm text-foreground/80">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary shrink-0" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>{event.location}</span>
          </div>
        </div>

        {event.attendees && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {event.avatars?.slice(0, 3).map((avatar, i) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="bg-muted text-[10px]">U</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{event.attendees} attending</span>
          </div>
        )}

        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          Join Event
        </Button>

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <button
              onClick={handlePrevWithDirection}
              className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              aria-label="Previous event"
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={handleNextWithDirection}
              className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              aria-label="Next event"
            >
              <ArrowRight className="h-4 w-4 text-foreground" />
            </button>
          </div>

          <div className="flex gap-1">
            {events.map((_, index) => (
              <button
                key={`event-indicator-${index}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  activeIndex === index ? "w-6 bg-primary" : "w-1.5 bg-muted"
                )}
                aria-label={`Go to event ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
