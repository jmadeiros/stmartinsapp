'use client'

import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { approveUser, rejectUser } from "@/lib/actions/admin"
import { useRouter } from "next/navigation"

type User = {
  user_id: string
  full_name: string
  contact_email?: string
}

type Organization = {
  id: string
  name: string
  slug: string
}

export function ApprovalActions({
  user,
  organizations,
}: {
  user: User
  organizations: Organization[]
}) {
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedRole, setSelectedRole] = useState('volunteer')
  const [rejectReason, setRejectReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleApprove = () => {
    if (!selectedOrg) {
      alert('Please select an organization')
      return
    }

    startTransition(async () => {
      const result = await approveUser(user.user_id, selectedOrg, selectedRole as any)
      if ('error' in result) {
        alert(`Error: ${result.error}`)
      } else {
        setShowApproveDialog(false)
        router.refresh()
      }
    })
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    startTransition(async () => {
      const result = await rejectUser(user.user_id, rejectReason)
      if ('error' in result) {
        alert(`Error: ${result.error}`)
      } else {
        setShowRejectDialog(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => setShowApproveDialog(true)}
        disabled={isPending}
        className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
        title="Approve"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={() => setShowRejectDialog(true)}
        disabled={isPending}
        className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
        title="Reject"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Approve Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Approve User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Approve <strong>{user.full_name}</strong> and assign them to an organization.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="partner_staff">Partner Staff</option>
                  <option value="st_martins_staff">St Martins Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleApprove}
                disabled={isPending || !selectedOrg}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => setShowApproveDialog(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Reject <strong>{user.full_name}</strong>'s application. This will delete their profile.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Explain why this user is being rejected..."
              />
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleReject}
                disabled={isPending || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                onClick={() => setShowRejectDialog(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
