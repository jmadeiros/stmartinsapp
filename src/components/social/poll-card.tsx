"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Poll, PollOption } from "@/lib/actions/polls"
import { votePoll, getPollResults } from "@/lib/actions/polls"
import { useRouter } from "next/navigation"

interface PollCardProps {
  initialPoll: Poll
  showInline?: boolean // If true, shows as part of a post card
}

export function PollCard({ initialPoll, showInline = false }: PollCardProps) {
  const [poll, setPoll] = useState<Poll>(initialPoll)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVoters, setShowVoters] = useState<string | null>(null)
  const router = useRouter()

  // Initialize selected options if user has already voted
  useEffect(() => {
    if (poll.user_voted && poll.user_vote_option_ids) {
      setSelectedOptions(poll.user_vote_option_ids)
    }
  }, [poll.user_voted, poll.user_vote_option_ids])

  const handleOptionClick = (optionId: string) => {
    // Can't change vote after voting
    if (poll.user_voted) return

    if (poll.allow_multiple) {
      // Toggle selection for multiple choice
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      // Single selection
      setSelectedOptions([optionId])
    }
  }

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) {
      setError('Please select at least one option')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await votePoll(poll.id, selectedOptions)

    if (result.success) {
      // Refresh poll results
      const updatedPoll = await getPollResults(poll.id)
      if (updatedPoll) {
        setPoll(updatedPoll)
      }
      router.refresh()
    } else {
      setError(result.error || 'Failed to submit vote')
    }

    setIsSubmitting(false)
  }

  const getPercentage = (option: PollOption) => {
    if (poll.total_votes === 0) return 0
    return Math.round(((option.vote_count || 0) / poll.total_votes) * 100)
  }

  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false

  const CardWrapper = showInline ? 'div' : Card

  return (
    <CardWrapper className={cn(
      showInline ? "border-t border-gray-100 pt-4 mt-4" : "bg-white rounded-2xl p-4 shadow-md border border-gray-100"
    )}>
      {/* Poll Question */}
      <div className="mb-4">
        <h3 className={cn(
          "font-semibold text-gray-900 mb-1",
          showInline ? "text-base" : "text-lg"
        )}>
          {poll.question}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{poll.allow_multiple ? 'Multiple choice' : 'Single choice'}</span>
          <span>•</span>
          <span>{poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}</span>
          {isExpired && (
            <>
              <span>•</span>
              <span className="text-red-600 font-medium">Expired</span>
            </>
          )}
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-3 mb-4">
        {poll.options.map((option) => {
          const percentage = getPercentage(option)
          const isSelected = selectedOptions.includes(option.id)
          const userVotedThis = poll.user_voted && poll.user_vote_option_ids?.includes(option.id)

          return (
            <div key={option.id} className="relative">
              {/* Option Button/Display */}
              <button
                onClick={() => handleOptionClick(option.id)}
                disabled={poll.user_voted || isExpired || isSubmitting}
                className={cn(
                  "w-full relative overflow-hidden rounded-lg border-2 transition-all",
                  poll.user_voted || isExpired
                    ? "cursor-default"
                    : "cursor-pointer hover:border-primary/50",
                  isSelected && !poll.user_voted
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white",
                  userVotedThis && "border-primary bg-primary/10"
                )}
              >
                {/* Progress Bar Background (WhatsApp-style) */}
                {poll.user_voted && (
                  <div
                    className={cn(
                      "absolute inset-0 transition-all duration-500",
                      userVotedThis
                        ? "bg-primary/20"
                        : "bg-gray-100"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                {/* Option Content */}
                <div className="relative flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Checkbox/Radio Indicator */}
                    {!poll.user_voted && !isExpired && (
                      <div className={cn(
                        "flex-shrink-0 w-5 h-5 border-2 transition-all flex items-center justify-center",
                        poll.allow_multiple ? "rounded" : "rounded-full",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-gray-300 bg-white"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    )}

                    {/* Option Text */}
                    <span className={cn(
                      "text-sm font-medium text-gray-900 truncate",
                      userVotedThis && "font-semibold"
                    )}>
                      {option.option_text}
                    </span>

                    {/* "You voted" indicator */}
                    {userVotedThis && (
                      <span className="text-xs font-medium text-primary ml-auto flex-shrink-0">
                        You voted
                      </span>
                    )}
                  </div>

                  {/* Vote Count & Percentage */}
                  {poll.user_voted && (
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowVoters(showVoters === option.id ? null : option.id)
                        }}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary transition-colors"
                        disabled={!option.voters || option.voters.length === 0}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>{option.vote_count || 0}</span>
                      </button>
                      <span className="text-sm font-semibold text-gray-900 min-w-[3rem] text-right">
                        {percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </button>

              {/* Voters List */}
              {showVoters === option.id && option.voters && option.voters.length > 0 && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Voted by {option.voters.length} {option.voters.length === 1 ? 'person' : 'people'}:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.voters.map((voter) => (
                      <div
                        key={voter.user_id}
                        className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-gray-200"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={voter.avatar_url || "/placeholder.svg"} alt={voter.full_name} />
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {voter.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-700">{voter.full_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Vote Button */}
      {!poll.user_voted && !isExpired && (
        <Button
          onClick={handleSubmitVote}
          disabled={selectedOptions.length === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
        </Button>
      )}

      {/* Voted/Expired Message */}
      {poll.user_voted && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            You voted. Results are visible to all participants.
          </p>
        </div>
      )}

      {isExpired && !poll.user_voted && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            This poll has expired. You can no longer vote.
          </p>
        </div>
      )}
    </CardWrapper>
  )
}
