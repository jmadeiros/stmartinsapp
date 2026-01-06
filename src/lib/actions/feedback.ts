// @ts-nocheck
// TODO(Wave 2): Remove @ts-nocheck after regenerating database types (Task 4.13)
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SubmitFeedbackParams {
  feedback_type: 'bug' | 'feature' | 'general' | 'question' | 'other'
  description: string
  page_url?: string
  screenshot_url?: string
}

export interface FeedbackItem {
  id: string
  user_id: string
  feedback_type: string
  description: string
  page_url: string | null
  screenshot_url: string | null
  status: string
  created_at: string
  updated_at: string
}

/**
 * Submit user feedback
 */
export async function submitFeedback(params: SubmitFeedbackParams) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to submit feedback',
      }
    }

    // Validate required fields
    if (!params.description || params.description.trim().length === 0) {
      return {
        success: false,
        error: 'Description is required',
      }
    }

    if (params.description.length > 2000) {
      return {
        success: false,
        error: 'Description must be less than 2000 characters',
      }
    }

    // Insert feedback
    const { data, error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: user.id,
        feedback_type: params.feedback_type,
        description: params.description.trim(),
        page_url: params.page_url || null,
        screenshot_url: params.screenshot_url || null,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting feedback:', error)
      return {
        success: false,
        error: 'Failed to submit feedback. Please try again.',
      }
    }

    // Revalidate paths that might show feedback
    revalidatePath('/settings')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: data as FeedbackItem,
    }
  } catch (error) {
    console.error('Unexpected error submitting feedback:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Get user's feedback history
 */
export async function getUserFeedback(limit = 50) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view feedback history',
        data: [],
      }
    }

    // Fetch user's feedback
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching feedback:', error)
      return {
        success: false,
        error: 'Failed to fetch feedback history',
        data: [],
      }
    }

    return {
      success: true,
      data: (data || []) as FeedbackItem[],
    }
  } catch (error) {
    console.error('Unexpected error fetching feedback:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      data: [],
    }
  }
}

/**
 * Get feedback count by status (for user)
 */
export async function getUserFeedbackStats() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in',
        data: null,
      }
    }

    // Get feedback grouped by status
    const { data, error } = await supabase
      .from('user_feedback')
      .select('status')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching feedback stats:', error)
      return {
        success: false,
        error: 'Failed to fetch feedback stats',
        data: null,
      }
    }

    // Count by status
    const stats = {
      total: data?.length || 0,
      new: data?.filter((f) => f.status === 'new').length || 0,
      in_review: data?.filter((f) => f.status === 'in_review').length || 0,
      planned: data?.filter((f) => f.status === 'planned').length || 0,
      completed: data?.filter((f) => f.status === 'completed').length || 0,
      dismissed: data?.filter((f) => f.status === 'dismissed').length || 0,
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('Unexpected error fetching feedback stats:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Admin-only: Get all feedback
 */
export async function getAllFeedback(
  filters?: {
    status?: string
    feedback_type?: string
    limit?: number
  }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in',
        data: [],
      }
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (membership?.role !== 'admin') {
      return {
        success: false,
        error: 'You do not have permission to view all feedback',
        data: [],
      }
    }

    // Build query
    let query = supabase
      .from('user_feedback')
      .select(`
        *,
        user:user_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.feedback_type) {
      query = query.eq('feedback_type', filters.feedback_type)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(100)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching all feedback:', error)
      return {
        success: false,
        error: 'Failed to fetch feedback',
        data: [],
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error fetching all feedback:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      data: [],
    }
  }
}

/**
 * Admin-only: Update feedback status
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'new' | 'in_review' | 'planned' | 'completed' | 'dismissed'
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in',
      }
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (membership?.role !== 'admin') {
      return {
        success: false,
        error: 'You do not have permission to update feedback',
      }
    }

    // Update feedback
    const { error } = await supabase
      .from('user_feedback')
      .update({ status })
      .eq('id', feedbackId)

    if (error) {
      console.error('Error updating feedback status:', error)
      return {
        success: false,
        error: 'Failed to update feedback status',
      }
    }

    // Revalidate admin paths
    revalidatePath('/admin')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error updating feedback status:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
