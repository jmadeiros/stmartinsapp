import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { MainFeed } from "@/components/main-feed"
import { RightSidebar } from "@/components/right-sidebar"

export default function SocialPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
          <LeftSidebar />
          <MainFeed />
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}







