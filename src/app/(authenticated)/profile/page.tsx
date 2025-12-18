import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await (supabase
    .from("user_profiles") as any)
    .select("*")
    .eq("user_id", user?.id ?? '')
    .single()

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/settings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your profile information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              This feature is coming soon. Profile editing will be available in the next update.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium">{profile?.full_name || 'Not set'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-sm font-medium capitalize">
                {profile?.role?.replace('_', ' ') || 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
