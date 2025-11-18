"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Calendar,
  CalendarDays,
  CalendarPlus,
  Clock,
  MapPin,
  Target,
  Heart,
  MessageCircle,
  Check,
  Users,
  Building2,
  MoreHorizontal,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { EventPost } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ContentBadge } from "@/components/ui/content-badge"
import { PartnerAvatars } from "@/components/ui/partner-avatars"
import { InterestCounter } from "@/components/ui/interest-counter"

type EventSupportResponse = {
  volunteer: boolean
  bringParticipants: boolean
  participantCount: string
  canPartner: boolean
}

interface EventCardProps {
  event: EventPost
}

export function EventCard({ event }: EventCardProps) {
  const [attending, setAttending] = useState(false)
  const [supportPanelOpen, setSupportPanelOpen] = useState(false)
  const [supportChoices, setSupportChoices] = useState<EventSupportResponse>({
    volunteer: false,
    bringParticipants: false,
    participantCount: "",
    canPartner: false,
  })
  const supportPanelRef = useRef<HTMLDivElement | null>(null)
  const supportTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState<number>(0)
  const [commentCount] = useState<number>(0)
  const [popoverPosition, setPopoverPosition] = useState<{ alignRight: boolean; alignBottom: boolean }>({
    alignRight: true,
    alignBottom: false,
  })

  const collaborations = event.collaborations ?? []
  const firstCollaborator = collaborations[0]
  const additionalCollaboratorCount = Math.max(collaborations.length - 1, 0)
  const organizationNames = [event.author.organization, ...collaborations.map((collab) => collab.organization)].filter(
    (org): org is string => Boolean(org)
  )

  const organizationLine = (() => {
    if (organizationNames.length === 0) return null
    if (organizationNames.length === 1) {
      return <span className="font-semibold">{organizationNames[0]}</span>
    }
    if (organizationNames.length === 2) {
      return (
        <>
          <span className="font-semibold">{organizationNames[0]}</span>
          <span className="text-muted-foreground font-normal mx-1">and</span>
          <span className="font-semibold">{organizationNames[1]}</span>
        </>
      )
    }
    return (
      <>
        <span className="font-semibold">{organizationNames[0]}</span>
        <span className="text-muted-foreground font-normal">, </span>
        <span className="font-semibold">{organizationNames[1]}</span>
        <span className="text-muted-foreground font-normal"> · </span>
        <span className="text-muted-foreground font-medium">+{organizationNames.length - 2} others</span>
      </>
    )
  })()

  const organizationForRole = event.author.organization || firstCollaborator?.organization
  const roleLine = (() => {
    if (event.author.role && organizationForRole) {
      return `${event.author.role} at ${organizationForRole}`
    }
    if (event.author.role) {
      return event.author.role
    }
    if (organizationForRole) {
      return organizationForRole
    }
    return "Community Member"
  })()

  const hasNeeds =
    !!event.needs &&
    (!!event.needs.volunteersNeeded ||
      (event.needs.participantRequests && event.needs.participantRequests.length > 0) ||
      event.needs.seekingPartners)

  const hasSelectedSupport =
    supportChoices.volunteer ||
    supportChoices.bringParticipants ||
    supportChoices.canPartner ||
    (!!supportChoices.participantCount && Number(supportChoices.participantCount) > 0)

  const resetSupportChoices = () =>
    setSupportChoices({
      volunteer: false,
      bringParticipants: false,
      participantCount: "",
      canPartner: false,
    })

  const handleAttendToggle = () => {
    if (!attending) {
      setAttending(true)
      setSupportPanelOpen(true)
    } else {
      setSupportPanelOpen((prev) => !prev)
    }
    setTimeout(() => calculatePopoverPosition(), 0)
  }

  const calculatePopoverPosition = () => {
    if (!supportTriggerRef.current) return

    const buttonRect = supportTriggerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const popoverWidth = 256

    const spaceOnRight = viewportWidth - buttonRect.right
    const spaceOnLeft = buttonRect.left
    const alignRight = spaceOnRight >= popoverWidth || spaceOnRight > spaceOnLeft

    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const alignBottom = spaceBelow < 200 && spaceAbove > spaceBelow + 100

    setPopoverPosition({ alignRight, alignBottom })
  }

  const handleCancelAttend = () => {
    setAttending(false)
    setSupportPanelOpen(false)
    resetSupportChoices()
  }

  const handleSupportSubmit = () => {
    console.log("Event support response:", {
      volunteer: supportChoices.volunteer,
      bringParticipants: supportChoices.bringParticipants,
      participantCount: supportChoices.participantCount ? Number(supportChoices.participantCount) : undefined,
      canPartner: supportChoices.canPartner,
    })
    console.log("Add to calendar:", event.title)
    setSupportPanelOpen(false)
  }

  const supportCtaLabel = hasSelectedSupport ? "Confirm & add to calendar" : "Add to calendar"

  useEffect(() => {
    if (!supportPanelOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        supportPanelRef.current &&
        !supportPanelRef.current.contains(target) &&
        supportTriggerRef.current &&
        !supportTriggerRef.current.contains(target)
      ) {
        setSupportPanelOpen(false)
      }
    }

    function handleScroll() {
      calculatePopoverPosition()
    }

    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", handleScroll)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", handleScroll)
    }
  }, [supportPanelOpen])

  return (
    <Card className="border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="!p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {collaborations.length > 0 ? (
              <div className="relative h-11 w-11 shrink-0">
                <Avatar className="absolute top-0 left-0 h-8 w-8 ring-2 ring-card z-10">
                  <AvatarImage src={event.author.avatar || "/placeholder.svg"} alt={event.author.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold text-xs">
                    {event.author.name[0]}
                  </AvatarFallback>
                </Avatar>
                {firstCollaborator && (
                  <Avatar className="absolute bottom-0 right-0 h-8 w-8 ring-2 ring-card z-0">
                    <AvatarImage src={firstCollaborator.avatar || "/placeholder.svg"} alt={firstCollaborator.organization} />
                    <AvatarFallback className="bg-gradient-to-br from-accent/20 to-secondary/20 text-accent font-semibold text-xs">
                      {firstCollaborator.organization[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                {additionalCollaboratorCount > 0 && (
                  <div className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-[10px] font-semibold text-foreground ring-1 ring-border">
                    +{additionalCollaboratorCount}
                  </div>
                )}
              </div>
            ) : (
              <Avatar className="h-10 w-10 ring-2 ring-primary/20 shrink-0">
                <AvatarImage src={event.author.avatar || "/placeholder.svg"} alt={event.author.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                  {event.author.name[0]}
                </AvatarFallback>
              </Avatar>
            )}
            <div className={collaborations.length > 0 ? "ml-1" : ""}>
              <p className="text-sm font-semibold text-foreground leading-tight">{event.author.name}</p>
              {collaborations.length > 0 && organizationLine && (
                <p className="text-sm text-foreground leading-tight mt-0.5">{organizationLine}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                {roleLine} · posted {event.timeAgo}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {event.cause && (
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <ContentBadge type="cause" label={event.cause} />
          </div>
        )}

        <h2 className="mb-3 text-xl font-bold text-foreground tracking-tight">{event.title}</h2>

        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{event.description}</p>

        <div
          className="mb-4 space-y-2 rounded-xl p-4 border"
          style={{
            background: "color-mix(in oklch, var(--muted) 50%, transparent)",
            borderColor: "color-mix(in oklch, var(--border) 50%, transparent)",
          }}
        >
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-foreground">{event.date}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-muted-foreground">{event.time}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="text-muted-foreground">{event.location}</span>
          </div>
        </div>

        {event.parentProjectId && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Part of:</span>
              <button className="font-semibold text-emerald-600 hover:underline">View Parent Project</button>
            </div>
          </div>
        )}

        {event.needs && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Looking for</p>
            <div className="flex flex-wrap gap-2">
              {event.needs.volunteersNeeded && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                  <Heart className="h-3.5 w-3.5" />
                  Volunteers: {event.needs.volunteersNeeded}
                </span>
              )}
              {event.needs.participantRequests && event.needs.participantRequests.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                  <Users className="h-3.5 w-3.5" />
                  Participants:{" "}
                  {event.needs.participantRequests
                    .map((req) => (req.count ? `${req.programTag} (${req.count})` : req.programTag))
                    .join(", ")}
                </span>
              )}
              {event.needs.seekingPartners && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                  <Building2 className="h-3.5 w-3.5" />
                  Partner Collaboration
                </span>
              )}
            </div>
          </div>
        )}

        <InterestCounter
          orgCount={event.interestedOrgs?.length || 0}
          participantsReferred={event.participantsReferred}
          className="mb-4"
        />

        {event.partnerOrgs && event.partnerOrgs.length > 0 && <PartnerAvatars partners={event.partnerOrgs} />}

        <div className="border-t border-border pt-4 mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const next = !liked
                  setLiked(next)
                  setLikeCount((c) => {
                    const nextCount = c + (next ? 1 : -1)
                    return nextCount < 0 ? 0 : nextCount
                  })
                }}
              >
                <Heart className={cn("h-4 w-4", liked && "text-red-500 fill-red-500")} />
                <span className="text-xs">{likeCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => console.log("Open comments")}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{commentCount}</span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Button
                  ref={supportTriggerRef}
                  variant={attending ? "default" : "outline"}
                  size="sm"
                  onClick={handleAttendToggle}
                  className={cn(
                    "gap-2 border border-blue-200 text-sm font-medium",
                    attending ? "bg-blue-600 text-white hover:bg-blue-600/90" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  )}
                >
                  <Check className="h-4 w-4" />
                  {attending ? "Attending" : "Attend"}
                  <span className="text-xs font-normal text-blue-100/80 sm:text-sm sm:font-medium sm:text-inherit">
                    ({event.interestedOrgs?.length || 0})
                  </span>
                </Button>
                <AnimatePresence initial={false}>
                  {attending && supportPanelOpen && (
                    <motion.div
                      ref={supportPanelRef}
                      key="support-popover"
                      initial={{ opacity: 0, y: popoverPosition.alignBottom ? 4 : -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: popoverPosition.alignBottom ? 4 : -4, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "absolute z-30 w-64 rounded-lg border border-blue-200 bg-white p-3 shadow-xl",
                      popoverPosition.alignRight ? "left-0" : "right-0",
                      popoverPosition.alignBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"
                    )}
                    >
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">You're in!</p>
                            <p className="text-[11px] leading-tight text-muted-foreground mt-0.5">
                              Pick ways to pitch in (optional)
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelAttend}
                            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground -mt-0.5"
                          >
                            Cancel
                          </Button>
                        </div>

                        {hasNeeds ? (
                          <div className="space-y-1.5">
                            {event.needs?.volunteersNeeded && (
                              <label className="flex items-start gap-2.5 rounded-md border border-transparent bg-blue-50/50 p-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={supportChoices.volunteer}
                                  onChange={(e) =>
                                    setSupportChoices((prev) => ({
                                      ...prev,
                                      volunteer: e.target.checked,
                                    }))
                                  }
                                  className="mt-0.5 h-3.5 w-3.5 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Heart className="h-3 w-3 text-amber-600 shrink-0" />
                                    <span className="text-xs font-medium text-foreground">Volunteer help</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Need {event.needs.volunteersNeeded} volunteers
                                  </p>
                                </div>
                              </label>
                            )}

                            {event.needs?.participantRequests && event.needs.participantRequests.length > 0 && (
                              <label className="flex items-start gap-2.5 rounded-md border border-transparent bg-blue-50/50 p-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={supportChoices.bringParticipants}
                                  onChange={(e) =>
                                    setSupportChoices((prev) => ({
                                      ...prev,
                                      bringParticipants: e.target.checked,
                                    }))
                                  }
                                  className="mt-0.5 h-3.5 w-3.5 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="h-3 w-3 text-blue-600 shrink-0" />
                                    <span className="text-xs font-medium text-foreground">Bring participants</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {event.needs.participantRequests
                                      .map((req) => (req.count ? `${req.programTag} (${req.count})` : req.programTag))
                                      .join(", ")}
                                  </p>
                                  {supportChoices.bringParticipants && (
                                    <input
                                      type="number"
                                      min={1}
                                      placeholder="How many?"
                                      value={supportChoices.participantCount}
                                      onChange={(e) =>
                                        setSupportChoices((prev) => ({
                                          ...prev,
                                          participantCount: e.target.value,
                                        }))
                                      }
                                      className="mt-1.5 w-full rounded border border-blue-200 px-2 py-1 text-[11px] focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
                                    />
                                  )}
                                </div>
                              </label>
                            )}

                            {event.needs?.seekingPartners && (
                              <label className="flex items-start gap-2.5 rounded-md border border-transparent bg-blue-50/50 p-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={supportChoices.canPartner}
                                  onChange={(e) =>
                                    setSupportChoices((prev) => ({
                                      ...prev,
                                      canPartner: e.target.checked,
                                    }))
                                  }
                                  className="mt-0.5 h-3.5 w-3.5 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="h-3 w-3 text-purple-600 shrink-0" />
                                    <span className="text-xs font-medium text-foreground">Interested in collaborating</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">Connect with the organizing team</p>
                                </div>
                              </label>
                            )}
                          </div>
                        ) : (
                          <div className="rounded border border-dashed border-blue-200 bg-blue-50/40 p-2 text-[11px] text-muted-foreground">
                            RSVP saved—no extra help needed yet.
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5 pt-0.5">
                          <Button
                            size="sm"
                            onClick={handleSupportSubmit}
                            className="w-full gap-1.5 bg-blue-600 text-white hover:bg-blue-600/90 h-8 text-xs"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            {supportCtaLabel}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSupportPanelOpen(false)}
                            className="w-full text-[11px] text-muted-foreground hover:text-foreground h-7"
                          >
                            Done for now
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-blue-600 hover:text-blue-700"
                onClick={() => console.log("Navigate to event detail")}
              >
                <CalendarDays className="h-4 w-4" />
                View event
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

