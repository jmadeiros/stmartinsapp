"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Loader2 } from "lucide-react"
import { fetchOrganizationUsers } from "@/lib/actions/chat"
import type { ChatUser } from "./chat-types"

interface NewDMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectUser: (user: ChatUser) => void
  orgId: string
  currentUserId: string
}

export function NewDMDialog({
  open,
  onOpenChange,
  onSelectUser,
  orgId,
  currentUserId,
}: NewDMDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<ChatUser[]>([])

  // Fetch users when dialog opens
  useEffect(() => {
    if (!open) return

    async function loadUsers() {
      setIsLoading(true)
      try {
        const result = await fetchOrganizationUsers(orgId)
        if (result.success && result.data) {
          const chatUsers: ChatUser[] = result.data
            .filter(u => u.user_id !== currentUserId)
            .map(u => ({
              id: u.user_id,
              name: u.full_name,
              avatar: u.avatar_url || undefined,
              initials: getInitials(u.full_name),
              isOnline: u.is_online || false,
              role: u.job_title || undefined,
              organization: u.organization_name || undefined,
            }))
          setUsers(chatUsers)
        }
      } catch (error) {
        console.error("Error loading users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [open, orgId, currentUserId])

  // Filter users by search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectUser = (user: ChatUser) => {
    onSelectUser(user)
    onOpenChange(false)
    setSearchQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* User list */}
          <div className="max-h-[300px] overflow-y-auto -mx-4 px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No users found matching your search"
                    : "No users available"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.role && user.organization
                          ? `${user.role} at ${user.organization}`
                          : user.role || user.organization || "Team member"}
                      </p>
                    </div>
                    {user.isOnline && (
                      <span className="text-xs text-emerald-500 flex-shrink-0">
                        Online
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to get initials
function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}
