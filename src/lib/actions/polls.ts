'use server'

import { createClient } from "@/lib/supabase/server"

export type PollOption = {
  id: string
  poll_id: string
  option_text: string
  position: number
  vote_count?: number
  voters?: Array<{ user_id: string; full_name: string; avatar_url: string | null }>
}

export type Poll = {
  id: string
  post_id: string
  question: string
  allow_multiple: boolean
  expires_at: string | null
  created_at: string
  options: PollOption[]
  total_votes: number
  user_voted: boolean
  user_vote_option_ids?: string[]
}

/**
 * Create a new poll attached to a post
 */
export async function createPoll(params: {
  postId: string
  question: string
  options: string[]
  allowMultiple?: boolean
  expiresAt?: string
}) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Not authenticated', data: null }
    }

    // Verify the post belongs to the current user
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', params.postId)
      .single()

    if (postError || !post) {
      return { success: false, error: 'Post not found', data: null }
    }

    type PostRow = { author_id: string }
    const typedPost = post as PostRow

    if (typedPost.author_id !== user.id) {
      return { success: false, error: 'Not authorized to add poll to this post', data: null }
    }

    // Create the poll
    const { data: pollData, error: pollError } = await (supabase
      .from('polls') as any)
      .insert({
        post_id: params.postId,
        question: params.question,
        allow_multiple: params.allowMultiple || false,
        expires_at: params.expiresAt || null
      })
      .select()
      .single()

    if (pollError || !pollData) {
      console.error('[createPoll] Error creating poll:', pollError)
      return { success: false, error: pollError?.message || 'Failed to create poll', data: null }
    }

    type PollRow = { id: string }
    const typedPoll = pollData as PollRow

    // Create poll options
    const optionsToInsert = params.options.map((text, index) => ({
      poll_id: typedPoll.id,
      option_text: text,
      position: index
    }))

    const { error: optionsError } = await (supabase
      .from('poll_options') as any)
      .insert(optionsToInsert)

    if (optionsError) {
      console.error('[createPoll] Error creating options:', optionsError)
      // Clean up poll if options fail
      await (supabase.from('polls') as any).delete().eq('id', typedPoll.id)
      return { success: false, error: 'Failed to create poll options', data: null }
    }

    console.log(`[createPoll] Created poll ${typedPoll.id} with ${params.options.length} options`)
    return { success: true, data: pollData, error: null }
  } catch (error) {
    console.error('[createPoll] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Vote on a poll
 * If user has already voted and poll doesn't allow multiple, prevent voting
 */
export async function votePoll(pollId: string, optionIds: string[]) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get poll to check if it allows multiple votes
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select('id, allow_multiple, expires_at')
      .eq('id', pollId)
      .single()

    if (pollError || !pollData) {
      return { success: false, error: 'Poll not found' }
    }

    type PollRow = { id: string; allow_multiple: boolean; expires_at: string | null }
    const typedPoll = pollData as PollRow

    // Check if poll has expired
    if (typedPoll.expires_at && new Date(typedPoll.expires_at) < new Date()) {
      return { success: false, error: 'Poll has expired' }
    }

    // Check if user has already voted
    const { data: existingVotes, error: checkError } = await supabase
      .from('poll_votes')
      .select('poll_option_id')
      .in('poll_option_id',
        // Get all option IDs for this poll
        await supabase
          .from('poll_options')
          .select('id')
          .eq('poll_id', pollId)
          .then(res => (res.data || []).map((o: any) => o.id))
      )
      .eq('user_id', user.id)

    if (checkError) {
      console.error('[votePoll] Error checking existing votes:', checkError)
      return { success: false, error: 'Failed to check existing votes' }
    }

    // If user has already voted, return error (can't change vote)
    if (existingVotes && existingVotes.length > 0) {
      return { success: false, error: 'You have already voted on this poll. Votes cannot be changed.' }
    }

    // Validate option IDs
    if (!typedPoll.allow_multiple && optionIds.length > 1) {
      return { success: false, error: 'This poll only allows single choice' }
    }

    // Verify all option IDs belong to this poll
    const { data: validOptions, error: validError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('poll_id', pollId)
      .in('id', optionIds)

    if (validError || !validOptions || validOptions.length !== optionIds.length) {
      return { success: false, error: 'Invalid option IDs' }
    }

    // Insert votes
    const votesToInsert = optionIds.map(optionId => ({
      poll_option_id: optionId,
      user_id: user.id
    }))

    const { error: insertError } = await (supabase
      .from('poll_votes') as any)
      .insert(votesToInsert)

    if (insertError) {
      console.error('[votePoll] Error inserting votes:', insertError)
      return { success: false, error: 'Failed to record vote' }
    }

    console.log(`[votePoll] User ${user.id} voted on poll ${pollId}`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[votePoll] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get poll results with vote counts and voter information
 */
export async function getPollResults(pollId: string): Promise<Poll | null> {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get poll data
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single()

    if (pollError || !pollData) {
      console.error('[getPollResults] Error fetching poll:', pollError)
      return null
    }

    type PollRow = {
      id: string
      post_id: string
      question: string
      allow_multiple: boolean
      expires_at: string | null
      created_at: string
    }
    const typedPoll = pollData as PollRow

    // Get poll options
    const { data: optionsData, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('position')

    if (optionsError || !optionsData) {
      console.error('[getPollResults] Error fetching options:', optionsError)
      return null
    }

    type OptionRow = {
      id: string
      poll_id: string
      option_text: string
      position: number
    }
    const typedOptions = optionsData as OptionRow[]

    // Get vote counts and voters for each option
    const optionsWithVotes: PollOption[] = await Promise.all(
      typedOptions.map(async (option) => {
        // Get vote count
        const { count } = await supabase
          .from('poll_votes')
          .select('*', { count: 'exact', head: true })
          .eq('poll_option_id', option.id)

        // Get voters info
        const { data: votesData } = await supabase
          .from('poll_votes')
          .select('user_id')
          .eq('poll_option_id', option.id)

        type VoteRow = { user_id: string }
        const typedVotes = (votesData || []) as VoteRow[]

        // Get user profiles for voters
        const voters: Array<{ user_id: string; full_name: string; avatar_url: string | null }> = []
        if (typedVotes.length > 0) {
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', typedVotes.map(v => v.user_id))

          if (profilesData) {
            type ProfileRow = { user_id: string; full_name: string; avatar_url: string | null }
            voters.push(...(profilesData as ProfileRow[]))
          }
        }

        return {
          ...option,
          vote_count: count || 0,
          voters
        }
      })
    )

    // Calculate total votes
    const totalVotes = optionsWithVotes.reduce((sum, opt) => sum + (opt.vote_count || 0), 0)

    // Check if current user has voted
    let userVoted = false
    let userVoteOptionIds: string[] = []
    if (user) {
      const { data: userVotesData } = await supabase
        .from('poll_votes')
        .select('poll_option_id')
        .in('poll_option_id', optionsWithVotes.map(o => o.id))
        .eq('user_id', user.id)

      if (userVotesData && userVotesData.length > 0) {
        userVoted = true
        type UserVoteRow = { poll_option_id: string }
        userVoteOptionIds = (userVotesData as UserVoteRow[]).map(v => v.poll_option_id)
      }
    }

    return {
      ...typedPoll,
      options: optionsWithVotes,
      total_votes: totalVotes,
      user_voted: userVoted,
      user_vote_option_ids: userVoteOptionIds
    }
  } catch (error) {
    console.error('[getPollResults] Exception:', error)
    return null
  }
}

/**
 * Get poll by post ID
 */
export async function getPollByPostId(postId: string): Promise<Poll | null> {
  const supabase = await createClient()

  try {
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select('id')
      .eq('post_id', postId)
      .single()

    if (pollError || !pollData) {
      return null
    }

    type PollRow = { id: string }
    const typedPoll = pollData as PollRow

    return await getPollResults(typedPoll.id)
  } catch (error) {
    console.error('[getPollByPostId] Exception:', error)
    return null
  }
}

/**
 * Check if user has voted on a poll
 */
export async function getUserVote(pollId: string) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { hasVoted: false, optionIds: [] }
    }

    // Get all option IDs for this poll
    const { data: optionsData } = await supabase
      .from('poll_options')
      .select('id')
      .eq('poll_id', pollId)

    if (!optionsData || optionsData.length === 0) {
      return { hasVoted: false, optionIds: [] }
    }

    type OptionRow = { id: string }
    const optionIds = (optionsData as OptionRow[]).map(o => o.id)

    // Check if user has voted
    const { data: votesData } = await supabase
      .from('poll_votes')
      .select('poll_option_id')
      .in('poll_option_id', optionIds)
      .eq('user_id', user.id)

    if (!votesData || votesData.length === 0) {
      return { hasVoted: false, optionIds: [] }
    }

    type VoteRow = { poll_option_id: string }
    const votedOptionIds = (votesData as VoteRow[]).map(v => v.poll_option_id)

    return { hasVoted: true, optionIds: votedOptionIds }
  } catch (error) {
    console.error('[getUserVote] Exception:', error)
    return { hasVoted: false, optionIds: [] }
  }
}
