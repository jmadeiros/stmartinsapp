import { getPendingApprovals, getOrganizations } from "@/lib/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApprovalActions } from "./approval-actions"
import { formatDistanceToNow } from "date-fns"
import { UserCheck } from "lucide-react"

export default async function ApprovalsPage() {
  const approvalsResult = await getPendingApprovals()
  const orgsResult = await getOrganizations()

  if ('error' in approvalsResult) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error: {approvalsResult.error}</div>
      </div>
    )
  }

  const pendingUsers = approvalsResult.data || []
  const organizations = 'data' in orgsResult ? orgsResult.data || [] : []

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Approvals</h2>
        <p className="text-gray-600 mt-1">
          Review and approve pending user sign-ups
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Pending Approvals
          </h3>
          <p className="text-gray-600">
            All users have been approved or there are no new sign-ups.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.map((user: any) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.full_name}
                      </div>
                      {user.bio && (
                        <div className="text-xs text-gray-500 mt-1 max-w-md">
                          {user.bio.length > 100
                            ? `${user.bio.substring(0, 100)}...`
                            : user.bio}
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
                    <span className="text-sm text-gray-600">
                      {user.job_title || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <ApprovalActions user={user} organizations={organizations} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          About User Approvals
        </h4>
        <p className="text-sm text-blue-800">
          This page shows users who have signed up but haven&apos;t been assigned to an
          organization yet. When OAuth is enabled (Task 4.7), new sign-ups will appear
          here for admin approval before gaining full access.
        </p>
      </div>
    </div>
  )
}
