'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Briefcase,
  Heart,
  Handshake,
  DollarSign,
  Plus,
  Bookmark,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OpportunityFilter, OpportunityCounts } from '@/app/(authenticated)/opportunities/types'

const CATEGORY_ITEMS: {
  filter: OpportunityFilter
  label: string
  icon: typeof Briefcase
  countKey: keyof OpportunityCounts
}[] = [
  { filter: 'jobs', label: 'Jobs', icon: Briefcase, countKey: 'jobs' },
  { filter: 'volunteering', label: 'Volunteering', icon: Heart, countKey: 'volunteering' },
  { filter: 'collaboration', label: 'Collaboration', icon: Handshake, countKey: 'collaboration' },
  { filter: 'funding', label: 'Funding', icon: DollarSign, countKey: 'funding' },
]

interface OpportunitiesLeftSidebarProps {
  counts: OpportunityCounts
  activeFilter: OpportunityFilter
  onFilterChange: (filter: OpportunityFilter) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function OpportunitiesLeftSidebar({
  counts,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: OpportunitiesLeftSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Categories</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {CATEGORY_ITEMS.map(({ filter, label, icon: Icon, countKey }) => (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter === activeFilter ? 'all' : filter)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg',
                  'text-sm transition-colors',
                  'hover:bg-muted',
                  activeFilter === filter && 'bg-primary/10 text-primary font-medium'
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  activeFilter === filter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {counts[countKey]}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <FileText className="h-4 w-4" />
              My Posts
            </Link>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-muted-foreground"
              disabled
            >
              <Bookmark className="h-4 w-4" />
              Saved
              <span className="text-xs">(coming soon)</span>
            </button>
          </CardContent>
        </Card>

        {/* Post New */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <Button asChild className="w-full">
              <Link href="/dashboard?compose=opportunity">
                <Plus className="h-4 w-4 mr-2" />
                Post Opportunity
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Share a job, volunteer role, or partnership request
            </p>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
