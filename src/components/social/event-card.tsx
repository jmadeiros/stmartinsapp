"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
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
  Send,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { EventPost } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ContentBadge } from "@/components/ui/content-badge"
import { PartnerAvatars } from "@/components/ui/partner-avatars"
import { InterestCounter } from "@/components/ui/interest-counter"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import {
  getEventComments,
  addEventComment,
  deleteEventComment,
  getEventCommentCount,
  type EventCommentWithAuthor
} from "@/lib/actions/event-comments"
import {
  toggleEventReaction,
  getEventReactionData
} from "@/lib/actions/event-reactions"
import {
  toggleEventRsvp,
  getEventRsvpStatus,
  updateEventRsvpSupport
} from "@/lib/actions/event-rsvp"

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
  const [isLoadingReaction, setIsLoadingReaction] = useState(false)
  const [isLoadingRsvp, setIsLoadingRsvp] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<{ alignRight: boolean; alignBottom: boolean }>({
    alignRight: true,
    alignBottom: false,
  })

  // Comment state
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<EventCommentWithAuthor[]>([])
  const [commentCount, setCommentCount] = useState<number>(0)
  const [newCommentText, setNewCommentText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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

  // Get current user
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id)
      }
    })
  }, [])

  // Fetch comment count on mount
  useEffect(() => {
    async function fetchCommentCount() {
      const { count } = await getEventCommentCount(event.id)
      setCommentCount(count)
    }
    fetchCommentCount()
  }, [event.id])

  // Fetch reaction data on mount
  useEffect(() => {
    async function fetchReactionData() {
      const { count, hasReacted } = await getEventReactionData(event.id)
      setLikeCount(count)
      setLiked(hasReacted)
    }
    fetchReactionData()
  }, [event.id])

  // Fetch RSVP status on mount
  useEffect(() => {
    async function fetchRsvpStatus() {
      const { isRsvped, rsvpData } = await getEventRsvpStatus(event.id)
      setAttending(isRsvped)

      // If RSVP exists, populate support choices
      if (rsvpData) {
        setSupportChoices({
          volunteer: rsvpData.volunteer_offered || false,
          bringParticipants: !!rsvpData.participants_count,
          participantCount: rsvpData.participants_count ? String(rsvpData.participants_count) : "",
          canPartner: rsvpData.can_partner || false,
        })
      }
    }
    fetchRsvpStatus()
  }, [event.id])

  // Handle like toggle
  const handleLikeToggle = async () => {
    if (isLoadingReaction) return

    setIsLoadingReaction(true)
    // Optimistic update
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1)

    const { success, hasReacted } = await toggleEventReaction(event.id)

    if (success) {
      setLiked(hasReacted)
    } else {
      // Revert on failure
      setLiked(wasLiked)
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1)
    }
    setIsLoadingReaction(false)
  }

  const loadComments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getEventComments(event.id)
    if (!error && data) {
      setComments(data)
      setCommentCount(data.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0))
    }
    setLoading(false)
  }, [event.id])

  // Load comments when expanded
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments()
    }
  }, [showComments, comments.length, loadComments])

  const handleAddComment = async () => {
    if (!newCommentText.trim()) return

    setLoading(true)
    const { success, data } = await addEventComment(event.id, newCommentText)
    if (success && data) {
      setNewCommentText("")
      await loadComments()
    }
    setLoading(false)
  }

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim()) return

    setLoading(true)
    const { success } = await addEventComment(event.id, replyText, parentId)
    if (success) {
      setReplyText("")
      setReplyingTo(null)
      await loadComments()
    }
    setLoading(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    setLoading(true)
    const { success } = await deleteEventComment(commentId)
    if (success) {
      await loadComments()
    }
    setLoading(false)
  }

  const handleAttendToggle = async () => {
    if (isLoadingRsvp) return

    setIsLoadingRsvp(true)

    // Optimistically update UI
    const wasAttending = attending
    setAttending(!wasAttending)

    if (!wasAttending) {
      // If not previously attending, open the support panel
      setSupportPanelOpen(true)
    } else {
      // If already attending, toggle the panel
      setSupportPanelOpen((prev) => !prev)
    }

    // Call server action to toggle RSVP
    const { success, isRsvped } = await toggleEventRsvp(event.id)

    if (success) {
      setAttending(isRsvped)
      if (!isRsvped) {
        // If RSVP removed, close panel and reset choices
        setSupportPanelOpen(false)
        resetSupportChoices()
      }
    } else {
      // Revert on failure
      setAttending(wasAttending)
      setSupportPanelOpen(false)
    }

    setIsLoadingRsvp(false)
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

  const handleCancelAttend = async () => {
    if (isLoadingRsvp) return

    setIsLoadingRsvp(true)

    // Optimistically update UI
    setAttending(false)
    setSupportPanelOpen(false)
    resetSupportChoices()

    // Call server action to remove RSVP
    const { success } = await toggleEventRsvp(event.id)

    if (!success) {
      // Revert on failure
      setAttending(true)
    }

    setIsLoadingRsvp(false)
  }

  const handleSupportSubmit = async () => {
    if (isLoadingRsvp) return

    setIsLoadingRsvp(true)

    // Prepare support options
    const supportOptions: {
      volunteer_offered?: boolean
      participants_count?: number | null
      can_partner?: boolean
    } = {}

    if (supportChoices.volunteer) {
      supportOptions.volunteer_offered = true
    }

    if (supportChoices.bringParticipants && supportChoices.participantCount) {
      supportOptions.participants_count = Number(supportChoices.participantCount)
    }

    if (supportChoices.canPartner) {
      supportOptions.can_partner = true
    }

    // Update RSVP with support options
    const { success } = await updateEventRsvpSupport(event.id, supportOptions)

    if (success) {
      console.log("Event support response saved:", supportOptions)
      console.log("Add to calendar:", event.title)
      setSupportPanelOpen(false)
    } else {
      console.error("Failed to save support options")
    }

    setIsLoadingRsvp(false)
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
    <Card className="text-card-foreground flex flex-col rounded-2xl bg-white border border-gray-100 shadow-md transition-shadow hover:shadow-lg">
      <div className="p-4">
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

        <Link href={`/events/${event.id}`} className="block mb-3">
          <h2 className="text-xl font-bold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer">{event.title}</h2>
        </Link>

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
              <button
                onClick={handleLikeToggle}
                disabled={isLoadingReaction}
                className="flex items-center gap-1.5 px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <Heart className={cn(
                  "h-5 w-5 transition-all duration-200",
                  liked ? "fill-rose-500 text-rose-500 scale-110" : "hover:scale-110"
                )} />
                <span className={cn("text-sm tabular-nums", liked && "text-rose-500 font-medium")}>
                  {likeCount}
                </span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className={cn("h-5 w-5", showComments && "text-primary")} />
                <span className="text-sm tabular-nums">{commentCount}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  ref={supportTriggerRef}
                  onClick={handleAttendToggle}
                  disabled={isLoadingRsvp}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50",
                    attending
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50"
                  )}
                >
                  {attending ? (
                    <Check className="h-4 w-4 transition-transform duration-200 scale-110" />
                  ) : (
                    <CalendarPlus className="h-4 w-4" />
                  )}
                  {attending ? "Going" : "RSVP"}
                </button>
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
                      "absolute z-30 w-full sm:w-64 max-w-[90vw] rounded-lg border border-blue-200 bg-white p-3 shadow-xl",
                      popoverPosition.alignRight ? "left-0" : "right-0",
                      popoverPosition.alignBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"
                    )}
                    >
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">You&apos;re in!</p>
                            <p className="text-[11px] leading-tight text-muted-foreground mt-0.5">
                              Pick ways to pitch in (optional)
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelAttend}
                            disabled={isLoadingRsvp}
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
                            disabled={isLoadingRsvp}
                            className="w-full gap-1.5 bg-blue-600 text-white hover:bg-blue-600/90 h-8 text-xs disabled:opacity-50"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            {supportCtaLabel}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSupportPanelOpen(false)}
                            disabled={isLoadingRsvp}
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
              <Link
                href={`/events/${event.id}`}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <CalendarDays className="h-4 w-4" />
                View event
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Comment Input */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">You</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="min-h-[40px] resize-none text-sm"
                disabled={loading}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={loading || !newCommentText.trim()}
                  className="gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  Comment
                </Button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          {loading && comments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <EventCommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onDelete={handleDeleteComment}
                  onReply={(commentId) => setReplyingTo(commentId)}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  handleAddReply={handleAddReply}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// Event Comment Item Component
interface EventCommentItemProps {
  comment: EventCommentWithAuthor
  currentUserId: string | null
  onDelete: (commentId: string) => void
  onReply: (commentId: string) => void
  replyingTo: string | null
  replyText: string
  setReplyText: (text: string) => void
  handleAddReply: (parentId: string) => void
  loading: boolean
  isReply?: boolean
}

function EventCommentItem({
  comment,
  currentUserId,
  onDelete,
  onReply,
  replyingTo,
  replyText,
  setReplyText,
  handleAddReply,
  loading,
  isReply = false
}: EventCommentItemProps) {
  const isAuthor = currentUserId === comment.author_id
  const showReplyForm = replyingTo === comment.id

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks}w ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={isReply ? "ml-12" : ""}>
      <div className="flex gap-3 group">
        <Avatar className="h-8 w-8 ring-2 ring-primary/10">
          <AvatarImage src={comment.author.avatar_url || "/placeholder.svg"} alt={comment.author.full_name} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-xs">
            {comment.author.full_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {comment.author.full_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {comment.created_at ? formatTimeAgo(comment.created_at) : 'just now'}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 px-3">
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onReply(comment.id)}
              >
                Reply
              </Button>
            )}
            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-2 ml-3 flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[40px] resize-none text-sm"
                disabled={loading}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddReply(comment.id)}
                  disabled={loading || !replyText.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReply("")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <EventCommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onReply={onReply}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleAddReply={handleAddReply}
              loading={loading}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

