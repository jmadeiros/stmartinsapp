// Opportunity types for the Community Board

export type OpportunityType = 'job' | 'volunteering' | 'collaboration' | 'funding'
export type OpportunitySource = 'post' | 'event' | 'project'
export type OpportunityFilter = 'all' | 'jobs' | 'volunteering' | 'collaboration' | 'funding'

export interface OpportunityAuthor {
  id: string
  name: string
  avatar: string | null
  organization?: string
}

export interface OpportunityItem {
  id: string
  source: OpportunitySource
  sourceId: string
  title: string
  description: string
  opportunityTypes: OpportunityType[]
  author: OpportunityAuthor
  createdAt: string
  timeAgo: string
  orgId: string
  // Source-specific fields
  imageUrl?: string | null      // Posts
  startDate?: string | null     // Events
  location?: string | null      // Events
  targetDate?: string | null    // Projects
  volunteersNeeded?: number | null
  fundingGoal?: string | null   // Projects
  status?: string | null        // Projects
  // Computed for display
  rotation: number              // -1 to 1 degree for bulletin board effect
}

export interface OpportunityCounts {
  all: number
  jobs: number
  volunteering: number
  collaboration: number
  funding: number
}

// Filter tab configuration (icons handled in component with Lucide)
export const FILTER_TABS: { value: OpportunityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'volunteering', label: 'Volunteering' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'funding', label: 'Funding' },
]

// Badge color configuration
export const OPPORTUNITY_TYPE_STYLES: Record<OpportunityType, { bg: string; text: string; border: string }> = {
  job: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
  },
  volunteering: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
  },
  collaboration: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/20',
  },
  funding: {
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    border: 'border-green-500/20',
  },
}

// Card background tints per primary type
export const CARD_TINTS: Record<OpportunityType, string> = {
  job: 'bg-blue-50/50 dark:bg-blue-950/20',
  volunteering: 'bg-amber-50/50 dark:bg-amber-950/20',
  collaboration: 'bg-purple-50/50 dark:bg-purple-950/20',
  funding: 'bg-green-50/50 dark:bg-green-950/20',
}
