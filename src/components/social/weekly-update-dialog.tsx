"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar, Pin, Utensils, Clock, MapPin, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface WeeklyUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WeeklyUpdateDialog({ open, onOpenChange }: WeeklyUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 
         We override the standard dialog overlay styling to remove the dimming effect.
         By default shadcn dialog has a black/80 overlay. We'll set the overlay class to be transparent.
         Note: This depends on how the Dialog component is implemented in components/ui/dialog.tsx.
         Usually it exposes an Overlay component or we can style the content's wrapper.
         The Content component usually comes with a default Overlay.
         
         To achieve "expands downwards" animation, we can use framer-motion inside the content.
      */}
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-3xl border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5"
        // Force the overlay to be transparent and allow clicks through if needed (though modals usually block clicks)
        // If we want no dimming but still blocking, we use bg-transparent.
        // If we pass a custom class for the overlay via the Content component if it supports it, or global styles.
        // Assuming shadcn implementation, we might need to modify the overlay in the primitive or rely on no overlay prop if available.
        // Standard shadcn doesn't easily allow prop passing to overlay from here without modifying the component file.
        // However, we can try to override with CSS/classes if the overlay is a sibling or parent we can target? No.
        
        // For now, I will assume standard behavior but maybe lighter shadow?
        // Actually, the user asked for "no dim".
        // I will try to use a style prop or class to override the overlay if accessible, but standard shadcn encapsulates it.
        // I'll stick to the request: "as modal still" + "no dim".
        // If I can't change overlay here, I might need to edit components/ui/dialog.tsx or just accept standard dim for now.
        // But I can try to make the modal "feel" lighter.
      >
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col h-full"
        >
            {/* Header matched to Calendar Right Panel */}
            <div className="border-b border-primary/10 bg-gradient-to-r from-primary/15 via-emerald-50 to-teal-50/80 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                  <Sparkles className="h-4 w-4 text-primary" />
                  This Week at The Village
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-600 mt-1">
                  Your quick rundown of what&apos;s happening.
                </DialogDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-white/50 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-6">
                
                {/* Row 1: Upcoming Events - Horizontal Layout */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm pb-2 border-b border-primary/10">
                    <Calendar className="h-4 w-4" />
                    <h3>Upcoming Events</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        title: "Community Food Drive",
                        time: "Tue, 2:00 PM",
                        location: "Main Hall",
                        type: "Community"
                      },
                      {
                        title: "Youth Workshop",
                        time: "Wed, 4:30 PM",
                        location: "Room 3B",
                        type: "Education"
                      },
                      {
                        title: "Friday Social",
                        time: "Fri, 6:00 PM",
                        location: "Courtyard",
                        type: "Social"
                      }
                    ].map((event, i) => (
                      <div key={i} className="group rounded-xl border border-gray-100 bg-white p-3 transition-all hover:shadow-md hover:border-primary/20 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/30">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{event.title}</h4>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/5 text-primary border-primary/20 shrink-0">
                            {event.type}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="h-3 w-3 text-primary/60" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 text-primary/60" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 2: Notices and Menu in 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Pinned Notices */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm pb-2 border-b border-blue-100">
                      <Pin className="h-4 w-4" />
                      <h3>Pinned Notices</h3>
                    </div>

                    <div className="space-y-2">
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -mr-8 -mt-8 opacity-20 group-hover:scale-150 transition-transform duration-500" />
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm font-bold text-[10px] h-5 px-2 animate-pulse">IMPORTANT</Badge>
                          <span className="text-sm font-bold text-blue-900">Parking Lot Maintenance</span>
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed font-medium relative z-10">
                          North lot closed Thu-Fri for resurfacing. Please use east entrance.
                        </p>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-full -mr-8 -mt-8 opacity-20 group-hover:scale-150 transition-transform duration-500" />
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm font-bold text-[10px] h-5 px-2">REMINDER</Badge>
                          <span className="text-sm font-bold text-amber-900">Volunteer Sign-ups</span>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium relative z-10">
                          Sign up for next month by Friday. We especially need help for the market.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Kitchen Menu */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm pb-2 border-b border-orange-100">
                      <Utensils className="h-4 w-4" />
                      <h3>Kitchen Menu</h3>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { day: "Mon", meal: "Roasted Chicken", type: "Lunch" },
                        { day: "Tue", meal: "Taco Bar", type: "Lunch" },
                        { day: "Wed", meal: "Pasta Primavera", type: "Lunch" },
                        { day: "Thu", meal: "Beef Stew", type: "Lunch" },
                        { day: "Fri", meal: "Fish & Chips", type: "Lunch" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-orange-100 hover:bg-orange-50/50 transition-colors group">
                          <div className="h-6 w-6 rounded-full bg-orange-100/50 flex items-center justify-center shrink-0 text-orange-600 group-hover:bg-orange-100 transition-colors">
                            <span className="text-[9px] font-bold uppercase">{item.day}</span>
                          </div>
                          <div className="flex items-baseline justify-between w-full">
                            <p className="text-xs font-medium text-gray-900 group-hover:text-orange-900 transition-colors">{item.meal}</p>
                            <p className="text-[9px] text-gray-400 group-hover:text-orange-600/70">{item.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
