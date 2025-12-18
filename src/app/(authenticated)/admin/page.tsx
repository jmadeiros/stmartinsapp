import { getAdminStats } from "@/lib/actions/admin"
import { Users, UserCheck, FileText, Trash2 } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboardPage() {
  const result = await getAdminStats()

  if ('error' in result) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error: {result.error}</div>
      </div>
    )
  }

  const stats = result.data!

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      href: "/admin/users",
      color: "blue",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: UserCheck,
      href: "/admin/approvals",
      color: "yellow",
    },
    {
      title: "Active Posts (30d)",
      value: stats.activePosts,
      icon: FileText,
      href: "/admin/users",
      color: "green",
    },
    {
      title: "Soft Deleted Items",
      value: stats.softDeletedItems,
      icon: Trash2,
      href: "/admin/users",
      color: "red",
    },
  ]

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
        <p className="text-gray-600 mt-1">
          Manage users, approvals, and website content
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickLink
          title="User Management"
          description="View and manage all users in the system"
          href="/admin/users"
        />
        <QuickLink
          title="Approve New Users"
          description="Review and approve pending user sign-ups"
          href="/admin/approvals"
        />
        <QuickLink
          title="Website Publishing"
          description="Manage content for website publication"
          href="/admin/website-queue"
        />
      </div>
    </div>
  )
}

function QuickLink({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="block p-6 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}
