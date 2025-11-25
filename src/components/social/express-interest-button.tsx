"use client"

import { useState } from "react"
import { Handshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { expressInterest } from "@/lib/actions/collaboration"
import { cn } from "@/lib/utils"

interface ExpressInterestButtonProps {
  resourceType: 'event' | 'project'
  resourceId: string
  resourceTitle: string
  userOrgId?: string
  userId?: string
  className?: string
}

export function ExpressInterestButton({
  resourceType,
  resourceId,
  resourceTitle,
  userOrgId,
  userId,
  className,
}: ExpressInterestButtonProps) {
  const [isExpressing, setIsExpressing] = useState(false)
  const [hasExpressed, setHasExpressed] = useState(false)

  const handleExpressInterest = async () => {
    if (!userOrgId || !userId) {
      console.error('User organization or user ID not available')
      return
    }

    setIsExpressing(true)
    try {
      const result = await expressInterest({
        resourceType,
        resourceId,
        userOrgId,
        userId,
        message: `We're interested in collaborating on "${resourceTitle}"`,
      })

      if (result.success) {
        setHasExpressed(true)
        console.log(`[ExpressInterest] Successfully expressed interest in ${resourceType} ${resourceId}`)
      } else {
        console.error(`[ExpressInterest] Failed:`, result.error)
      }
    } catch (error) {
      console.error(`[ExpressInterest] Exception:`, error)
    } finally {
      setIsExpressing(false)
    }
  }

  return (
    <Button
      variant={hasExpressed ? "default" : "outline"}
      size="sm"
      onClick={handleExpressInterest}
      disabled={isExpressing || hasExpressed}
      className={cn(
        "gap-2 transition-all",
        hasExpressed
          ? "bg-purple-600 text-white hover:bg-purple-600/90 border-purple-200"
          : "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200",
        className
      )}
    >
      <Handshake className="h-4 w-4" />
      {isExpressing ? "Sending..." : hasExpressed ? "Interest Sent" : "Express Interest"}
    </Button>
  )
}
