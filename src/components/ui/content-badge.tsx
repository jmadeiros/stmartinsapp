import { Calendar, Target, Heart, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type BadgeType = "event" | "project" | "update" | "cause"

interface ContentBadgeProps {
  type: BadgeType
  label: string
  className?: string
}

const badgeConfig: Record<
  BadgeType,
  {
    icon: LucideIcon
    gradient: string
    border: string
    text: string
  }
> = {
  event: {
    icon: Calendar,
    gradient: "bg-gradient-to-r from-blue-500/10 to-purple-500/10",
    border: "border-blue-500/20",
    text: "text-blue-600",
  },
  project: {
    icon: Target,
    gradient: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-600",
  },
  update: {
    icon: Heart,
    gradient: "bg-gray-500/10",
    border: "border-gray-500/20",
    text: "text-gray-600",
  },
  cause: {
    icon: Heart,
    gradient: "bg-gradient-to-r from-rose-500/10 to-pink-500/10",
    border: "border-rose-500/20",
    text: "text-rose-600",
  },
}

export function ContentBadge({ type, label, className }: ContentBadgeProps) {
  const config = badgeConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 border",
        config.gradient,
        config.border,
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", config.text)} />
      <span className={cn("text-xs font-semibold uppercase tracking-wider", config.text)}>{label}</span>
    </div>
  )
}

