import { createClient } from '@/lib/supabase/server'
import { Calendar, Briefcase, MessageSquare, Utensils } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch user data
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Get current time for greeting
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Upcoming Events"
          value="0"
          icon={Calendar}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Active Jobs"
          value="0"
          icon={Briefcase}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Unread Messages"
          value="0"
          icon={MessageSquare}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="This Week's Menu"
          value="View"
          icon={Utensils}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latest Announcements */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Latest Announcements
          </h2>
          <div className="space-y-4">
            <EmptyState message="No announcements yet" />
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Events
          </h2>
          <div className="space-y-4">
            <EmptyState message="No upcoming events" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <EmptyState message="No recent activity" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
}: {
  title: string
  value: string
  icon: any
  iconColor: string
  bgColor: string
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 px-4 py-5 shadow-sm sm:p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${bgColor}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {value}
          </dd>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
