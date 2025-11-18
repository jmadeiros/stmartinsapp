import { cn } from "@/lib/utils"

interface PartnerAvatarsProps {
  partners: string[]
  maxVisible?: number
  className?: string
}

export function PartnerAvatars({ partners, maxVisible = 4, className }: PartnerAvatarsProps) {
  if (!partners || partners.length === 0) return null

  const visiblePartners = partners.slice(0, maxVisible)
  const remainingCount = partners.length - maxVisible

  const getInitials = (orgName: string) =>
    orgName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 3)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-xs text-muted-foreground font-medium">Collaborating with:</p>
      <div className="flex items-center -space-x-2">
        {visiblePartners.map((partner, index) => (
          <div
            key={index}
            className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary hover:z-10 transition-transform hover:scale-110"
            title={partner}
          >
            {getInitials(partner)}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  )
}

