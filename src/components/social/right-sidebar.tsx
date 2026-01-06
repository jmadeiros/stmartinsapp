"use client"

import { motion } from "framer-motion"

import { Card } from "@/components/ui/card"

import { AnimatedEvents } from "./animated-events"

interface SocialRightSidebarProps {
  userId?: string
  orgId?: string
  userRole?: 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'
}

export function SocialRightSidebar({ userId, orgId, userRole = 'volunteer' }: SocialRightSidebarProps) {
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
      </div>
    </aside>
  )
}
