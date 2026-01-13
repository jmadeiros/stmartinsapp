import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { getOrganizationsForOnboarding, checkOnboardingStatus } from '@/lib/actions/onboarding'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Check if user already completed onboarding
  const onboardingStatus = await checkOnboardingStatus()

  if (!onboardingStatus.needsOnboarding) {
    // If pending approval, redirect there instead of dashboard
    if (onboardingStatus.redirectTo) {
      redirect(onboardingStatus.redirectTo)
    }
    redirect('/dashboard')
  }

  // Fetch organizations for step 2
  const { data: organizations } = await getOrganizationsForOnboarding()

  // Fetch existing profile if any
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('full_name, bio, job_title, organization_id, skills, interests, avatar_url, linkedin_url, twitter_url, website_url')
    .eq('user_id', user.id)
    .single()

  return (
    <OnboardingWizard
      userId={user.id}
      userEmail={user.email || ''}
      organizations={organizations}
      existingProfile={existingProfile}
    />
  )
}
