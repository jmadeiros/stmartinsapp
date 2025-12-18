'use client'

import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { approveForWebsite, rejectForWebsite } from "@/lib/actions/admin"
import { useRouter } from "next/navigation"

type QueueItem = {
  id: string
  type: 'post' | 'event' | 'project'
  title: string
}

export function WebsiteQueueActions({ item }: { item: QueueItem }) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleApprove = () => {
    if (confirm(`Approve "${item.title}" for website publication?`)) {
      startTransition(async () => {
        const result = await approveForWebsite(item.id, item.type)
        if ('error' in result) {
          alert(`Error: ${result.error}`)
        } else {
          alert(result.message || 'Approved for website')
          router.refresh()
        }
      })
    }
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    startTransition(async () => {
      const result = await rejectForWebsite(item.id, rejectReason)
      if ('error' in result) {
        alert(`Error: ${result.error}`)
      } else {
        alert(result.message || 'Rejected')
        setShowRejectDialog(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
        title="Approve for Website"
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

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject for Website</h3>
            <p className="text-sm text-gray-600 mb-4">
              Reject <strong>{item.title}</strong> from being published to the website.
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
                placeholder="Explain why this content cannot be published..."
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
