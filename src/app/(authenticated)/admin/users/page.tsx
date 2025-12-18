import { getUsers, getOrganizations } from "@/lib/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserActions } from "./user-actions"
import { UserSearch } from "./user-search"
import { formatDistanceToNow } from "date-fns"

type SearchParams = Promise<{
  search?: string
  role?: string
  orgId?: string
  page?: string
}>

export default async function UsersPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const search = searchParams.search
  const role = searchParams.role as any
  const orgId = searchParams.orgId
  const page = parseInt(searchParams.page || "1", 10)
  const limit = 50
  const offset = (page - 1) * limit

  const usersResult = await getUsers({
    search,
    role,
    orgId,
    limit,
    offset,
  })

  const orgsResult = await getOrganizations()

  if ('error' in usersResult) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error: {usersResult.error}</div>
      </div>
    )
  }

  const users = usersResult.data || []
  const totalUsers = usersResult.count || 0
  const organizations = 'data' in orgsResult ? orgsResult.data || [] : []
  const totalPages = Math.ceil(totalUsers / limit)

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 border-red-200",
    st_martins_staff: "bg-blue-100 text-blue-800 border-blue-200",
    partner_staff: "bg-green-100 text-green-800 border-green-200",
    volunteer: "bg-gray-100 text-gray-800 border-gray-200",
  }

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    st_martins_staff: "St Martins Staff",
    partner_staff: "Partner Staff",
    volunteer: "Volunteer",
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600 mt-1">
          View and manage all users in the system
        </p>
      </div>

      {/* Search and Filters */}
      <UserSearch organizations={organizations} />

      {/* Stats */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {offset + 1}-{Math.min(offset + limit, totalUsers)} of {totalUsers} users
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <a
              href={`/admin/users?${new URLSearchParams({
                ...(search && { search }),
                ...(role && { role }),
                ...(orgId && { orgId }),
                page: (page - 1).toString()
              })}`}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Previous
            </a>
          )}
          {page < totalPages && (
            <a
              href={`/admin/users?${new URLSearchParams({
                ...(search && { search }),
                ...(role && { role }),
                ...(orgId && { orgId }),
                page: (page + 1).toString()
              })}`}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Next
            </a>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.full_name}
                      </div>
                      {user.job_title && (
                        <div className="text-xs text-gray-500">
                          {user.job_title}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {user.contact_email || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={roleColors[user.role] || roleColors.volunteer}
                    >
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {user.organizations?.name || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {user.last_active_at
                        ? formatDistanceToNow(new Date(user.last_active_at), {
                            addSuffix: true,
                          })
                        : 'Never'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions user={user} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
