'use client'

import { useState, useTransition } from "react"
import { MoreVertical, Shield, Trash2, RotateCcw } from "lucide-react"
import { updateUserRole, softDeleteUser, restoreUser } from "@/lib/actions/admin"
import { useRouter } from "next/navigation"

type User = {
  user_id: string
  full_name: string
  role: string
}

export function UserActions({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleRoleChange = (newRole: string) => {
    if (confirm(`Change ${user.full_name}'s role to ${newRole}?`)) {
      startTransition(async () => {
        const result = await updateUserRole(user.user_id, newRole as any)
        if ('error' in result) {
          alert(`Error: ${result.error}`)
        } else {
          router.refresh()
        }
        setIsOpen(false)
      })
    }
  }

  const handleDelete = () => {
    if (confirm(`Soft delete ${user.full_name}? They will lose access but can be restored later.`)) {
      startTransition(async () => {
        const result = await softDeleteUser(user.user_id)
        if ('error' in result) {
          alert(`Error: ${result.error}`)
        } else {
          router.refresh()
        }
        setIsOpen(false)
      })
    }
  }

  const handleRestore = () => {
    if (confirm(`Restore ${user.full_name}'s access?`)) {
      startTransition(async () => {
        const result = await restoreUser(user.user_id)
        if ('error' in result) {
          alert(`Error: ${result.error}`)
        } else {
          router.refresh()
        }
        setIsOpen(false)
      })
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border z-20">
            <div className="py-1">
              {/* Role Change Submenu */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Change Role
              </div>
              <button
                onClick={() => handleRoleChange('admin')}
                disabled={isPending || user.role === 'admin'}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
              <button
                onClick={() => handleRoleChange('st_martins_staff')}
                disabled={isPending || user.role === 'st_martins_staff'}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="h-4 w-4" />
                St Martins Staff
              </button>
              <button
                onClick={() => handleRoleChange('partner_staff')}
                disabled={isPending || user.role === 'partner_staff'}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="h-4 w-4" />
                Partner Staff
              </button>
              <button
                onClick={() => handleRoleChange('volunteer')}
                disabled={isPending || user.role === 'volunteer'}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="h-4 w-4" />
                Volunteer
              </button>

              <div className="border-t my-1" />

              {/* Actions */}
              <button
                onClick={handleRestore}
                disabled={isPending}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Restore User
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Soft Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
