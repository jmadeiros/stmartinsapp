"use client"

import { AlertTriangle, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface AlertBannerProps {
  id: string
  priority: "high" | "medium"
  title: string
  message: string
  author: {
    name: string
    role: string
    avatar: string
  }
  audience: string
  timeAgo: string
  onDismiss?: (id: string) => void
}

export function AlertBanner({
  id,
  priority,
  title,
  message,
  author,
  audience,
  timeAgo,
  onDismiss,
}: AlertBannerProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-l-4 shadow-md",
        priority === "high" ? "border-l-red-500 bg-red-50/50" : "border-l-amber-500 bg-amber-50/50"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold uppercase",
                priority === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {priority === "high" ? "Priority" : "Notice"}
            </div>
            <span className="text-xs text-gray-500">{timeAgo}</span>
            <span className="text-xs text-gray-400">to</span>
            <span className="text-xs font-medium text-gray-700">{audience}</span>
          </div>

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(id)}
              className="h-6 w-6 p-0 hover:bg-black/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-8 w-8 ring-2 ring-white">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-xs font-semibold">
              {author.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-gray-900">{author.name}</p>
            <p className="text-xs text-gray-600">{author.role}</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        </div>
      </div>
    </Card>
  )
}

