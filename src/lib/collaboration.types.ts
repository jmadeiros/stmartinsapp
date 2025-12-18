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
  | 'project_interest'
  | 'mention'
  | 'comment'
  | 'reply'
  | 'reaction'
  | 'rsvp'

export type Notification = {
  id: string
  user_id: string
  actor_id: string | null
  type: NotificationType
  title: string
  reference_type: string | null
  reference_id: string | null
  link: string | null
  action_data: Record<string, any> | null
  read: boolean
  created_at: string
  // Legacy field aliases for backwards compatibility
  resource_type?: string | null
  resource_id?: string | null
  message?: string | null
}

// For displaying in UI with additional data
export type NotificationWithDetails = Notification & {
  inviter_org_name?: string
  resource_title?: string
}
