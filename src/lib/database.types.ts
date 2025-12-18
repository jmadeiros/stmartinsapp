export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_items: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          note_id: string
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          note_id: string
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          note_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "meeting_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          created_at: string
          created_by: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          message: string
          org_id: string | null
          severity: string
          target_orgs: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          org_id?: string | null
          severity?: string
          target_orgs?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          org_id?: string | null
          severity?: string
          target_orgs?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          muted: boolean
          org_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          org_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_unread: {
        Row: {
          conversation_id: string
          last_message_id: string | null
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_message_id?: string | null
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_message_id?: string | null
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_unread_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_unread_last_message_id_fkey"
            columns: ["last_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          name: string | null
          org_id: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by: string
          id?: string
          is_group?: boolean
          name?: string | null
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          name?: string | null
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attachments: {
        Row: {
          created_at: string
          event_id: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          event_id: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          event_id?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attachments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attachments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          can_partner: boolean | null
          created_at: string
          event_id: string
          org_id: string
          participants_count: number | null
          status: string
          updated_at: string
          user_id: string
          volunteer_offered: boolean | null
        }
        Insert: {
          can_partner?: boolean | null
          created_at?: string
          event_id: string
          org_id: string
          participants_count?: number | null
          status?: string
          updated_at?: string
          user_id: string
          volunteer_offered?: boolean | null
        }
        Update: {
          can_partner?: boolean | null
          created_at?: string
          event_id?: string
          org_id?: string
          participants_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          volunteer_offered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          cause: string | null
          collaborating_orgs: string[] | null
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          end_time: string
          ical_uid: string | null
          id: string
          is_recurring: boolean
          location: string | null
          org_id: string
          organizer_id: string
          parent_project_id: string | null
          participants_referred: number | null
          recurrence_rule: string | null
          seeking_partners: boolean | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
          virtual_link: string | null
          volunteers_needed: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["event_category"]
          cause?: string | null
          collaborating_orgs?: string[] | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_time: string
          ical_uid?: string | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          org_id: string
          organizer_id: string
          parent_project_id?: string | null
          participants_referred?: number | null
          recurrence_rule?: string | null
          seeking_partners?: boolean | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
          virtual_link?: string | null
          volunteers_needed?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          cause?: string | null
          collaborating_orgs?: string[] | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_time?: string
          ical_uid?: string | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          org_id?: string
          organizer_id?: string
          parent_project_id?: string | null
          participants_referred?: number | null
          recurrence_rule?: string | null
          seeking_partners?: boolean | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
          virtual_link?: string | null
          volunteers_needed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent_project"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent_project"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notes: {
        Row: {
          author_id: string
          content: string | null
          created_at: string
          id: string
          linked_event_id: string | null
          meeting_date: string | null
          org_id: string
          published_at: string | null
          status: Database["public"]["Enums"]["meeting_note_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string
          id?: string
          linked_event_id?: string | null
          meeting_date?: string | null
          org_id: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["meeting_note_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string
          id?: string
          linked_event_id?: string | null
          meeting_date?: string | null
          org_id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["meeting_note_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_meeting_notes_linked_event"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_meeting_notes_linked_event"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_data: Json | null
          actor_id: string | null
          created_at: string | null
          id: string
          link: string | null
          read: boolean | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          actor_id?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          actor_id?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: Json | null
          cause_areas: string[] | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          founded_date: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          mission: string | null
          name: string
          primary_color: string | null
          size_range: string | null
          slug: string
          social_links: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          cause_areas?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          founded_date?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          mission?: string | null
          name: string
          primary_color?: string | null
          size_range?: string | null
          slug: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          cause_areas?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          founded_date?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          mission?: string | null
          name?: string
          primary_color?: string | null
          size_range?: string | null
          slug?: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          created_at: string
          id: string
          mentioned_user_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentioned_user_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentioned_user_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["post_category"]
          cause: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string | null
          is_pinned: boolean
          linked_event_id: string | null
          linked_project_id: string | null
          org_id: string
          pinned_at: string | null
          pinned_by: string | null
          title: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          category?: Database["public"]["Enums"]["post_category"]
          cause?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          linked_event_id?: string | null
          linked_project_id?: string | null
          org_id: string
          pinned_at?: string | null
          pinned_by?: string | null
          title?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["post_category"]
          cause?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          linked_event_id?: string | null
          linked_project_id?: string | null
          org_id?: string
          pinned_at?: string | null
          pinned_by?: string | null
          title?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_linked_event"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_linked_event"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_linked_project"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_linked_project"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_interest: {
        Row: {
          can_partner: boolean | null
          contribute_funding: boolean | null
          created_at: string
          org_id: string
          participants_count: number | null
          project_id: string
          provide_resources: boolean | null
          user_id: string
          volunteer_offered: boolean | null
        }
        Insert: {
          can_partner?: boolean | null
          contribute_funding?: boolean | null
          created_at?: string
          org_id: string
          participants_count?: number | null
          project_id: string
          provide_resources?: boolean | null
          user_id: string
          volunteer_offered?: boolean | null
        }
        Update: {
          can_partner?: boolean | null
          contribute_funding?: boolean | null
          created_at?: string
          org_id?: string
          participants_count?: number | null
          project_id?: string
          provide_resources?: boolean | null
          user_id?: string
          volunteer_offered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "project_interest_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_interest_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_interest_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          project_id: string
          title: string
          update_type: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          project_id: string
          title: string
          update_type?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          update_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          author_id: string
          cause: string | null
          collaborators: string[] | null
          created_at: string
          deleted_at: string | null
          description: string
          fundraising_goal: string | null
          id: string
          impact_goal: string | null
          interested_orgs: string[] | null
          org_id: string
          participants_referred: number | null
          partner_orgs: string[] | null
          progress_current: number | null
          progress_target: number | null
          progress_unit: string | null
          seeking_partners: boolean | null
          service_area: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_date: string | null
          title: string
          updated_at: string
          volunteers_needed: number | null
        }
        Insert: {
          author_id: string
          cause?: string | null
          collaborators?: string[] | null
          created_at?: string
          deleted_at?: string | null
          description: string
          fundraising_goal?: string | null
          id?: string
          impact_goal?: string | null
          interested_orgs?: string[] | null
          org_id: string
          participants_referred?: number | null
          partner_orgs?: string[] | null
          progress_current?: number | null
          progress_target?: number | null
          progress_unit?: string | null
          seeking_partners?: boolean | null
          service_area?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_date?: string | null
          title: string
          updated_at?: string
          volunteers_needed?: number | null
        }
        Update: {
          author_id?: string
          cause?: string | null
          collaborators?: string[] | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          fundraising_goal?: string | null
          id?: string
          impact_goal?: string | null
          interested_orgs?: string[] | null
          org_id?: string
          participants_referred?: number | null
          partner_orgs?: string[] | null
          progress_current?: number | null
          progress_target?: number | null
          progress_unit?: string | null
          seeking_partners?: boolean | null
          service_area?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
          volunteers_needed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memberships: {
        Row: {
          id: string
          is_primary: boolean
          joined_at: string
          left_at: string | null
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean
          joined_at?: string
          left_at?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean
          joined_at?: string
          left_at?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          full_name: string
          interests: string[] | null
          job_title: string | null
          last_active_at: string | null
          linkedin_url: string | null
          organization_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          skills: string[] | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name: string
          interests?: string[] | null
          job_title?: string | null
          last_active_at?: string | null
          linkedin_url?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name?: string
          interests?: string[] | null
          job_title?: string | null
          last_active_at?: string | null
          linkedin_url?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          id: string
          user_id: string | null
          feedback_type: string
          description: string
          page_url: string | null
          screenshot_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          feedback_type?: string
          description: string
          page_url?: string | null
          screenshot_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          feedback_type?: string
          description?: string
          page_url?: string | null
          screenshot_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          language: string | null
          notification_frequency: string | null
          push_notifications: boolean
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          language?: string | null
          notification_frequency?: string | null
          push_notifications?: boolean
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          language?: string | null
          notification_frequency?: string | null
          push_notifications?: boolean
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      calendar: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          going_count: number | null
          id: string | null
          interested_count: number | null
          is_upcoming: boolean | null
          location: string | null
          org_id: string | null
          organizer_id: string | null
          seeking_partners: boolean | null
          start_time: string | null
          title: string | null
          updated_at: string | null
          volunteers_needed: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          going_count?: never
          id?: string | null
          interested_count?: never
          is_upcoming?: never
          location?: string | null
          org_id?: string | null
          organizer_id?: string | null
          seeking_partners?: boolean | null
          start_time?: string | null
          title?: string | null
          updated_at?: string | null
          volunteers_needed?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          going_count?: never
          id?: string | null
          interested_count?: never
          is_upcoming?: never
          location?: string | null
          org_id?: string | null
          organizer_id?: string | null
          seeking_partners?: boolean | null
          start_time?: string | null
          title?: string | null
          updated_at?: string | null
          volunteers_needed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feed: {
        Row: {
          author_id: string | null
          created_at: string | null
          id: string | null
          org_id: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          author_id: string | null
          comment_count: number | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_pinned: boolean | null
          org_id: string | null
          reaction_count: number | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          comment_count?: never
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_pinned?: boolean | null
          org_id?: string | null
          reaction_count?: never
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          comment_count?: never
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_pinned?: boolean | null
          org_id?: string | null
          reaction_count?: never
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          event_count: number | null
          full_name: string | null
          id: string | null
          interests: string[] | null
          job_title: string | null
          last_active_at: string | null
          linkedin_url: string | null
          organization_id: string | null
          organization_name: string | null
          phone: string | null
          post_count: number | null
          project_count: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          skills: string[] | null
          updated_at: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_view: {
        Row: {
          author_id: string | null
          cause: string | null
          created_at: string | null
          description: string | null
          fundraising_goal: string | null
          id: string | null
          impact_goal: string | null
          interest_count: number | null
          org_id: string | null
          progress_current: number | null
          progress_percentage: number | null
          progress_target: number | null
          progress_unit: string | null
          seeking_partners: boolean | null
          service_area: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          target_date: string | null
          title: string | null
          update_count: number | null
          updated_at: string | null
          volunteers_needed: number | null
        }
        Insert: {
          author_id?: string | null
          cause?: string | null
          created_at?: string | null
          description?: string | null
          fundraising_goal?: string | null
          id?: string | null
          impact_goal?: string | null
          interest_count?: never
          org_id?: string | null
          progress_current?: number | null
          progress_percentage?: never
          progress_target?: number | null
          progress_unit?: string | null
          seeking_partners?: boolean | null
          service_area?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          target_date?: string | null
          title?: string | null
          update_count?: never
          updated_at?: string | null
          volunteers_needed?: number | null
        }
        Update: {
          author_id?: string | null
          cause?: string | null
          created_at?: string | null
          description?: string | null
          fundraising_goal?: string | null
          id?: string | null
          impact_goal?: string | null
          interest_count?: never
          org_id?: string | null
          progress_current?: number | null
          progress_percentage?: never
          progress_target?: number | null
          progress_unit?: string | null
          seeking_partners?: boolean | null
          service_area?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          target_date?: string | null
          title?: string | null
          update_count?: never
          updated_at?: string | null
          volunteers_needed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      complete_action_item: {
        Args: { p_action_id: string }
        Returns: undefined
      }
      count_project_events: { Args: { p_project_id: string }; Returns: number }
      express_project_interest: {
        Args: {
          p_can_partner?: boolean
          p_contribute_funding?: boolean
          p_org_id: string
          p_participants_count?: number
          p_project_id: string
          p_provide_resources?: boolean
          p_volunteer_offered?: boolean
        }
        Returns: undefined
      }
      generate_event_ical: { Args: { p_event_id: string }; Returns: string }
      get_total_unread_count: { Args: never; Returns: number }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      member_orgs: {
        Args: { p_user_id: string }
        Returns: {
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      rsvp_event: {
        Args: {
          p_can_partner?: boolean
          p_event_id: string
          p_org_id: string
          p_participants_count?: number
          p_status: string
          p_volunteer_offered?: boolean
        }
        Returns: undefined
      }
      start_conversation: {
        Args: {
          p_is_group?: boolean
          p_name?: string
          p_org_id: string
          p_participant_user_ids: string[]
        }
        Returns: string
      }
    }
    Enums: {
      event_category:
        | "meeting"
        | "social"
        | "workshop"
        | "building_event"
        | "other"
      job_type: "paid_staff" | "volunteer" | "internship"
      meeting_note_status: "draft" | "published" | "archived"
      post_category:
        | "intros"
        | "wins"
        | "opportunities"
        | "questions"
        | "learnings"
        | "general"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      reaction_type: "like"
      user_role: "admin" | "st_martins_staff" | "partner_staff" | "volunteer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_category: [
        "meeting",
        "social",
        "workshop",
        "building_event",
        "other",
      ],
      job_type: ["paid_staff", "volunteer", "internship"],
      meeting_note_status: ["draft", "published", "archived"],
      post_category: [
        "intros",
        "wins",
        "opportunities",
        "questions",
        "learnings",
        "general",
      ],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      reaction_type: ["like"],
      user_role: ["admin", "st_martins_staff", "partner_staff", "volunteer"],
    },
  },
} as const
