import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PendingApprovalContent } from '@/components/onboarding/pending-approval-content'

type ProfileWithApproval = {
  approval_status: 'pending' | 'approved' | 'rejected' | null
  full_name: string | null
  rejection_reason: string | null
}

export default async function PendingApprovalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check current approval status
  const { data } = await supabase
    .from('user_profiles')
    .select('approval_status, full_name, rejection_reason')
    .eq('user_id', user.id)
    .single()

  const profile = data as ProfileWithApproval | null

  // If no profile exists, send to onboarding
  if (!profile) {
    redirect('/onboarding')
  }

  // If approved, send to dashboard
  if (profile.approval_status === 'approved') {
    redirect('/dashboard')
  }

  // If rejected, show rejection message
  if (profile.approval_status === 'rejected') {
    return (
      <PendingApprovalContent
        status="rejected"
        userName={profile.full_name || 'there'}
        rejectionReason={profile.rejection_reason}
      />
    )
  }

  // Show pending status
  return (
    <PendingApprovalContent
      status="pending"
      userName={profile.full_name || 'there'}
    />
  )
}
