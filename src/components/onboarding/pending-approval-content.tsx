'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, XCircle, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface PendingApprovalContentProps {
  status: 'pending' | 'rejected'
  userName: string
  rejectionReason?: string | null
}

export function PendingApprovalContent({
  status,
  userName,
  rejectionReason,
}: PendingApprovalContentProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Application Not Approved</CardTitle>
            <CardDescription>
              We&apos;re sorry, {userName}. Your application was not approved at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rejectionReason && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground font-medium mb-1">Reason:</p>
                <p className="text-sm">{rejectionReason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              If you believe this is an error, please contact the Village Hub administrators.
            </p>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pending status
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle>Awaiting Approval</CardTitle>
          <CardDescription>
            Thank you for completing your profile, {userName}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm">
              Your account is pending admin approval. You&apos;ll receive a notification
              once your account has been reviewed.
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This usually takes 1-2 business days. Feel free to close this page -
            we&apos;ll notify you when you&apos;re approved.
          </p>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
