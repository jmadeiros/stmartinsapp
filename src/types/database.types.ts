// Database types will be generated from Supabase schema
// Run: npx supabase gen types typescript --project-id <project-ref> --schema public > src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tables will be auto-generated from your Supabase schema
      // This is a placeholder
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'volunteer' | 'partner_staff' | 'st_martins_staff' | 'admin'
      post_category: 'announcement' | 'event' | 'job' | 'story' | 'discussion'
      event_category: 'meeting' | 'social' | 'workshop' | 'building_event'
      job_type: 'paid_staff' | 'volunteer' | 'internship'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
