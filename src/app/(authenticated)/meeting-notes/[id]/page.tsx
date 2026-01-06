import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMeetingNoteById, getAdjacentMeetingNotes } from '@/lib/queries/meeting-notes'
import { MeetingNoteDetail } from '@/components/meeting-notes/meeting-note-detail'
import { SocialHeader } from '@/components/social/header'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: note } = await getMeetingNoteById(supabase, id)

  return {
    title: note ? `${note.title} | Meeting Notes` : 'Meeting Note Not Found',
    description: note?.content?.substring(0, 150) || 'View meeting note details'
  }
}

export default async function MeetingNoteDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // Fetch the meeting note
  const { data: note, error } = await getMeetingNoteById(supabase, id)

  if (error || !note) {
    notFound()
  }

  // Check access - user must be in the same org
  if (note.org_id !== orgId) {
    notFound()
  }

  // Get adjacent notes for navigation
  const { previous, next } = await getAdjacentMeetingNotes(supabase, id, orgId || '')

  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <MeetingNoteDetail
        note={note}
        previousNote={previous}
        nextNote={next}
      />
    </div>
  )
}
