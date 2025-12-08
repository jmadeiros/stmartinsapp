"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Target, Users, MapPin, Calendar, ArrowRight } from "lucide-react"
import type { ProjectPost } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProjectGridCardProps {
  project: ProjectPost
}

export function ProjectGridCard({ project }: ProjectGridCardProps) {
  const router = useRouter()
  
  // Calculate progress percentage
  const progressPercent = project.progress 
    ? Math.min((project.progress.current / project.progress.target) * 100, 100)
    : 0

  return (
    <Card 
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-emerald-200/50 cursor-pointer"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      {/* Image/Gradient Header */}
      <div className="h-32 w-full bg-gradient-to-br from-emerald-50 to-teal-100/50 p-4 relative">
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-emerald-800 shadow-sm border-0 font-medium text-[10px] uppercase tracking-wider">
            {project.cause || "Community"}
          </Badge>
        </div>
        
        {/* Author Avatar overlapping bottom */}
        <div className="absolute -bottom-5 left-4">
          <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
            <AvatarImage src={project.author.avatar || "/placeholder.svg"} />
            <AvatarFallback>{project.author.name[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 pt-7">
        {/* Author Name */}
        <div className="mb-2">
           <p className="text-xs text-muted-foreground">{project.author.organization}</p>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {project.title}
        </h3>

        {/* Short Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {project.description}
        </p>

        {/* Metadata */}
        <div className="space-y-3">
          {project.progress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">Progress</span>
                <span className="font-bold text-emerald-600">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
            {project.serviceArea && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate max-w-[80px]">{project.serviceArea}</span>
              </div>
            )}
            {project.needs?.volunteersNeeded && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{project.needs.volunteersNeeded} vols</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

