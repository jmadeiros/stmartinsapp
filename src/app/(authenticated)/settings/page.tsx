"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Bell, User, Lock, Shield, Info, LogOut, CheckCircle2, Sparkles } from "lucide-react"
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

const navItems = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "signout", label: "Sign Out", icon: LogOut, danger: true },
]

export default function SettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState("account")
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

  // Refs for scroll observation
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  // Intersection Observer to highlight active nav item
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    )

    // Observe all sections
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [loading])

  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id]
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
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

  const handleNotificationToggle = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (key === 'priority_alerts') {
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-secondary)]">
      <SocialHeader />
      
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end gap-6 px-4">
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={userProfile?.avatar_url || undefined} alt={userProfile?.full_name || "User"} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
          </div>
          
          <div className="space-y-2 pb-1">
            <div className="flex items-center gap-3">
              <h1 
                className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, oklch(0.6 0.118 184.704), oklch(0.52 0.12 166 / 0.8), oklch(0.769 0.188 70.08))"
                }}
              >
                Settings
              </h1>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wider">
                Account Active
              </span>
            </div>
            <p className="text-muted-foreground text-lg">
              Personalize your Village experience and security.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
          {/* Left Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                General Settings
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                        isActive && !item.danger
                          ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                          : item.danger
                          ? "text-destructive hover:bg-destructive/10"
                          : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive && !item.danger ? "text-primary" : "")} />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
              
              <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Pro Tip</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Keeping your profile updated helps other members find and collaborate with you more easily.
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-16 pb-20 px-4">
            {/* Account Section */}
            <section
              id="account"
              ref={(el) => { sectionRefs.current["account"] = el }}
              className="scroll-mt-28"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground">Account Information</h2>
                <p className="text-muted-foreground mt-1">
                  Your personal account details and public identity within The Village.
                </p>
              </div>
              
              <div className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Email Address</Label>
                    <p className="text-base font-medium text-foreground flex items-center gap-2">
                      {userEmail}
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Full Name</Label>
                    <p className="text-base font-medium text-foreground">{userProfile?.full_name || 'Not set'}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Organization</Label>
                    <p className="text-base font-medium text-foreground">{userProfile?.organization?.name || 'St Martins Village'}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Your Role</Label>
                    <div className="flex items-center gap-3">
                      <p className="text-base font-medium text-foreground capitalize">
                        {userProfile?.role?.replace('_', ' ') || 'Not set'}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-600/10 tracking-wide">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/[0.03] border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Profile Visibility</p>
                      <p className="text-xs text-muted-foreground font-normal">Manage your public bio and social links.</p>
                    </div>
                  </div>
                  <Link href="/profile">
                    <Button variant="outline" size="sm" className="rounded-xl border-primary/20 bg-white hover:bg-primary/5 hover:text-primary font-semibold">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section
              id="security"
              ref={(el) => { sectionRefs.current["security"] = el }}
              className="scroll-mt-28"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Security</h2>
                  <p className="text-muted-foreground mt-1">
                    Manage your password and account security.
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
              </div>

              <div className="grid gap-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="rounded-xl border-border/60 bg-white/50 focus:bg-white transition-all font-normal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="rounded-xl border-border/60 bg-white/50 focus:bg-white transition-all font-normal"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={!newPassword || !confirmPassword || changingPassword}
                  className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-semibold"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </section>

            {/* Notifications Section */}
            <section
              id="notifications"
              ref={(el) => { sectionRefs.current["notifications"] = el }}
              className="scroll-mt-28"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Notifications</h2>
                  <p className="text-muted-foreground mt-1">
                    Customize how you receive updates from The Village.
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'reactions', label: 'Reactions', desc: 'When someone likes your posts' },
                  { id: 'comments', label: 'Comments', desc: 'When someone comments on your work' },
                  { id: 'mentions', label: 'Mentions', desc: 'When you are tagged in a post or comment' },
                  { id: 'event_updates', label: 'Event Updates', desc: 'Reminders and changes to events you follow' },
                  { id: 'project_updates', label: 'Project Updates', desc: 'New milestones and activity on projects' },
                  { id: 'collaboration_invitations', label: 'Collaborations', desc: 'Invitations to work together' },
                ].map((pref, i) => (
                  <div key={pref.id}>
                    <div className="flex items-center justify-between py-4 group">
                      <div className="space-y-0.5">
                        <Label htmlFor={pref.id} className="text-base font-medium group-hover:text-primary transition-colors cursor-pointer">
                          {pref.label}
                        </Label>
                        <p className="text-sm text-muted-foreground font-normal">
                          {pref.desc}
                        </p>
                      </div>
                      <Switch
                        id={pref.id}
                        checked={notifications[pref.id as keyof NotificationPreferences] as boolean}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle(pref.id as keyof NotificationPreferences, checked)
                        }
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    {i < 5 && <Separator className="bg-border/40" />}
                  </div>
                ))}

                <div className="mt-8 flex items-center justify-between py-4 px-5 rounded-2xl bg-muted/40 border border-border/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="priority_alerts" className="text-base font-medium text-muted-foreground">
                        Priority Alerts
                      </Label>
                      <Shield className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">
                      Critical updates and security alerts (required)
                    </p>
                  </div>
                  <Switch
                    id="priority_alerts"
                    checked={notifications.priority_alerts}
                    disabled
                    className="opacity-50"
                  />
                </div>

                <div className="mt-8 flex items-start gap-4 p-5 rounded-2xl bg-white/50 border border-blue-100/50">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-blue-900">Email Notifications</p>
                    <p className="text-sm text-blue-800/70 leading-relaxed font-normal">
                      Email digest and push notifications are currently being optimized. You'll receive all updates in your Village activity feed for now.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Privacy Section */}
            <section
              id="privacy"
              ref={(el) => { sectionRefs.current["privacy"] = el }}
              className="scroll-mt-28"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Privacy</h2>
                  <p className="text-muted-foreground mt-1">
                    Control how your data is used and shared.
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-50/30 border border-emerald-100/50">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                  <Info className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-emerald-900">Profile Visibility</p>
                  <p className="text-sm text-emerald-800/70 leading-relaxed font-normal">
                    By default, your profile and activity are visible to other verified members of The Village. This enables transparency and trust across the network.
                  </p>
                </div>
              </div>
            </section>

            {/* Sign Out Section */}
            <section
              id="signout"
              ref={(el) => { sectionRefs.current["signout"] = el }}
              className="scroll-mt-28"
            >
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-red-900">Sign Out</h2>
                <p className="text-red-800/60 mt-1">
                  Sign out of your Village account on this device.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full sm:w-auto rounded-xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 font-semibold"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out of My Account
              </Button>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
