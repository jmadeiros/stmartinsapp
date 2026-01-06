import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMyActionItems } from '@/lib/queries/meeting-notes'
import { ActionItemCard } from '@/components/meeting-notes/action-item-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SocialHeader } from '@/components/social/header'

export const metadata = {
  title: 'My Action Items | Village Hub',
  description: 'Track your assigned action items from meeting notes'
}

export default async function MyActionItemsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch action items assigned to this user - both open and completed
  const { data: openItems } = await getMyActionItems(supabase, user.id, {
    includeCompleted: false,
    limit: 100
  })

  const { data: completedItems } = await getMyActionItems(supabase, user.id, {
    status: 'completed',
    limit: 50
  })

  const hasOpenItems = (openItems || []).length > 0
  const hasCompletedItems = (completedItems || []).length > 0
  const hasAnyItems = hasOpenItems || hasCompletedItems

  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-primary" />
              My Action Items
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track tasks assigned to you from meeting notes
            </p>
          </div>

          <Button variant="outline" asChild className="gap-2">
            <Link href="/meeting-notes">
              <FileText className="h-4 w-4" />
              Meeting Notes
            </Link>
          </Button>
        </div>

        {!hasAnyItems ? (
          <Card className="p-8 text-center text-muted-foreground">
            <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No action items assigned to you</p>
            <p className="text-sm mt-1">
              When action items are assigned to you from meeting notes, they&apos;ll appear here.
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="w-full justify-start bg-muted/30 p-1 h-11 mb-4">
              <TabsTrigger value="open" className="gap-2 data-[state=active]:bg-white">
                Open
                {hasOpenItems && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {openItems?.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-white">
                Completed
                {hasCompletedItems && (
                  <span className="text-xs text-muted-foreground">
                    ({completedItems?.length})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-2">
              {!hasOpenItems ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <p>All caught up! No open action items.</p>
                </Card>
              ) : (
                openItems?.map((item) => (
                  <ActionItemCard
                    key={item.id}
                    item={item}
                    showMeetingLink
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-2">
              {!hasCompletedItems ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <p>No completed action items yet.</p>
                </Card>
              ) : (
                completedItems?.map((item) => (
                  <ActionItemCard
                    key={item.id}
                    item={item}
                    showMeetingLink
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
