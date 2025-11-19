// TypeScript types generated from Supabase schema
// Schema: app
// Last updated: 2025-11-19

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  app: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          website: string | null
          mission: string | null
          founded_date: string | null
          size_range: string | null
          cause_areas: string[] | null
          contact_email: string | null
          contact_phone: string | null
          address: Json | null
          social_links: Json | null
          primary_color: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          mission?: string | null
          founded_date?: string | null
          size_range?: string | null
          cause_areas?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json | null
          social_links?: Json | null
          primary_color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          mission?: string | null
          founded_date?: string | null
          size_range?: string | null
          cause_areas?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json | null
          social_links?: Json | null
          primary_color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          job_title: string | null
          phone: string | null
          skills: string[] | null
          interests: string[] | null
          contact_email: string | null
          contact_phone: string | null
          linkedin_url: string | null
          visibility: string
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          job_title?: string | null
          phone?: string | null
          skills?: string[] | null
          interests?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          linkedin_url?: string | null
          visibility?: string
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          job_title?: string | null
          phone?: string | null
          skills?: string[] | null
          interests?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          linkedin_url?: string | null
          visibility?: string
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_memberships: {
        Row: {
          id: string
          user_id: string
          org_id: string
          role: 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'
          is_primary: boolean
          joined_at: string
          left_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          org_id: string
          role?: 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'
          is_primary?: boolean
          joined_at?: string
          left_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string
          role?: 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'
          is_primary?: boolean
          joined_at?: string
          left_at?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          org_id: string
          title: string | null
          content: string
          category: 'intros' | 'wins' | 'opportunities' | 'questions' | 'learnings' | 'general'
          image_url: string | null
          linked_event_id: string | null
          linked_project_id: string | null
          cause: string | null
          is_pinned: boolean
          pinned_at: string | null
          pinned_by: string | null
          view_count: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          org_id: string
          title?: string | null
          content: string
          category?: 'intros' | 'wins' | 'opportunities' | 'questions' | 'learnings' | 'general'
          image_url?: string | null
          linked_event_id?: string | null
          linked_project_id?: string | null
          cause?: string | null
          is_pinned?: boolean
          pinned_at?: string | null
          pinned_by?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          org_id?: string
          title?: string | null
          content?: string
          category?: 'intros' | 'wins' | 'opportunities' | 'questions' | 'learnings' | 'general'
          image_url?: string | null
          linked_event_id?: string | null
          linked_project_id?: string | null
          cause?: string | null
          is_pinned?: boolean
          pinned_at?: string | null
          pinned_by?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          org_id: string
          title: string
          description: string | null
          location: string | null
          virtual_link: string | null
          start_time: string
          end_time: string
          category: 'meeting' | 'social' | 'workshop' | 'building_event' | 'other'
          cause: string | null
          parent_project_id: string | null
          collaborating_orgs: string[] | null
          is_recurring: boolean
          recurrence_rule: string | null
          volunteers_needed: number | null
          seeking_partners: boolean | null
          participants_referred: number
          color: string | null
          ical_uid: string | null
          status: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organizer_id: string
          org_id: string
          title: string
          description?: string | null
          location?: string | null
          virtual_link?: string | null
          start_time: string
          end_time: string
          category?: 'meeting' | 'social' | 'workshop' | 'building_event' | 'other'
          cause?: string | null
          parent_project_id?: string | null
          collaborating_orgs?: string[] | null
          is_recurring?: boolean
          recurrence_rule?: string | null
          volunteers_needed?: number | null
          seeking_partners?: boolean | null
          participants_referred?: number
          color?: string | null
          ical_uid?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organizer_id?: string
          org_id?: string
          title?: string
          description?: string | null
          location?: string | null
          virtual_link?: string | null
          start_time?: string
          end_time?: string
          category?: 'meeting' | 'social' | 'workshop' | 'building_event' | 'other'
          cause?: string | null
          parent_project_id?: string | null
          collaborating_orgs?: string[] | null
          is_recurring?: boolean
          recurrence_rule?: string | null
          volunteers_needed?: number | null
          seeking_partners?: boolean | null
          participants_referred?: number
          color?: string | null
          ical_uid?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      event_rsvps: {
        Row: {
          event_id: string
          user_id: string
          org_id: string
          status: string
          volunteer_offered: boolean | null
          participants_count: number | null
          can_partner: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          org_id: string
          status?: string
          volunteer_offered?: boolean | null
          participants_count?: number | null
          can_partner?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          event_id?: string
          user_id?: string
          org_id?: string
          status?: string
          volunteer_offered?: boolean | null
          participants_count?: number | null
          can_partner?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          author_id: string
          org_id: string
          title: string
          description: string
          impact_goal: string | null
          cause: string | null
          service_area: string | null
          target_date: string | null
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          progress_current: number | null
          progress_target: number | null
          progress_unit: string | null
          volunteers_needed: number | null
          fundraising_goal: string | null
          seeking_partners: boolean | null
          partner_orgs: string[] | null
          interested_orgs: string[] | null
          collaborators: string[] | null
          participants_referred: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          org_id: string
          title: string
          description: string
          impact_goal?: string | null
          cause?: string | null
          service_area?: string | null
          target_date?: string | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          progress_current?: number | null
          progress_target?: number | null
          progress_unit?: string | null
          volunteers_needed?: number | null
          fundraising_goal?: string | null
          seeking_partners?: boolean | null
          partner_orgs?: string[] | null
          interested_orgs?: string[] | null
          collaborators?: string[] | null
          participants_referred?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          org_id?: string
          title?: string
          description?: string
          impact_goal?: string | null
          cause?: string | null
          service_area?: string | null
          target_date?: string | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          progress_current?: number | null
          progress_target?: number | null
          progress_unit?: string | null
          volunteers_needed?: number | null
          fundraising_goal?: string | null
          seeking_partners?: boolean | null
          partner_orgs?: string[] | null
          interested_orgs?: string[] | null
          collaborators?: string[] | null
          participants_referred?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      project_interest: {
        Row: {
          project_id: string
          org_id: string
          user_id: string
          volunteer_offered: boolean | null
          participants_count: number | null
          can_partner: boolean | null
          provide_resources: boolean | null
          contribute_funding: boolean | null
          created_at: string
        }
        Insert: {
          project_id: string
          org_id: string
          user_id: string
          volunteer_offered?: boolean | null
          participants_count?: number | null
          can_partner?: boolean | null
          provide_resources?: boolean | null
          contribute_funding?: boolean | null
          created_at?: string
        }
        Update: {
          project_id?: string
          org_id?: string
          user_id?: string
          volunteer_offered?: boolean | null
          participants_count?: number | null
          can_partner?: boolean | null
          provide_resources?: boolean | null
          contribute_funding?: boolean | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          org_id: string
          posted_by: string
          title: string
          description: string
          job_type: 'paid_staff' | 'volunteer' | 'internship'
          time_commitment: string | null
          requirements: string | null
          contact_email: string | null
          contact_name: string | null
          application_url: string | null
          closing_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          posted_by: string
          title: string
          description: string
          job_type: 'paid_staff' | 'volunteer' | 'internship'
          time_commitment?: string | null
          requirements?: string | null
          contact_email?: string | null
          contact_name?: string | null
          application_url?: string | null
          closing_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          posted_by?: string
          title?: string
          description?: string
          job_type?: 'paid_staff' | 'volunteer' | 'internship'
          time_commitment?: string | null
          requirements?: string | null
          contact_email?: string | null
          contact_name?: string | null
          application_url?: string | null
          closing_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      meeting_notes: {
        Row: {
          id: string
          org_id: string
          author_id: string
          title: string
          content: string | null
          status: 'draft' | 'published' | 'archived'
          meeting_date: string | null
          linked_event_id: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          author_id: string
          title: string
          content?: string | null
          status?: 'draft' | 'published' | 'archived'
          meeting_date?: string | null
          linked_event_id?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          author_id?: string
          title?: string
          content?: string | null
          status?: 'draft' | 'published' | 'archived'
          meeting_date?: string | null
          linked_event_id?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          name: string | null
          is_group: boolean
          org_id: string | null
          created_by: string
          created_at: string
          updated_at: string
          archived: boolean
        }
        Insert: {
          id?: string
          name?: string | null
          is_group?: boolean
          org_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          archived?: boolean
        }
        Update: {
          id?: string
          name?: string | null
          is_group?: boolean
          org_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          archived?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          attachments: Json | null
          reply_to_id: string | null
          edited_at: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          attachments?: Json | null
          reply_to_id?: string | null
          edited_at?: string | null
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          attachments?: Json | null
          reply_to_id?: string | null
          edited_at?: string | null
          created_at?: string
          deleted_at?: string | null
        }
      }
    }
    Views: {
      feed: {
        Row: {
          id: string
          type: string
          title: string
          org_id: string
          author_id: string
          created_at: string
          updated_at: string
        }
      }
      jobs_board: {
        Row: {
          source_type: string
          id: string
          title: string
          content: string
          org_id: string
          author_id: string
          job_type: string | null
          closing_date: string | null
          contact_email: string | null
          contact_name: string | null
          application_url: string | null
          created_at: string
        }
      }
    }
    Functions: {
      member_orgs: {
        Args: { p_user_id: string }
        Returns: { org_id: string; role: string }[]
      }
      rsvp_event: {
        Args: {
          p_event_id: string
          p_org_id: string
          p_status: string
          p_volunteer_offered?: boolean
          p_participants_count?: number
          p_can_partner?: boolean
        }
        Returns: void
      }
      express_project_interest: {
        Args: {
          p_project_id: string
          p_org_id: string
          p_volunteer_offered?: boolean
          p_participants_count?: number
          p_can_partner?: boolean
          p_provide_resources?: boolean
          p_contribute_funding?: boolean
        }
        Returns: void
      }
      count_project_events: {
        Args: { p_project_id: string }
        Returns: number
      }
      generate_event_ical: {
        Args: { p_event_id: string }
        Returns: string
      }
    }
    Enums: {
      user_role: 'admin' | 'st_martins_staff' | 'partner_staff' | 'volunteer'
      post_category: 'intros' | 'wins' | 'opportunities' | 'questions' | 'learnings' | 'general'
      reaction_type: 'like'
      event_category: 'meeting' | 'social' | 'workshop' | 'building_event' | 'other'
      job_type: 'paid_staff' | 'volunteer' | 'internship'
      meeting_note_status: 'draft' | 'published' | 'archived'
      project_status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
    }
  }
}
