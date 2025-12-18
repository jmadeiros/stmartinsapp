# Polls Feature - Quick Start Guide

## TL;DR
The polls feature is **already implemented** in the codebase. You just need to apply the database migration to enable it.

## Quick Setup (3 steps)

### 1. Apply the Migration
```bash
# Option A: Using Supabase CLI
npx supabase migration up

# Option B: Using Supabase Dashboard
# Go to SQL Editor and run:
# supabase/migrations/20251216010200_add_polls.sql
```

### 2. (Optional) Regenerate Types
```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_REF \
  > src/lib/database.types.ts
```

### 3. Test It
1. Navigate to the dashboard feed
2. Write a post
3. Click the "Poll" button (bar chart icon)
4. Create a poll with 2-3 options
5. Submit and vote!

## What's Already Built

### Database Tables
- `polls` - Poll questions and settings
- `poll_options` - Answer choices
- `poll_votes` - User votes

### Server Actions
File: `/Users/josh/stmartinsapp/src/lib/actions/polls.ts`
- `createPoll()` - Create a new poll
- `votePoll()` - Cast a vote
- `getPollResults()` - Get results with voters
- `getPollByPostId()` - Fetch poll for a post

### UI Components
- **Poll Card**: `/Users/josh/stmartinsapp/src/components/social/poll-card.tsx`
  - WhatsApp-style progress bars
  - Shows who voted
  - Highlights your vote
  
- **Create Dialog**: `/Users/josh/stmartinsapp/src/components/social/create-poll-dialog.tsx`
  - Add/remove options
  - Single/multi-choice toggle
  - Optional expiration

### Integration
- **Main Feed**: Poll button in post composer
- **Post Card**: Polls display inline with posts

## How Users Will Use It

### Creating a Poll
1. Write a post in the feed composer
2. Click the Poll button (before posting)
3. Post is created automatically
4. Poll dialog opens
5. Enter question and at least 2 options
6. Click "Create Poll"

### Voting
1. See poll in the feed (embedded in post)
2. Select one or more options
3. Click "Submit Vote"
4. Results appear immediately
5. Cannot change vote after submitting

### Viewing Results
- Progress bars show vote percentages
- Your vote is highlighted
- Click voter count to see who voted
- Non-anonymous voting

## Key Features

- WhatsApp-style UI with animated progress bars
- Single-choice or multi-choice voting
- Vote immutability (can't change after voting)
- Non-anonymous (see who voted for what)
- Optional expiration dates
- Real-time results
- Responsive design
- Full RLS security

## File Locations

```
/Users/josh/stmartinsapp/
├── supabase/migrations/
│   └── 20251216010200_add_polls.sql      <- Database schema
├── src/lib/actions/
│   └── polls.ts                           <- Server actions
└── src/components/social/
    ├── poll-card.tsx                      <- Display component
    ├── create-poll-dialog.tsx             <- Creation UI
    ├── main-feed.tsx                      <- Integration point
    └── post-card.tsx                      <- Renders polls in posts
```

## Common Issues & Solutions

### Issue: Poll button doesn't appear
**Solution**: Check that main-feed.tsx has the Poll button (line ~687-747)

### Issue: Can't create poll
**Solution**: Ensure migration has been applied to database

### Issue: RLS errors
**Solution**: Check RLS policies are enabled on all three tables

### Issue: Types errors
**Solution**: The implementation uses custom types, not generated types. No action needed.

## Security

All tables have Row Level Security enabled:
- Anyone can view polls and votes
- Only poll owners can modify/delete
- Users can only vote with their own user_id
- Votes are tracked but voters are visible

## Performance

- Polls lazy load when posts are viewed
- Database indexes on all foreign keys
- Efficient queries with joins
- Single query fetches all poll data

## Next Steps

After setup:
1. Test creating polls with different options
2. Test voting (single and multi-choice)
3. Test vote immutability
4. Test voter list display
5. Verify responsive design on mobile

## Need Help?

See full documentation:
- `POLLS_FEATURE_SUMMARY.md` - Complete feature details
- `POLLS_ARCHITECTURE.md` - Technical architecture

## Status: Ready for Production

All requirements met:
- [x] Database migration
- [x] Server actions
- [x] UI components
- [x] Integration complete
- [x] Security (RLS)
- [x] Error handling
- [x] Type safety
- [x] Responsive design

Just apply the migration and you're ready to go!
