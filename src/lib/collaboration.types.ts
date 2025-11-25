// TypeScript types for collaboration features
// These will be integrated into database.types.ts after running the migration

export type CollaborationInvitationStatus = 'pending' | 'accepted' | 'declined'

export type CollaborationInvitation = {
  id: string
  resource_type: 'event' | 'project'
  resource_id: string
  inviter_org_id: string
  inviter_user_id: string
  invitee_org_id: string
  status: CollaborationInvitationStatus
  message: string | null
  responded_by: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}

export type NotificationType =
  | 'collaboration_invitation'
  | 'collaboration_request'
  | 'invitation_accepted'
  | 'invitation_declined'
  | 'event_reminder'
  | 'project_update'
  | 'mention'
  | 'comment'
  | 'reaction'

export type Notification = {
  id: string
  user_id: string
  org_id: string
  type: NotificationType
  title: string
  message: string
  resource_type: 'event' | 'project' | 'post' | 'comment' | null
  resource_id: string | null
  action_url: string | null
  action_data: Record<string, any> | null
  read: boolean
  read_at: string | null
  created_at: string
  expires_at: string | null
}

// For displaying in UI with additional data
export type NotificationWithDetails = Notification & {
  inviter_org_name?: string
  resource_title?: string
}
