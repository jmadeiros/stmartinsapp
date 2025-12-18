"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Bell, User, Lock, Shield, Info, LogOut, CheckCircle2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getUserProfile,
  changePassword,
  signOut,
  type NotificationPreferences,
} from "@/lib/actions/settings"
import { toast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    reactions: true,
    comments: true,
    mentions: true,
    event_updates: true,
    project_updates: true,
    collaboration_invitations: true,
    priority_alerts: true,
  })
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  // Load user data and preferences
  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setUserEmail(user.email || null)

      // Load user profile
      const profileResult = await getUserProfile(user.id)
      if (profileResult.success && profileResult.data) {
        setUserProfile(profileResult.data)
      }

      // Load notification preferences
      const prefsResult = await getNotificationPreferences(user.id)
      if (prefsResult.success && prefsResult.data) {
        setNotifications(prefsResult.data)
      }

      setLoading(false)
    }

    loadUserData()
  }, [router])

  const handleNotificationToggle = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (key === 'priority_alerts') {
      // Can't disable priority alerts
      toast({
        title: "Priority Alerts Required",
        description: "Priority alerts cannot be disabled for security and important updates.",
        variant: "destructive",
      })
      return
    }

    const newPrefs = {
      ...notifications,
      [key]: value,
    }

    setNotifications(newPrefs)

    // Auto-save preferences
    if (userId) {
      setSaving(true)
      const result = await updateNotificationPreferences(userId, newPrefs)
      setSaving(false)

      if (result.success) {
        toast({
          title: "Preferences Saved",
          description: "Your notification preferences have been updated.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save preferences",
          variant: "destructive",
        })
        // Revert on error
        setNotifications(notifications)
      }
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      })
      return
    }

    setChangingPassword(true)
    const result = await changePassword(newPassword)
    setChangingPassword(false)

    if (result.success) {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      })
      setNewPassword("")
      setConfirmPassword("")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to change password",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    const result = await signOut()
    if (result.success) {
      router.push('/login')
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Account</CardTitle>
              </div>
              <CardDescription>
                Manage your account information and profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{userEmail}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Full Name</Label>
                <p className="text-sm font-medium">{userProfile?.full_name || 'Not set'}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Role</Label>
                <p className="text-sm font-medium capitalize">
                  {userProfile?.role?.replace('_', ' ') || 'Not set'}
                </p>
              </div>

              <Separator />

              <div>
                <Link href="/profile">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={!newPassword || !confirmPassword || changingPassword}
                className="w-full sm:w-auto"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Control what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reactions" className="text-base font-medium">
                      Reactions
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone likes your posts
                    </p>
                  </div>
                  <Switch
                    id="reactions"
                    checked={notifications.reactions}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('reactions', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="comments" className="text-base font-medium">
                      Comments
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone comments on your posts
                    </p>
                  </div>
                  <Switch
                    id="comments"
                    checked={notifications.comments}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('comments', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mentions" className="text-base font-medium">
                      Mentions
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone mentions you
                    </p>
                  </div>
                  <Switch
                    id="mentions"
                    checked={notifications.mentions}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('mentions', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="event_updates" className="text-base font-medium">
                      Event Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about RSVPs and event reminders
                    </p>
                  </div>
                  <Switch
                    id="event_updates"
                    checked={notifications.event_updates}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('event_updates', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="project_updates" className="text-base font-medium">
                      Project Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about project activity and milestones
                    </p>
                  </div>
                  <Switch
                    id="project_updates"
                    checked={notifications.project_updates}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('project_updates', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="collaboration_invitations" className="text-base font-medium">
                      Collaboration Invitations
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when invited to collaborate
                    </p>
                  </div>
                  <Switch
                    id="collaboration_invitations"
                    checked={notifications.collaboration_invitations}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('collaboration_invitations', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="priority_alerts" className="text-base font-medium">
                        Priority Alerts
                      </Label>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Critical updates and security alerts (always enabled)
                    </p>
                  </div>
                  <Switch
                    id="priority_alerts"
                    checked={notifications.priority_alerts}
                    disabled
                    className="opacity-50"
                  />
                </div>
              </div>

              <Separator />

              {/* Email notifications info */}
              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/50 p-4">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Email notifications are coming soon. For now, you'll receive all notifications in-app.
                  </p>
                </div>
              </div>

              {saving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Saving...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Privacy</CardTitle>
              </div>
              <CardDescription>
                Control who can see your information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/50 p-4">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Profile Visibility</p>
                  <p className="text-sm text-muted-foreground">
                    Your profile is visible to all members of your organization. This helps foster collaboration and transparency within The Village Hub.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out Section */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Sign Out</CardTitle>
              </div>
              <CardDescription>
                Sign out of your account on this device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
