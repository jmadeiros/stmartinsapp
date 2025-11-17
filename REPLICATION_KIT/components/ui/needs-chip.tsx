import { HandHeart, Users, Package, DollarSign, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Needs, ParticipantRequest } from "@/lib/types"

type ChipType = "volunteers" | "participants" | "resources" | "funding"

interface ChipConfig {
  icon: LucideIcon
  bg: string
  border: string
  text: string
}

const chipConfig: Record<ChipType, ChipConfig> = {
  volunteers: {
    icon: HandHeart,
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-700"
  },
  participants: {
    icon: Users,
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-700"
  },
  resources: {
    icon: Package,
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-700"
  },
  funding: {
    icon: DollarSign,
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-700"
  }
}

interface NeedsChipProps {
  type: ChipType
  label: string
  className?: string
}

function NeedsChip({ type, label, className }: NeedsChipProps) {
  const config = chipConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium",
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  )
}

interface NeedsChipsProps {
  needs?: Needs
  status?: "Open" | "Closed"
  className?: string
}

export function NeedsChips({ needs, status, className }: NeedsChipsProps) {
  if (status === "Closed") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-gray-500/10 border-gray-500/20 text-gray-700">
          Closed to new support
        </div>
      </div>
    )
  }

  if (!needs) return null

  const chips: { type: ChipType; label: string; priority: number }[] = []

  // Priority 1: Participants
  if (needs.participantRequests && needs.participantRequests.length > 0) {
    needs.participantRequests.forEach((req: ParticipantRequest) => {
      const label = req.count 
        ? `${req.programTag} (${req.count})`
        : req.programTag
      chips.push({ type: "participants", label: `Participants: ${label}`, priority: 1 })
    })
  }

  // Priority 2: Volunteers
  if (needs.volunteersNeeded) {
    chips.push({ 
      type: "volunteers", 
      label: `Volunteers: ${needs.volunteersNeeded}`,
      priority: 2 
    })
  }

  // Priority 3: Resources
  if (needs.resourcesRequested && needs.resourcesRequested.length > 0) {
    const resourceLabel = needs.resourcesRequested.join(", ")
    chips.push({ 
      type: "resources", 
      label: `Resources: ${resourceLabel}`,
      priority: 3 
    })
  }

  // Priority 4: Funding
  if (needs.fundraisingGoal) {
    chips.push({ 
      type: "funding", 
      label: `Funding: ${needs.fundraisingGoal} goal`,
      priority: 4 
    })
  }

  if (chips.length === 0) return null

  // Show max 3 chips, sorted by priority
  const displayChips = chips.sort((a, b) => a.priority - b.priority).slice(0, 3)

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {displayChips.map((chip, index) => (
        <NeedsChip key={index} type={chip.type} label={chip.label} />
      ))}
    </div>
  )
}


