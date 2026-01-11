'use client'

import { Briefcase, Heart, Handshake, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OpportunityType } from '@/app/(authenticated)/opportunities/types'
import { OPPORTUNITY_TYPE_STYLES } from '@/app/(authenticated)/opportunities/types'

const ICONS: Record<OpportunityType, typeof Briefcase> = {
  job: Briefcase,
  volunteering: Heart,
  collaboration: Handshake,
  funding: DollarSign,
}

const LABELS: Record<OpportunityType, string> = {
  job: 'Job',
  volunteering: 'Volunteering',
  collaboration: 'Collaboration',
  funding: 'Funding',
}

interface OpportunityTypeBadgeProps {
  type: OpportunityType
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function OpportunityTypeBadge({
  type,
  size = 'sm',
  showLabel = true,
  className,
}: OpportunityTypeBadgeProps) {
  const Icon = ICONS[type]
  const style = OPPORTUNITY_TYPE_STYLES[type]
  const label = LABELS[type]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        style.bg,
        style.text,
        style.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {showLabel && <span>{label}</span>}
    </span>
  )
}

interface OpportunityTypeBadgesProps {
  types: OpportunityType[]
  size?: 'sm' | 'md'
  showLabels?: boolean
  className?: string
}

export function OpportunityTypeBadges({
  types,
  size = 'sm',
  showLabels = true,
  className,
}: OpportunityTypeBadgesProps) {
  if (types.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {types.map(type => (
        <OpportunityTypeBadge
          key={type}
          type={type}
          size={size}
          showLabel={showLabels}
        />
      ))}
    </div>
  )
}
