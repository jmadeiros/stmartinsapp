"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bell, User, Lock, Shield, LogOut, Check, ChevronRight, Loader2 } from "lucide-react"
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
import { SocialHeader } from "@/components/social/header"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const sections = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
]

const notificationOptions = [
  { id: 'reactions', label: 'Reactions', desc: 'When someone likes your posts' },
  { id: 'comments', label: 'Comments', desc: 'When someone comments on your work' },
  { id: 'mentions', label: 'Mentions', desc: 'When you are tagged in a post' },
  { id: 'event_updates', label: 'Event Updates', desc: 'Event reminders and changes' },
  { id: 'project_updates', label: 'Project Updates', desc: 'New milestones and activity' },
  { id: 'collaboration_invitations', label: 'Collaborations', desc: 'Invitations to work together' },
]

export default function SettingsTestPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
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

  const toggleNotification = (key: keyof NotificationPreferences) => {
    if (key === 'priority_alerts') return
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

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

  const handleSaveNotifications = async () => {
    if (!userId) return

    setSaving(true)
    const result = await updateNotificationPreferences(userId, notifications)
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <SocialHeader />

      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Stepper Navigation */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {sections.map((section, index) => {
                const Icon = section.icon
                const isComplete = currentSection > index
                const isCurrent = currentSection === index

                return (
                  <div key={section.id} className="flex items-center">
                    <button
                      onClick={() => setCurrentSection(index)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-full transition-colors',
                        isComplete && 'bg-primary/10 text-primary',
                        isCurrent && 'bg-primary text-primary-foreground',
                        !isComplete && !isCurrent && 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium hidden sm:inline">{section.label}</span>
                    </button>
                    {index < sections.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section Content */}
          <Card className="shadow-lg">
            {/* Account Section */}
            {currentSection === 0 && (
              <>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Your personal account details and public identity within The Village.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={userProfile?.avatar_url || undefined} alt={userProfile?.full_name || "User"} />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm text-muted-foreground">
                      Signed in as<br />
                      <span className="font-medium text-foreground">{userEmail}</span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Full Name</Label>
                      <p className="text-base font-medium">{userProfile?.full_name || 'Not set'}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Organization</Label>
                      <p className="text-base font-medium">{userProfile?.organization?.name || 'St Martins Village'}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Your Role</Label>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium capitalize">
                          {userProfile?.role?.replace('_', ' ') || 'Not set'}
                        </p>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                          Verified
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Job Title</Label>
                      <p className="text-base font-medium">{userProfile?.job_title || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link href="/profile">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </>
            )}

            {/* Security Section */}
            {currentSection === 1 && (
              <>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Manage your password and account security.
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

                  <p className="text-sm text-muted-foreground">
                    Password must be at least 8 characters long.
                  </p>
                </CardContent>
              </>
            )}

            {/* Notifications Section */}
            {currentSection === 2 && (
              <>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose which notifications you&apos;d like to receive.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Select your notifications</Label>
                    <div className="flex flex-wrap gap-2">
                      {notificationOptions.map(option => (
                        <Badge
                          key={option.id}
                          variant={notifications[option.id as keyof NotificationPreferences] ? 'default' : 'outline'}
                          className="cursor-pointer transition-colors"
                          onClick={() => toggleNotification(option.id as keyof NotificationPreferences)}
                        >
                          {option.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <p className="text-sm text-muted-foreground">Selected notifications:</p>
                    <div className="space-y-2">
                      {notificationOptions
                        .filter(opt => notifications[opt.id as keyof NotificationPreferences])
                        .map(opt => (
                          <div key={opt.id} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-muted-foreground">- {opt.desc}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Priority Alerts</p>
                        <p className="text-xs text-muted-foreground">Always enabled for security</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Required</Badge>
                  </div>
                </CardContent>
              </>
            )}

            {/* Privacy Section */}
            {currentSection === 3 && (
              <>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control how your data is used and shared.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <Shield className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-emerald-900">Profile Visibility</p>
                      <p className="text-sm text-emerald-800/70">
                        Your profile and activity are visible to other verified members of The Village. This enables transparency and trust across the network.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show activity status</Label>
                        <p className="text-sm text-muted-foreground">Let others see when you&apos;re online</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show in member directory</Label>
                        <p className="text-sm text-muted-foreground">Appear in searchable member list</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={handleSignOut}
                      className="w-full sm:w-auto"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Sign out of your Village account on this device.
                    </p>
                  </div>
                </CardContent>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between p-6 pt-0">
              <Button
                variant="ghost"
                onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
                disabled={currentSection === 0}
              >
                Back
              </Button>

              {currentSection === 1 && (
                <Button
                  onClick={handleChangePassword}
                  disabled={!newPassword || !confirmPassword || changingPassword}
                >
                  {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              )}

              {currentSection === 2 && (
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              )}

              {(currentSection === 0 || currentSection === 3) && (
                <Button
                  onClick={() => setCurrentSection(prev => Math.min(sections.length - 1, prev + 1))}
                  disabled={currentSection === sections.length - 1}
                >
                  Continue
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
