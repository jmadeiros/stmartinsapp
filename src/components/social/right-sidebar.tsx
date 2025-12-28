"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { AnimatedEvents } from "./animated-events"
import { SendAlertDialog } from "./send-alert-dialog"
import { createAlert } from "@/lib/actions/alerts"

type UserRole = 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'

interface SocialRightSidebarProps {
  userId?: string
  orgId?: string
  userRole?: UserRole
}

export function SocialRightSidebar({ userId, orgId, userRole = 'volunteer' }: SocialRightSidebarProps) {
  const [showAlertDialog, setShowAlertDialog] = useState(false)

  // Check if user can send alerts
  const canSendAlerts = userRole === 'admin' || userRole === 'st_martins_staff'

  const handleSendAlert = async (alertData: {
    priority: "high" | "medium"
    title: string
    message: string
    audience: string
  }) => {
    if (!userId) {
      console.error("User ID is required to send alerts")
      return
    }

    try {
      const result = await createAlert({
        title: alertData.title,
        message: alertData.message,
        severity: alertData.priority,
        createdBy: userId,
        orgId: orgId,
      })

      if (result.success) {
        setShowAlertDialog(false)
      } else {
        console.error("Failed to create alert:", result.error)
      }
    } catch (err) {
      console.error("Error creating alert:", err)
    }
  }

  return (
    <aside className="hidden space-y-4 lg:block">
      <div className="sticky top-24 space-y-4">
        {/* Events Carousel - Always show */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-0 bg-[var(--surface)] overflow-hidden p-0" style={{ boxShadow: "var(--shadow-overlay)" }}>
            <AnimatedEvents className="border-0 bg-transparent shadow-none" />
          </Card>
        </motion.div>

        {/* Send Alert Button for Staff/Admin */}
        {canSendAlerts && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Button
              onClick={() => setShowAlertDialog(true)}
              variant="outline"
              className="w-full gap-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
            >
              <Plus className="h-4 w-4" />
              Send Alert
            </Button>
          </motion.div>
        )}
      </div>

      {/* Send Alert Dialog */}
      <SendAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        onSend={handleSendAlert}
      />
    </aside>
  )
}
