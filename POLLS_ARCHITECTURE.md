# Polls Feature Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POLLS FEATURE ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────┘

USER CREATES POLL:
┌──────────────┐     1. Write Post      ┌──────────────────┐
│              │  ──────────────────>    │   main-feed.tsx  │
│   Browser    │     2. Click Poll       │                  │
│              │  ──────────────────>    │  (Post Composer) │
└──────────────┘                         └────────┬─────────┘
                                                  │
                                         3. createPost()
                                                  │
                                                  v
                                         ┌────────────────┐
                                         │  posts.ts      │
                                         │  (Server       │
                                         │   Action)      │
                                         └────────┬───────┘
                                                  │
                                         4. Insert into DB
                                                  │
                                                  v
                                         ┌────────────────┐
                                         │   Supabase     │
                                         │   posts table  │
                                         └────────┬───────┘
                                                  │
                                         5. Return post ID
                                                  │
                                                  v
                                         ┌────────────────┐
                                         │ main-feed.tsx  │
                                         │ Opens dialog   │
                                         └────────┬───────┘
                                                  │
                                         6. User fills poll
                                                  │
                                                  v
                                    ┌────────────────────────┐
                                    │ create-poll-dialog.tsx │
                                    └────────────┬───────────┘
                                                 │
                                        7. createPoll()
                                                 │
                                                 v
                                         ┌───────────────┐
                                         │   polls.ts    │
                                         │ (Server       │
                                         │  Action)      │
                                         └───────┬───────┘
                                                 │
                                    8. Insert poll + options
                                                 │
                                                 v
                                         ┌───────────────┐
                                         │   Supabase    │
                                         │ polls tables  │
                                         └───────────────┘

USER VOTES ON POLL:
┌──────────────┐     1. View Post       ┌──────────────────┐
│              │  ──────────────────>    │  post-card.tsx   │
│   Browser    │     with Poll           │                  │
│              │                          └────────┬─────────┘
└──────────────┘                                   │
                                          2. getPollByPostId()
                                                   │
                                                   v
                                          ┌────────────────┐
                                          │   polls.ts     │
                                          │  (Server       │
                                          │   Action)      │
                                          └────────┬───────┘
                                                   │
                                          3. Fetch poll data
                                                   │
                                                   v
                                          ┌────────────────┐
                                          │   Supabase     │
                                          │  polls tables  │
                                          └────────┬───────┘
                                                   │
                                          4. Return poll with
                                             vote counts
                                                   │
                                                   v
                                          ┌────────────────┐
                                          │  poll-card.tsx │
                                          │ (Display poll) │
                                          └────────┬───────┘
                                                   │
                                          5. User selects
                                             options
                                                   │
                                                   v
                                          6. User clicks
                                             "Submit Vote"
                                                   │
                                                   v
                                          ┌────────────────┐
                                          │   votePoll()   │
                                          │  (Server       │
                                          │   Action)      │
                                          └────────┬───────┘
                                                   │
                                          7. Validate & Insert
                                                   │
                                                   v
                                          ┌────────────────┐
                                          │   Supabase     │
                                          │  poll_votes    │
                                          └────────┬───────┘
                                                   │
                                          8. Refresh results
                                                   │
                                                   v
                                          ┌────────────────┐
                                          │  poll-card.tsx │
                                          │ Show results   │
                                          │ with bars      │
                                          └────────────────┘
```

## Component Hierarchy

```
main-feed.tsx (Post Composer)
├── create-poll-dialog.tsx (Modal)
│   └── Server Action: createPoll()
│
post-card.tsx (Feed Item)
└── poll-card.tsx (Embedded Poll Display)
    ├── Server Action: getPollByPostId()
    ├── Server Action: votePoll()
    └── Server Action: getPollResults()
```

## Database Schema Relationships

```
┌────────────┐
│   posts    │
│  (post_id) │
└─────┬──────┘
      │
      │ FK: post_id
      │
      v
┌────────────┐
│   polls    │
│  (poll_id) │
└─────┬──────┘
      │
      │ FK: poll_id
      │
      v
┌──────────────┐
│ poll_options │
│ (option_id)  │
└──────┬───────┘
       │
       │ FK: poll_option_id
       │
       v
┌────────────┐              ┌────────────┐
│ poll_votes │   FK: user   │ auth.users │
│            │ ─────────>   │ (user_id)  │
└────────────┘              └────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────┐
│              ROW LEVEL SECURITY (RLS)               │
└─────────────────────────────────────────────────────┘

polls table:
  ✓ SELECT: Anyone authenticated
  ✓ INSERT: Authenticated users
  ✓ UPDATE: Post author only
  ✓ DELETE: Post author only

poll_options table:
  ✓ SELECT: Anyone authenticated
  ✓ INSERT: Post author only
  ✓ UPDATE: Post author only
  ✓ DELETE: Post author only

poll_votes table:
  ✓ SELECT: Anyone authenticated
  ✓ INSERT: Own user_id only
  ✓ DELETE: Own user_id only
  ✓ UPDATE: Not allowed
```

## State Management Flow

```
poll-card.tsx Component State:

┌──────────────────────────────────────────────┐
│  useState<Poll>(initialPoll)                 │  <- From server
│  useState<string[]>(selectedOptions)         │  <- User selection
│  useState<boolean>(isSubmitting)             │  <- Loading state
│  useState<string | null>(error)              │  <- Error display
│  useState<string | null>(showVoters)         │  <- UI toggle
└──────────────────────────────────────────────┘
        │
        │ User selects options
        v
┌──────────────────────────────────────────────┐
│  handleOptionClick(optionId)                 │
│  - Toggle selection if multi-choice          │
│  - Replace selection if single-choice        │
└──────────────────────────────────────────────┘
        │
        │ User submits
        v
┌──────────────────────────────────────────────┐
│  handleSubmitVote()                          │
│  - Call votePoll() server action             │
│  - Refresh poll results                      │
│  - Update local state                        │
└──────────────────────────────────────────────┘
        │
        │ Success
        v
┌──────────────────────────────────────────────┐
│  Display results with progress bars          │
│  - Show vote counts                          │
│  - Calculate percentages                     │
│  - Highlight user's vote                     │
│  - Enable voter list expansion               │
└──────────────────────────────────────────────┘
```

## API Contract

### createPoll()
```typescript
Input: {
  postId: string
  question: string
  options: string[]
  allowMultiple?: boolean
  expiresAt?: string
}

Output: {
  success: boolean
  data: { id: string } | null
  error: string | null
}
```

### votePoll()
```typescript
Input: (pollId: string, optionIds: string[])

Output: {
  success: boolean
  error: string | null
}
```

### getPollResults()
```typescript
Input: (pollId: string)

Output: Poll {
  id: string
  question: string
  allow_multiple: boolean
  expires_at: string | null
  options: PollOption[]
  total_votes: number
  user_voted: boolean
  user_vote_option_ids: string[]
}
```

### getPollByPostId()
```typescript
Input: (postId: string)

Output: Poll | null
```

## UI States

```
POLL CREATION:
┌─────────────────────────────────────────┐
│ 1. Idle State                           │
│    - Empty form                         │
│    - "Create Poll" button disabled      │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 2. Editing State                        │
│    - User typing question               │
│    - Adding/removing options            │
│    - Validation feedback                │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 3. Submitting State                     │
│    - Loading spinner                    │
│    - Buttons disabled                   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 4. Success State                        │
│    - Dialog closes                      │
│    - Feed refreshes                     │
│    - Poll appears in post               │
└─────────────────────────────────────────┘

POLL VOTING:
┌─────────────────────────────────────────┐
│ 1. Unvoted State                        │
│    - Checkboxes/radio buttons           │
│    - "Submit Vote" button               │
│    - No results shown                   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 2. Selecting State                      │
│    - Options highlighted                │
│    - Submit button enabled              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 3. Submitting State                     │
│    - Loading spinner                    │
│    - Buttons disabled                   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 4. Voted State                          │
│    - Progress bars visible              │
│    - User's vote highlighted            │
│    - "Submit Vote" hidden               │
│    - Voter lists expandable             │
│    - Percentages calculated             │
└─────────────────────────────────────────┘
```

## Performance Optimizations

1. **Lazy Loading**: Polls fetched only when post loads
2. **Indexed Queries**: DB indexes on post_id, poll_id, option_id
3. **Memoization**: useCallback for comment loading
4. **Optimistic Updates**: UI updates before server confirms
5. **Batch Fetching**: All poll data fetched in one query

## Error Handling

```
Server Actions Return Pattern:
{
  success: boolean
  data?: T
  error?: string
}

Client Component Pattern:
- Display error in error state
- Show user-friendly message
- Allow retry action
- Log errors to console
```
