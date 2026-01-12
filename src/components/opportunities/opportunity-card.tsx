'use client'

import { format } from 'date-fns'
import { Calendar, MapPin, Users, Building2, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { OpportunityTypeBadges } from './opportunity-type-badge'
import type { OpportunityItem } from '@/app/(authenticated)/opportunities/types'
import { CARD_TINTS } from '@/app/(authenticated)/opportunities/types'

export type CardVariant = 'board' | 'clean'

interface OpportunityCardProps {
  opportunity: OpportunityItem
  isSelected?: boolean
  onClick?: () => void
  variant?: CardVariant
}

export function OpportunityCard({
  opportunity,
  isSelected = false,
  onClick,
  variant = 'board',
}: OpportunityCardProps) {
  const primaryType = opportunity.opportunityTypes[0] || 'job'
  const tint = CARD_TINTS[primaryType]
  const isBoard = variant === 'board'

  // Pin position varies based on rotation
  const pinPosition = opportunity.rotation > 0 ? 'right-3' : 'left-3'

  return (
    <button
      type="button"
      onClick={onClick}
      data-opportunity={opportunity.title}
      className={cn(
        'group relative w-full text-left break-inside-avoid mb-4',
        'rounded-xl border bg-card text-card-foreground transition-all duration-200',
        isBoard ? 'shadow-md' : 'shadow-lg',
        'hover:shadow-xl hover:scale-[1.01] hover:z-10',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        isBoard && tint,
        isSelected && 'ring-2 ring-primary shadow-xl scale-[1.01]',
      )}
      style={isBoard ? { transform: `rotate(${opportunity.rotation}deg)` } : undefined}
    >
      {/* Pin/thumbtack accent - only in board variant */}
      {isBoard && (
        <div
          className={cn(
            'absolute -top-2 w-4 h-4 rounded-full bg-red-500 shadow-md',
            'border-2 border-red-600',
            pinPosition
          )}
        />
      )}

      <div className={cn('p-4', isBoard && 'pt-5')}>
        {/* Type badges */}
        <OpportunityTypeBadges
          types={opportunity.opportunityTypes}
          size="sm"
          showLabels={opportunity.opportunityTypes.length === 1}
          className="mb-2"
        />

        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {opportunity.title}
        </h3>

        {/* Description preview */}
        {opportunity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {opportunity.description}
          </p>
        )}

        {/* Source-specific details */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {/* Event date */}
          {opportunity.source === 'event' && opportunity.startDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(opportunity.startDate), 'MMM d, yyyy')}</span>
            </div>
          )}

          {/* Location */}
          {opportunity.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{opportunity.location}</span>
            </div>
          )}

          {/* Volunteers needed */}
          {opportunity.volunteersNeeded && opportunity.volunteersNeeded > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600">
              <Users className="h-3 w-3" />
              <span>{opportunity.volunteersNeeded} volunteers needed</span>
            </div>
          )}

          {/* Funding goal */}
          {opportunity.fundingGoal && (
            <div className="flex items-center gap-1.5 text-green-600">
              <Target className="h-3 w-3" />
              <span>{opportunity.fundingGoal} goal</span>
            </div>
          )}
        </div>

        {/* Footer: Author and source */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-5 w-5">
              <AvatarImage src={opportunity.author.avatar || undefined} />
              <AvatarFallback className="text-[10px]">
                {opportunity.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {opportunity.author.organization || opportunity.author.name}
            </span>
          </div>

          {/* Source indicator */}
          <span className={cn(
            'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded',
            opportunity.source === 'event' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            opportunity.source === 'project' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            opportunity.source === 'post' && 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
          )}>
            {opportunity.source}
          </span>
        </div>
      </div>
    </button>
  )
}
