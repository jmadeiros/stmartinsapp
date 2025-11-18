import { Sparkles, Trophy, Handshake, HelpCircle, Lightbulb, MessageSquare, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { PostCategory } from "@/lib/social/types"

interface CategoryBadgeProps {
  category: PostCategory
  className?: string
}

type CategoryConfig = Record<
  PostCategory,
  {
    icon: LucideIcon
    label: string
    gradient: string
    border: string
    text: string
  }
>

export const categoryConfig: CategoryConfig = {
  intros: {
    icon: Sparkles,
    label: "Intros",
    gradient: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10",
    border: "border-blue-500/20",
    text: "text-blue-600",
  },
  wins: {
    icon: Trophy,
    label: "Wins",
    gradient: "bg-gradient-to-r from-amber-500/10 to-yellow-500/10",
    border: "border-amber-500/20",
    text: "text-amber-600",
  },
  opportunities: {
    icon: Handshake,
    label: "Opportunities",
    gradient: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-600",
  },
  questions: {
    icon: HelpCircle,
    label: "Questions",
    gradient: "bg-gradient-to-r from-purple-500/10 to-violet-500/10",
    border: "border-purple-500/20",
    text: "text-purple-600",
  },
  learnings: {
    icon: Lightbulb,
    label: "Learnings",
    gradient: "bg-gradient-to-r from-orange-500/10 to-red-500/10",
    border: "border-orange-500/20",
    text: "text-orange-600",
  },
  general: {
    icon: MessageSquare,
    label: "General",
    gradient: "bg-gray-500/10",
    border: "border-gray-500/20",
    text: "text-gray-600",
  },
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category]
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
      <span className={cn("text-xs font-semibold uppercase tracking-wider", config.text)}>{config.label}</span>
    </div>
  )
}

