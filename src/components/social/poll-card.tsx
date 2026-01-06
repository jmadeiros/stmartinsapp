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
          const maxVotes = Math.max(...poll.options.map(o => o.vote_count || 0))
          const isWinner = (option.vote_count || 0) === maxVotes && maxVotes > 0 && poll.user_voted

          return (
            <div key={option.id} className="relative group">
              {/* Option Button/Display */}
              <button
                onClick={() => handleOptionClick(option.id)}
                disabled={poll.user_voted || isExpired || isSubmitting}
                className={cn(
                  "w-full relative overflow-hidden rounded-lg border transition-all",
                  poll.user_voted || isExpired
                    ? "cursor-default"
                    : "cursor-pointer hover:border-primary/50 hover:bg-slate-50",
                  isSelected && !poll.user_voted
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-gray-200 bg-white",
                  userVotedThis && "border-primary ring-1 ring-primary/20",
                  isWinner && "border-primary/50"
                )}
              >
                {/* Progress Bar Background */}
                {poll.user_voted && (
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-700 ease-out",
                      userVotedThis
                        ? "bg-primary/15"
                        : "bg-gray-100",
                      isWinner && !userVotedThis && "bg-primary/5"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                {/* Option Content */}
                <div className="relative flex items-center justify-between p-3 min-h-[52px]">
                  <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                    {/* Checkbox/Radio Indicator (only before voting) */}
                    {!poll.user_voted && !isExpired && (
                      <div className={cn(
                        "flex-shrink-0 w-5 h-5 border-2 transition-all flex items-center justify-center",
                        poll.allow_multiple ? "rounded" : "rounded-full",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-gray-300 group-hover:border-primary/50"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    )}

                    {/* Option Text */}
                    <div className="flex flex-col items-start text-left overflow-hidden">
                      <span className={cn(
                        "text-sm text-gray-900 truncate w-full",
                        (userVotedThis || isWinner) ? "font-semibold" : "font-medium"
                      )}>
                        {option.option_text}
                      </span>
                      {isWinner && (
                        <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                          Most voted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Results Display */}
                  {poll.user_voted ? (
                    <div className="flex items-center flex-shrink-0">
                      {/* Avatar Stack */}
                      <div className="flex -space-x-2 mr-3" onClick={(e) => {
                          e.stopPropagation()
                          if (option.voters && option.voters.length > 0) {
                            setShowVoters(showVoters === option.id ? null : option.id)
                          }
                        }}>
                        {option.voters?.slice(0, 3).map((voter) => (
                          <Avatar key={voter.user_id} className="w-6 h-6 border-2 border-white ring-1 ring-gray-100">
                            <AvatarImage src={voter.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px] bg-gray-100 text-gray-500">
                              {voter.full_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {(option.voters?.length || 0) > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-50 border-2 border-white ring-1 ring-gray-100 flex items-center justify-center text-[9px] text-gray-500 font-medium">
                            +{((option.voters?.length || 0) - 3)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-gray-900 leading-none">
                          {percentage}%
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                          {option.vote_count || 0} vote{(option.vote_count !== 1) && 's'}
                        </span>
                      </div>
                      
                      {/* You voted indicator badge */}
                      {userVotedThis && (
                        <div className="ml-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </button>

              {/* Voters List (Dropdown) */}
              {showVoters === option.id && option.voters && option.voters.length > 0 && (
                <div className="mt-2 p-3 bg-white rounded-lg border border-gray-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-xs font-medium text-gray-500 mb-2 px-1">
                    Voted by {option.voters.length} {option.voters.length === 1 ? 'person' : 'people'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.voters.map((voter) => (
                      <div
                        key={voter.user_id}
                        className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full border border-gray-100"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={voter.avatar_url || "/placeholder.svg"} alt={voter.full_name} />
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                            {voter.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-700 font-medium">{voter.full_name}</span>
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
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100">
          <Check className="h-4 w-4 text-green-600" />
          <p className="text-xs font-medium text-gray-600">
            Vote recorded • Results visible
          </p>
        </div>
      )}

      {isExpired && !poll.user_voted && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <p className="text-sm font-medium text-gray-600">
            Poll ended
          </p>
        </div>
      )}
    </CardWrapper>
  )
}
