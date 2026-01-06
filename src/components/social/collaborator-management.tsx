'use client'

import { useState } from 'react'
import { X, Building2, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { removeCollaborator } from '@/lib/actions/collaboration'
import { cn } from '@/lib/utils'

interface Collaborator {
  id: string
  name: string
  logo_url?: string | null
}

interface CollaboratorManagementProps {
  resourceType: 'event' | 'project'
  resourceId: string
  ownerOrgId: string
  currentUserOrgId: string
  collaborators: Collaborator[]
  isOwner: boolean
  onCollaboratorRemoved?: () => void
  className?: string
}

export function CollaboratorManagement({
  resourceType,
  resourceId,
  ownerOrgId,
  currentUserOrgId,
  collaborators,
  isOwner,
  onCollaboratorRemoved,
  className
}: CollaboratorManagementProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmRemoveOrg, setConfirmRemoveOrg] = useState<Collaborator | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async (org: Collaborator) => {
    setIsRemoving(true)
    setRemovingId(org.id)

    try {
      const result = await removeCollaborator({
        resourceType,
        resourceId,
        collaboratorOrgId: org.id,
        currentUserOrgId
      })

      if (result.success) {
        onCollaboratorRemoved?.()
      } else {
        console.error('[CollaboratorManagement] Failed to remove:', result.error)
      }
    } catch (error) {
      console.error('[CollaboratorManagement] Exception:', error)
    } finally {
      setIsRemoving(false)
      setRemovingId(null)
      setConfirmRemoveOrg(null)
    }
  }

  if (collaborators.length === 0) {
    return (
      <div className={cn('space-y-3', className)}>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Collaborating Organizations
        </h3>
        <p className="text-sm text-muted-foreground italic">
          No collaborating organizations yet.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={cn('space-y-3', className)}>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Collaborating Organizations ({collaborators.length})
        </h3>
        <div className="space-y-2">
          {collaborators.map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 ring-2 ring-primary/10 shrink-0">
                  <AvatarImage src={org.logo_url || undefined} alt={org.name} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-accent/10">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground truncate">
                  {org.name}
                </span>
              </div>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmRemoveOrg(org)}
                  disabled={isRemoving && removingId === org.id}
                >
                  {isRemoving && removingId === org.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmRemoveOrg}
        onOpenChange={() => setConfirmRemoveOrg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{confirmRemoveOrg?.name}</strong> from this {resourceType}?
              <br /><br />
              They will no longer be able to edit this {resourceType}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemoveOrg && handleRemove(confirmRemoveOrg)}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
