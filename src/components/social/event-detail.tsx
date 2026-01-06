"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Building2,
  Check,
  CalendarPlus,
  Share2,
  Pencil,
  MoreHorizontal,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { rsvpToEvent } from "@/lib/queries/feed"
import { createClient } from "@/lib/supabase/client"
import { CommentSection } from "./comment-section"
import { CollaboratorManagement } from "./collaborator-management"

type EventDetailProps = {
  event: any
  currentUserId: string
  currentUserOrgId: string
}

export function EventDetail({ event, currentUserId, currentUserOrgId }: EventDetailProps) {
  const supabase = createClient()

  // Check if current user is the organizer
  const isOrganizer = event.organizer?.user_id === currentUserId

  // Check if current user's org owns this event
  const isOwner = event.org_id === currentUserOrgId

  // Check if current user has RSVPed
  const userRsvp = event.rsvps?.find((rsvp: any) => rsvp.user_id === currentUserId)
  const [isAttending, setIsAttending] = useState(!!userRsvp)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Format date and time
  const startDate = new Date(event.start_time)
  const endDate = new Date(event.end_time)
  const formattedDate = format(startDate, "EEEE, MMMM d, yyyy")
  const formattedTime = `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`

  // Get attendee count (RSVPs with status 'interested' or 'going')
  const attendees = event.rsvps?.filter((rsvp: any) =>
    rsvp.status === 'interested' || rsvp.status === 'going'
  ) || []
  const attendeeCount = attendees.length

  // Get collaborating organizations
  const collaboratorOrgs = event.collaborations?.map((collab: any) =>
    collab.collaborator_org
  ) || []

  const handleRsvp = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      if (isAttending) {
        // Remove RSVP - delete from database
        const { error } = await supabase
          .from('event_rsvps')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', currentUserId)

        if (error) {
          console.error('[EventDetail] Error removing RSVP:', error)
        } else {
          setIsAttending(false)
        }
      } else {
        // Add RSVP
        const result = await rsvpToEvent(supabase, {
          eventId: event.id,
          userId: currentUserId,
          orgId: event.org_id,
          status: 'interested',
          volunteerOffered: false,
          canPartner: false,
        })

        if (!result.error) {
          setIsAttending(true)
        } else {
          console.error('[EventDetail] Error creating RSVP:', result.error)
        }
      }
    } catch (error) {
      console.error('[EventDetail] Exception during RSVP:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      }).catch(() => {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href)
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left Column - Event Details */}
          <div className="space-y-6">
            {/* Event Card */}
            <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
              {/* Header */}
              <div className="border-b border-gray-100 bg-gradient-to-r from-primary/5 to-emerald-50/50 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {event.cause && (
                        <Badge variant="outline" className="bg-white/80">
                          {event.cause}
                        </Badge>
                      )}
                      <Badge
                        variant={event.status === 'Open' ? 'default' : 'secondary'}
                        className="bg-white/80"
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                      {event.title}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShare}
                      className="shrink-0"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    {isOrganizer && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="shrink-0"
                      >
                        <Link href={`/events/${event.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Date, Time, Location */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{formattedDate}</p>
                      <p className="text-sm text-muted-foreground">Event date</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{formattedTime}</p>
                      <p className="text-sm text-muted-foreground">Duration</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{event.location}</p>
                      <p className="text-sm text-muted-foreground">Location</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <div className="pt-4 border-t border-gray-100">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      About this event
                    </h2>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Needs Section */}
                {(event.volunteers_needed || event.seeking_partners) && (
                  <div className="pt-4 border-t border-gray-100">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Looking for
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {event.volunteers_needed && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Heart className="h-3.5 w-3.5 mr-1.5" />
                          {event.volunteers_needed} Volunteers
                        </Badge>
                      )}
                      {event.seeking_partners && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Building2 className="h-3.5 w-3.5 mr-1.5" />
                          Partner Collaboration
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Collaborating Organizations */}
                {collaboratorOrgs.length > 0 && (
                  <CollaboratorManagement
                    resourceType="event"
                    resourceId={event.id}
                    ownerOrgId={event.org_id}
                    currentUserOrgId={currentUserOrgId}
                    collaborators={collaboratorOrgs}
                    isOwner={isOwner}
                    onCollaboratorRemoved={() => {
                      // Refresh the page to get updated data
                      window.location.reload()
                    }}
                  />
                )}
              </div>
            </Card>

            {/* Comments Section */}
            <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
              <div className="p-6">
                <CommentSection
                  resourceType="event"
                  resourceId={event.id}
                  currentUserId={currentUserId}
                />
              </div>
            </Card>
          </div>

          {/* Right Column - Organizer & Attendees */}
          <div className="space-y-6">
            {/* RSVP Card */}
            <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{attendeeCount}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {attendeeCount === 1 ? 'Person' : 'People'} Going
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleRsvp}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full gap-2 transition-all",
                    isAttending
                      ? "bg-primary hover:bg-primary/90 text-white"
                      : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                  )}
                >
                  {isAttending ? (
                    <>
                      <Check className="h-4 w-4" />
                      You&apos;re going
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="h-4 w-4" />
                      RSVP to attend
                    </>
                  )}
                </Button>

                {isAttending && (
                  <p className="text-xs text-center text-muted-foreground">
                    Click again to remove RSVP
                  </p>
                )}
              </div>
            </Card>

            {/* Organizer Card */}
            <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
              <div className="p-6">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                  Organized by
                </h2>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage
                      src={event.organizer?.avatar_url}
                      alt={event.organizer?.full_name || 'Organizer'}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                      {event.organizer?.full_name?.[0] || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {event.organizer?.full_name || 'Unknown'}
                    </p>
                    {event.organizer?.role && (
                      <p className="text-sm text-muted-foreground truncate">
                        {event.organizer.role}
                      </p>
                    )}
                    {event.organization?.name && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {event.organization.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Attendees Card */}
            {attendees.length > 0 && (
              <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
                <div className="p-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                    Attendees ({attendeeCount})
                  </h2>
                  <div className="space-y-3">
                    {attendees.slice(0, 10).map((rsvp: any) => (
                      <div key={rsvp.id} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                          <AvatarImage
                            src={rsvp.attendee?.avatar_url}
                            alt={rsvp.attendee?.full_name || 'Attendee'}
                          />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-accent/10">
                            {rsvp.attendee?.full_name?.[0] || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {rsvp.attendee?.full_name || 'Unknown'}
                            {rsvp.user_id === currentUserId && ' (You)'}
                          </p>
                          {rsvp.attendee?.role && (
                            <p className="text-xs text-muted-foreground truncate">
                              {rsvp.attendee.role}
                            </p>
                          )}
                        </div>
                        {rsvp.volunteer_offered && (
                          <Heart className="h-4 w-4 text-amber-600 shrink-0" />
                        )}
                        {rsvp.can_partner && (
                          <Building2 className="h-4 w-4 text-purple-600 shrink-0" />
                        )}
                      </div>
                    ))}
                    {attendees.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        And {attendees.length - 10} more...
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
