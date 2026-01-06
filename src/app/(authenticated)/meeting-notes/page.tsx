import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMeetingNotes } from '@/lib/queries/meeting-notes'
import { MeetingNotesList } from '@/components/meeting-notes/meeting-notes-list'
import { Button } from '@/components/ui/button'
import { SocialHeader } from '@/components/social/header'

export const metadata = {
  title: 'Meeting Notes | Village Hub',
  description: 'Browse meeting notes and action items'
}

export default async function MeetingNotesPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  const profileData = profile as { organization_id?: string } | null
  const orgId = profileData?.organization_id

  if (!orgId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No organization found.</p>
        </div>
      </div>
    )
  }

  // Fetch meeting notes
  const { data: notes, error } = await getMeetingNotes(supabase, orgId, {
    limit: 50
  })

  if (error) {
    console.error('[MeetingNotesPage] Error fetching notes:', error)
  }

  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Meeting Notes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse meeting summaries and action items
            </p>
          </div>

          <Button variant="outline" asChild className="gap-2">
            <Link href="/my-action-items">
              <CheckSquare className="h-4 w-4" />
              My Action Items
            </Link>
          </Button>
        </div>

        {/* Notes List */}
        <MeetingNotesList notes={notes || []} />
      </main>
    </div>
  )
}
