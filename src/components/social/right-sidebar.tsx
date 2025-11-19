"use client"

import { useState } from "react"
import { Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { AnimatedEvents } from "./animated-events"

export function SocialRightSidebar() {
  const [alertDismissed, setAlertDismissed] = useState(false)

  const handleAcknowledge = () => {
    console.log('Acknowledge clicked, dismissing alert...')
    setAlertDismissed(true)
  }

  return (
    <aside className="hidden space-y-4 lg:block">
      <div className="sticky top-24 space-y-4">
        <AnimatePresence mode="wait">
          {!alertDismissed ? (
            <motion.div
              key="priority-alert"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border border-border/50 bg-[var(--surface)] overflow-hidden p-0" style={{ boxShadow: "var(--shadow-overlay)" }}>
                <div className="bg-destructive px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-destructive-foreground" fill="currentColor" />
                    <span className="text-sm font-semibold text-destructive-foreground">Priority</span>
                  </div>
                  <span className="text-xs text-destructive-foreground/90 font-medium">1 hour ago</span>
                </div>

                <div className="px-4 py-2.5 border-b border-border/50 bg-[var(--surface-secondary)]">
                  <span className="text-xs text-muted-foreground font-medium">to Blink Team</span>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-border/50">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Tyron Brown" />
                      <AvatarFallback className="bg-muted text-foreground font-semibold">TB</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Tyron Brown</p>
                      <p className="text-xs text-muted-foreground">Facilities Manager</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2 leading-tight">Electricity outage expected!</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      There will be a scheduled electricity outage on Monday, August 15th from 9:00 AM to 12:00 PM. Please save your work and power down non-essential equipment.
                    </p>
                  </div>

                  <Button
                    onClick={handleAcknowledge}
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground border-0 shadow-sm transition-all active:scale-[0.98]"
                  >
                    Acknowledge
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="events-carousel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatedEvents className="border border-border/50 bg-[var(--surface)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}

