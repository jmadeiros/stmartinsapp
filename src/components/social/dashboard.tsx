import { SocialHeader } from "./header"
import { SocialLeftSidebar } from "./left-sidebar"
import { SocialRightSidebar } from "./right-sidebar"
import { MainFeed } from "./main-feed"
import type { FeedItem } from "@/lib/types"

interface SocialDashboardProps {
  userName?: string
  feedItems?: FeedItem[]
  userId?: string
  orgId?: string
}

export function SocialDashboard({ userName, feedItems, userId, orgId }: SocialDashboardProps) {
  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
          <SocialLeftSidebar userName={userName} />
          <MainFeed initialFeedItems={feedItems} userId={userId} orgId={orgId} />
          <SocialRightSidebar />
        </div>
      </div>
    </div>
  )
}

