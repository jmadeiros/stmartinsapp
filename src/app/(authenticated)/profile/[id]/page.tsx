import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/actions/profile'
import { ProfileView } from '@/components/profile/profile-view'
import { notFound, redirect } from 'next/navigation'

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the profile for the requested user
  const { data: profile, error } = await getProfile(params.id)

  if (error || !profile) {
    notFound()
  }

  // Check if viewing own profile
  const isOwnProfile = user.id === params.id

  return <ProfileView profile={profile} isOwnProfile={isOwnProfile} currentUserId={user.id} />
}
