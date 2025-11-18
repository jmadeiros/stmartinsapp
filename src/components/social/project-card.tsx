"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  CalendarDays,
  Heart,
  MessageCircle,
  Check,
  Target,
  Users,
  Building2,
  Package,
  DollarSign,
  ClipboardList,
  X,
  MoreHorizontal
} from "lucide-react"
import { ContentBadge } from "@/components/ui/content-badge"
import { NeedsChips } from "@/components/ui/needs-chip"
import { PartnerAvatars } from "@/components/ui/partner-avatars"
import { InterestCounter } from "@/components/ui/interest-counter"
import { PostMenu } from "@/components/ui/post-menu"
import type { ProjectPost } from "@/lib/types"
import { cn } from "@/lib/utils"

type ProjectSupportResponse = {
  volunteer: boolean
  bringParticipants: boolean
  participantCount: string
  canPartner: boolean
  provideResources: boolean
  contributeFunding: boolean
}

interface ProjectCardProps {
  project: ProjectPost
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [interested, setInterested] = useState(false)
  const [supportPanelOpen, setSupportPanelOpen] = useState(false)
  const [supportChoices, setSupportChoices] = useState<ProjectSupportResponse>({
    volunteer: false,
    bringParticipants: false,
    participantCount: "",
    canPartner: false,
    provideResources: false,
    contributeFunding: false
  })
  const supportPanelRef = useRef<HTMLDivElement | null>(null)
  const supportTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState<number>(0)
  const [commentCount] = useState<number>(0)
  const [popoverPosition, setPopoverPosition] = useState<{ alignRight: boolean; alignBottom: boolean }>({
    alignRight: true,
    alignBottom: false
  })

  // Collaboration display logic
  const collaborations = project.collaborations ?? []
  const firstCollaborator = collaborations[0]
  const additionalCollaboratorCount = Math.max(collaborations.length - 1, 0)
  const organizationNames = [project.author.organization, ...collaborations.map((collab) => collab.organization)].filter(
    (org): org is string => Boolean(org),
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

  const organizationForRole = project.author.organization || firstCollaborator?.organization
  const roleLine = (() => {
    if (project.author.role && organizationForRole) {
      return `${project.author.role} at ${organizationForRole}`
    }
    if (project.author.role) {
      return project.author.role
    }
    if (organizationForRole) {
      return organizationForRole
    }
    return "Community Member"
  })()

  const hasNeeds =
    !!project.needs &&
    (!!project.needs.volunteersNeeded ||
      (project.needs.participantRequests && project.needs.participantRequests.length > 0) ||
      project.needs.seekingPartners ||
      (project.needs.resourcesRequested && project.needs.resourcesRequested.length > 0) ||
      !!project.needs.fundraisingGoal)

  const hasSelectedSupport =
    supportChoices.volunteer ||
    supportChoices.bringParticipants ||
    supportChoices.canPartner ||
    supportChoices.provideResources ||
    supportChoices.contributeFunding ||
    (!!supportChoices.participantCount && Number(supportChoices.participantCount) > 0)

  const resetSupportChoices = () =>
    setSupportChoices({
      volunteer: false,
      bringParticipants: false,
      participantCount: "",
      canPartner: false,
      provideResources: false,
      contributeFunding: false
    })

  const handleInterestedToggle = () => {
    if (!interested) {
      setInterested(true)
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
    const popoverHeight = 400

    const spaceOnRight = viewportWidth - buttonRect.right
    const spaceOnLeft = buttonRect.left
    const alignRight = spaceOnRight >= popoverWidth || spaceOnRight > spaceOnLeft

    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const alignBottom = spaceBelow < 200 && spaceAbove > spaceBelow + 100

    setPopoverPosition({ alignRight, alignBottom })
  }

  const handleCancelInterest = () => {
    setInterested(false)
    setSupportPanelOpen(false)
    resetSupportChoices()
  }

  const handleSupportSubmit = () => {
    console.log("Project support response:", {
      volunteer: supportChoices.volunteer,
      bringParticipants: supportChoices.bringParticipants,
      participantCount: supportChoices.participantCount
        ? Number(supportChoices.participantCount)
        : undefined,
      canPartner: supportChoices.canPartner,
      provideResources: supportChoices.provideResources,
      contributeFunding: supportChoices.contributeFunding
    })
    console.log("Add project to tracker:", project.title)
    setSupportPanelOpen(false)
  }

  const supportCtaLabel = hasSelectedSupport ? "Confirm & add to tracker" : "Add to tracker"

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
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {collaborations.length > 0 ? (
              <div className="relative h-11 w-11 shrink-0">
                <Avatar className="absolute top-0 left-0 h-8 w-8 ring-2 ring-card z-10">
                  <AvatarImage src={project.author.avatar || "/placeholder.svg"} alt={project.author.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold text-xs">
                    {project.author.name[0]}
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
                <AvatarImage src={project.author.avatar || "/placeholder.svg"} alt={project.author.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                  {project.author.name[0]}
              </AvatarFallback>
            </Avatar>
            )}
            <div className={collaborations.length > 0 ? "ml-1" : ""}>
              <p className="text-sm font-semibold text-foreground leading-tight">{project.author.name}</p>
              {collaborations.length > 0 && organizationLine && (
                <p className="text-sm text-foreground leading-tight mt-0.5">{organizationLine}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                {roleLine} · updated {project.timeAgo}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Badges */}
        {project.cause && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
            <ContentBadge type="cause" label={project.cause} />
            </div>
          )}


        {/* Title */}
        <h2 className="mb-3 text-xl font-bold text-foreground tracking-tight">{project.title}</h2>

        {/* Description */}
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{project.description}</p>

        {/* Impact Goal - Highlighted */}
        <div
          className="mb-4 rounded-xl p-4 border"
          style={{
            background: "linear-gradient(to right, color-mix(in oklch, var(--primary) 5%, transparent), color-mix(in oklch, var(--accent) 5%, transparent))",
            borderColor: "color-mix(in oklch, var(--primary) 20%, transparent)",
          }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Impact Goal</p>
          <p className="text-sm font-semibold text-foreground leading-relaxed">{project.impactGoal}</p>
          </div>

        {/* Progress Bar (if progress tracking enabled) */}
        {project.progress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progress</span>
              <span className="text-xs font-bold text-primary">
                {Math.round((project.progress.current / project.progress.target) * 100)}%
              </span>
          </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((project.progress.current / project.progress.target) * 100, 100)}%` }}
            />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {project.progress.current} / {project.progress.target} {project.progress.unit}
              {project.progress.lastUpdated && ` · Updated ${project.progress.lastUpdated}`}
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {project.targetDate && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 border border-border/50">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Target Date</p>
                <p className="text-xs font-semibold text-foreground">{project.targetDate}</p>
        </div>
            </div>
          )}
          {project.eventsCount !== undefined && project.eventsCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 border border-border/50">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Events</p>
                <p className="text-xs font-semibold text-foreground">{project.eventsCount} upcoming</p>
              </div>
            </div>
          )}
        </div>

        {/* Looking for Section */}
        {project.needs && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Looking for</p>
            <div className="flex flex-wrap gap-2">
              {project.needs.volunteersNeeded && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                  <Heart className="h-3.5 w-3.5" />
                  Volunteers: {project.needs.volunteersNeeded}
                </span>
              )}
              {project.needs.participantRequests && project.needs.participantRequests.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                  <Users className="h-3.5 w-3.5" />
                  Participants: {project.needs.participantRequests.map(req => 
                    req.count ? `${req.programTag} (${req.count})` : req.programTag
                  ).join(", ")}
                </span>
              )}
              {project.needs.resourcesRequested && project.needs.resourcesRequested.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-200">
                  <Package className="h-3.5 w-3.5" />
                  Resources: {project.needs.resourcesRequested.join(", ")}
                </span>
              )}
              {project.needs.fundraisingGoal && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                  <DollarSign className="h-3.5 w-3.5" />
                  Funding: {project.needs.fundraisingGoal} goal
                </span>
              )}
              {project.needs.seekingPartners && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                  <Building2 className="h-3.5 w-3.5" />
                  Partner Collaboration
                </span>
              )}
            </div>
          </div>
        )}

        {/* Partner Organizations */}
        {project.partnerOrgs && project.partnerOrgs.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="-space-x-2 flex">
              {project.partnerOrgs.slice(0, 4).map((partner, idx) => (
                <div
                  key={idx}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br from-primary/15 to-accent/15 text-xs font-semibold uppercase text-primary"
                title={partner}
                >
                  {partner[0]}
                </div>
              ))}
              {project.partnerOrgs.length > 4 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-semibold text-muted-foreground">
                  +{project.partnerOrgs.length - 4}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Collaborating with {project.partnerOrgs.slice(0, 2).join(", ")}
              {project.partnerOrgs.length > 2 && ` and ${project.partnerOrgs.length - 2} others`}
            </p>
          </div>
        )}

        {/* Interest Counter */}
        <InterestCounter 
          orgCount={project.interestedOrgs?.length || 0}
          participantsReferred={project.participantsReferred}
        />

        {/* Footer Actions */}
        <div className="border-t border-border pt-4 mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Like / Comment */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const next = !liked
                  setLiked(next)
                  setLikeCount((c) => c + (next ? 1 : -1))
                }}
              >
                <Heart className={"h-4 w-4 " + (liked ? "text-red-500 fill-red-500" : "")} />
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

            {/* Right: Interested + View */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button
                  ref={supportTriggerRef}
                  variant="ghost"
                  size="sm"
                  onClick={handleInterestedToggle}
                  className={cn(
                    "gap-2 text-sm font-medium transition-all border border-transparent",
                    interested
                      ? "bg-emerald-600 text-white hover:bg-emerald-600/90 border border-emerald-600"
                      : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
                  )}
                >
                  {interested && <Check className="h-4 w-4" />}
                  {interested ? "Interested" : "I'm interested"}
                  <span className={cn(
                    "text-xs font-normal",
                    interested ? "text-emerald-100/80" : "text-emerald-600/70"
                  )}>
                    ({project.interestedOrgs?.length || 0})
                  </span>
                </Button>
                <AnimatePresence initial={false}>
                  {interested && supportPanelOpen && (
                    <motion.div
                      ref={supportPanelRef}
                      key="project-support-popover"
                      initial={{ opacity: 0, y: popoverPosition.alignBottom ? 4 : -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: popoverPosition.alignBottom ? 4 : -4, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "absolute z-30 w-64 rounded-lg border border-emerald-200 bg-white p-3 shadow-xl",
                        popoverPosition.alignRight ? "left-0" : "right-0",
                        popoverPosition.alignBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"
                      )}
                    >
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">Following!</p>
                            <p className="text-[11px] leading-tight text-muted-foreground mt-0.5">
                              Pick ways to help (optional)
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelInterest}
                            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground -mt-0.5"
                          >
                            Cancel
                          </Button>
                        </div>

                        {hasNeeds ? (
                          <div className="space-y-1.5">
                            {project.needs?.volunteersNeeded && (
                              <label className="flex items-start gap-2.5 rounded-md border border-transparent bg-emerald-50/50 p-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={supportChoices.volunteer}
                                  onChange={(e) =>
                                    setSupportChoices((prev) => ({
                                      ...prev,
                                      volunteer: e.target.checked
                                    }))
                                  }
                                  className="mt-0.5 h-3.5 w-3.5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Heart className="h-3 w-3 text-amber-600 shrink-0" />
                                    <span className="text-xs font-medium text-foreground">
                                      Volunteer help
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Need {project.needs.volunteersNeeded} volunteers
                                  </p>
                                </div>
                              </label>
                            )}

                            {project.needs?.participantRequests &&
                              project.needs.participantRequests.length > 0 && (
                                <label className="flex items-start gap-2.5 rounded-md border border-transparent bg-emerald-50/50 p-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={supportChoices.bringParticipants}
                                    onChange={(e) =>
                                      setSupportChoices((prev) => ({
                                        ...prev,
                                        bringParticipants: e.target.checked
                                      }))
                                    }
                                    className="mt-0.5 h-3.5 w-3.5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <Users className="h-3 w-3 text-blue-600 shrink-0" />
                                      <span className="text-xs font-medium text-foreground">
                                        Bring participants
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      {project.needs.participantRequests
                                        .map((req) =>
                                          req.count ? `${req.programTag} (${req.count})` : req.programTag
                                        )
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
                                            participantCount: e.target.value
                                          }))
                                        }
                                        className="mt-1.5 w-full rounded border border-emerald-200 px-2 py-1 text-[11px] focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                                      />
                                    )}
                                  </div>
                                </label>
                              )}

                            {project.needs?.seekingPartners && (
                              <label className="flex items-start gap-2.5 rounded-md border border-transparent bg-emerald-50/50 p-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={supportChoices.canPartner}
                                  onChange={(e) =>
                                    setSupportChoices((prev) => ({
                                      ...prev,
                                      canPartner: e.target.checked
                                    }))
                                  }
                                  className="mt-0.5 h-3.5 w-3.5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="h-3 w-3 text-purple-600 shrink-0" />
                                    <span className="text-xs font-medium text-foreground">
                                      Interested in collaborating
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Connect with the team
                                  </p>
                                </div>
                              </label>
                            )}

                            {project.needs?.resourcesRequested &&
                              project.needs.resourcesRequested.length > 0 && (
                                <label className="flex items-start gap-2.5 rounded-md border border-transparent bg-emerald-50/50 p-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={supportChoices.provideResources}
                                    onChange={(e) =>
                                      setSupportChoices((prev) => ({
                                        ...prev,
                                        provideResources: e.target.checked
                                      }))
                                    }
                                    className="mt-0.5 h-3.5 w-3.5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <Package className="h-3 w-3 text-indigo-600 shrink-0" />
                                      <span className="text-xs font-medium text-foreground">
                                        Provide resources
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      {project.needs.resourcesRequested.join(", ")}
                                    </p>
                                  </div>
                                </label>
                              )}

                            {project.needs?.fundraisingGoal && (
                              <label className="flex items-start gap-2.5 rounded-md border border-transparent bg-emerald-50/50 p-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={supportChoices.contributeFunding}
                                  onChange={(e) =>
                                    setSupportChoices((prev) => ({
                                      ...prev,
                                      contributeFunding: e.target.checked
                                    }))
                                  }
                                  className="mt-0.5 h-3.5 w-3.5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <DollarSign className="h-3 w-3 text-amber-500 shrink-0" />
                                    <span className="text-xs font-medium text-foreground">
                                      Contribute funding
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Goal: {project.needs.fundraisingGoal}
                                  </p>
                                </div>
                              </label>
                            )}
                          </div>
                        ) : (
                          <div className="rounded border border-dashed border-emerald-200 bg-emerald-50/40 p-2 text-[11px] text-muted-foreground">
                            Interest saved—no asks yet.
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSupportPanelOpen(false)}
                          className="w-full text-[11px] text-muted-foreground hover:text-foreground h-7 mt-1"
                        >
                          Done for now
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-emerald-600 hover:text-emerald-700"
                onClick={() => console.log("Navigate to project detail")}
              >
                <Target className="h-4 w-4" />
                View project
              </Button>
              </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
