'use client'

import { useMemo } from 'react'
import { Briefcase, Heart, Handshake, DollarSign, Inbox, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OpportunityCard, type CardVariant } from './opportunity-card'
import type { OpportunityItem, OpportunityFilter, OpportunityType } from '@/app/(authenticated)/opportunities/types'

// Filter configuration with Lucide icons
const FILTER_CONFIG: { value: OpportunityFilter; label: string; icon: typeof Briefcase }[] = [
  { value: 'all', label: 'All', icon: LayoutGrid },
  { value: 'jobs', label: 'Jobs', icon: Briefcase },
  { value: 'volunteering', label: 'Volunteering', icon: Heart },
  { value: 'collaboration', label: 'Collaboration', icon: Handshake },
  { value: 'funding', label: 'Funding', icon: DollarSign },
]

interface OpportunitiesBoardProps {
  opportunities: OpportunityItem[]
  activeFilter: OpportunityFilter
  onFilterChange: (filter: OpportunityFilter) => void
  searchQuery: string
  selectedId: string | null
  onSelect: (opportunity: OpportunityItem) => void
  variant?: CardVariant
}

const FILTER_TO_TYPE: Record<Exclude<OpportunityFilter, 'all'>, OpportunityType> = {
  jobs: 'job',
  volunteering: 'volunteering',
  collaboration: 'collaboration',
  funding: 'funding',
}

const EMPTY_STATES: Record<OpportunityFilter, { icon: typeof Inbox; title: string; description: string }> = {
  all: {
    icon: Inbox,
    title: 'No opportunities yet',
    description: 'Be the first to post an opportunity or create an event/project that needs help.',
  },
  jobs: {
    icon: Briefcase,
    title: 'No job opportunities',
    description: 'Share a job or volunteer position by creating an "Opportunities" post.',
  },
  volunteering: {
    icon: Heart,
    title: 'No volunteer opportunities',
    description: 'Events and projects needing volunteers will appear here.',
  },
  collaboration: {
    icon: Handshake,
    title: 'No collaboration requests',
    description: 'Organizations seeking partners will appear here.',
  },
  funding: {
    icon: DollarSign,
    title: 'No fundraising opportunities',
    description: 'Projects with fundraising goals will appear here.',
  },
}

export function OpportunitiesBoard({
  opportunities,
  activeFilter,
  onFilterChange,
  searchQuery,
  selectedId,
  onSelect,
  variant = 'board',
}: OpportunitiesBoardProps) {
  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities

    // Apply type filter
    if (activeFilter !== 'all') {
      const type = FILTER_TO_TYPE[activeFilter]
      filtered = filtered.filter(o => o.opportunityTypes.includes(type))
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(o =>
        o.title.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        o.author.name.toLowerCase().includes(query) ||
        o.author.organization?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [opportunities, activeFilter, searchQuery])

  const emptyState = EMPTY_STATES[activeFilter]

  return (
    <main className="min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Community Board
        </h1>
        <p className="text-muted-foreground">
          Find jobs, volunteer roles, and collaboration opportunities
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6" role="tablist">
        {FILTER_CONFIG.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeFilter === value}
            data-tab={value}
            onClick={() => onFilterChange(value)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'border',
              activeFilter === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Grid - masonry for board, regular grid for clean */}
      {filteredOpportunities.length > 0 ? (
        <div className={cn(
          variant === 'board'
            ? 'columns-1 sm:columns-2 xl:columns-3 gap-4'
            : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
        )}>
          {filteredOpportunities.map(opportunity => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              isSelected={selectedId === opportunity.id}
              onClick={() => onSelect(opportunity)}
              variant={variant}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <emptyState.icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            {emptyState.title}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {emptyState.description}
          </p>
        </div>
      )}
    </main>
  )
}
