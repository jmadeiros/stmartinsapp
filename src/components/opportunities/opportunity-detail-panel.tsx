'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import {
  Calendar,
  MapPin,
  Users,
  Building2,
  Target,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { OpportunityTypeBadges } from './opportunity-type-badge'
import type { OpportunityItem } from '@/app/(authenticated)/opportunities/types'

interface OpportunityDetailPanelProps {
  opportunity: OpportunityItem | null
  onClose?: () => void
}

export function OpportunityDetailPanel({
  opportunity,
  onClose,
}: OpportunityDetailPanelProps) {
  if (!opportunity) {
    return (
      <Card className="h-full" data-panel="opportunity-detail-empty">
        <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            Select an Opportunity
          </h3>
          <p className="text-sm text-muted-foreground">
            Click on any card to see more details
          </p>
        </CardContent>
      </Card>
    )
  }

  const sourceUrl =
    opportunity.source === 'event'
      ? `/calendar?event=${opportunity.sourceId}`
      : opportunity.source === 'project'
      ? `/projects/${opportunity.sourceId}`
      : `/dashboard?post=${opportunity.sourceId}`

  return (
    <Card className="h-full overflow-hidden" data-panel="opportunity-detail">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <OpportunityTypeBadges
          types={opportunity.opportunityTypes}
          size="md"
          showLabels={true}
        />
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mr-2 -mt-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Title */}
        <h2 className="text-xl font-bold text-foreground leading-tight">
          {opportunity.title}
        </h2>

        {/* Author/Organization */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={opportunity.author.avatar || undefined} />
            <AvatarFallback>
              {opportunity.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {opportunity.author.name}
            </p>
            {opportunity.author.organization && (
              <p className="text-sm text-muted-foreground truncate">
                {opportunity.author.organization}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {opportunity.description && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">About</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {opportunity.description}
            </p>
          </div>
        )}

        {/* Details section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Details</h4>

          {/* Event date */}
          {opportunity.source === 'event' && opportunity.startDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(opportunity.startDate), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Project target date */}
          {opportunity.source === 'project' && opportunity.targetDate && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>
                Target: {format(new Date(opportunity.targetDate), 'MMMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Location */}
          {opportunity.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{opportunity.location}</span>
            </div>
          )}

          {/* Time ago */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Posted {opportunity.timeAgo}</span>
          </div>
        </div>

        {/* What they're seeking */}
        {(opportunity.volunteersNeeded || opportunity.fundingGoal || opportunity.opportunityTypes.includes('collaboration')) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Seeking</h4>
            <ul className="space-y-1">
              {opportunity.volunteersNeeded && opportunity.volunteersNeeded > 0 && (
                <li className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span>{opportunity.volunteersNeeded} volunteers</span>
                </li>
              )}
              {opportunity.opportunityTypes.includes('collaboration') && (
                <li className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  <span>Partner organizations</span>
                </li>
              )}
              {opportunity.fundingGoal && (
                <li className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-green-500" />
                  <span>{opportunity.fundingGoal} funding goal</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 space-y-2">
          <Button asChild className="w-full">
            <Link href={sourceUrl}>
              View {opportunity.source === 'event' ? 'Event' : opportunity.source === 'project' ? 'Project' : 'Post'}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {opportunity.source === 'event' && (
            <Button variant="outline" className="w-full" asChild>
              <Link href={sourceUrl}>
                RSVP
              </Link>
            </Button>
          )}

          {opportunity.source === 'project' && (
            <Button variant="outline" className="w-full" asChild>
              <Link href={sourceUrl}>
                Express Interest
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
