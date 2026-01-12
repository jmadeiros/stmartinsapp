'use client'

import { useState, useCallback } from 'react'
import { SocialHeader } from '@/components/social/header'
import { OpportunitiesLeftSidebar } from './opportunities-left-sidebar'
import { OpportunitiesBoard } from './opportunities-board'
import { OpportunityDetailPanel } from './opportunity-detail-panel'
import type { OpportunityItem, OpportunityCounts, OpportunityFilter } from '@/app/(authenticated)/opportunities/types'
import type { CardVariant } from './opportunity-card'

interface OpportunitiesPageProps {
  opportunities: OpportunityItem[]
  counts: OpportunityCounts
  currentUserId: string
  variant?: CardVariant
}

export function OpportunitiesPage({
  opportunities,
  counts,
  currentUserId,
  variant = 'board',
}: OpportunitiesPageProps) {
  const [activeFilter, setActiveFilter] = useState<OpportunityFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null)

  const handleSelect = useCallback((opportunity: OpportunityItem) => {
    setSelectedOpportunity(prev =>
      prev?.id === opportunity.id ? null : opportunity
    )
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedOpportunity(null)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        {/* 3-Column Layout (matches Dashboard/People) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
          {/* Left Sidebar: 280px */}
          <OpportunitiesLeftSidebar
            counts={counts}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Main Content: 1fr */}
          <OpportunitiesBoard
            opportunities={opportunities}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            selectedId={selectedOpportunity?.id ?? null}
            onSelect={handleSelect}
            variant={variant}
          />

          {/* Right Sidebar: 320px */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <OpportunityDetailPanel
                opportunity={selectedOpportunity}
                onClose={handleCloseDetail}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
