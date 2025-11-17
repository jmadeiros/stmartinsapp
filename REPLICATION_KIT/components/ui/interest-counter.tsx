import { Users, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface InterestCounterProps {
  orgCount: number
  participantsReferred?: number
  className?: string
}

export function InterestCounter({ orgCount, participantsReferred, className }: InterestCounterProps) {
  if (orgCount === 0 && !participantsReferred) return null

  return (
    <div className={cn("flex items-center gap-4 text-xs text-muted-foreground", className)}>
      {orgCount > 0 && (
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span className="font-medium">
            {orgCount} {orgCount === 1 ? "charity" : "charities"} interested
          </span>
        </div>
      )}
      {participantsReferred && participantsReferred > 0 && (
        <div className="flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          <span className="font-medium">
            {participantsReferred} participants referred
          </span>
        </div>
      )}
    </div>
  )
}


