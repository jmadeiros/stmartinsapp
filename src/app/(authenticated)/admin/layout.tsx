import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  Users,
  UserCheck,
  Globe,
  LayoutDashboard,
  Shield
} from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin or st_martins_staff
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .single()

  type ProfileData = { role: string; full_name: string } | null
  const profileData = profile as ProfileData

  const isAdmin = profileData?.role === 'admin' || profileData?.role === 'st_martins_staff'

  if (!isAdmin) {
    redirect("/dashboard?error=unauthorized")
  }

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/approvals", label: "Approvals", icon: UserCheck },
    { href: "/admin/website-queue", label: "Website Queue", icon: Globe },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">{profileData?.full_name}</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
