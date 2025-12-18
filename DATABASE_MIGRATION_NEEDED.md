# Database Migration Required for Profile Social Links

## Missing Fields in `user_profiles` Table

The profile page implementation includes support for social links, but the following fields are currently missing from the `user_profiles` table:

### Required Fields:
- `twitter_url` (TEXT, nullable) - User's Twitter/X profile URL
- `instagram_url` (TEXT, nullable) - User's Instagram profile URL

### Current Status:
The `user_profiles` table currently only has:
- `linkedin_url` (TEXT, nullable) - Already exists

### Migration SQL:

```sql
-- Add twitter_url and instagram_url to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.twitter_url IS 'User''s Twitter/X profile URL';
COMMENT ON COLUMN public.user_profiles.instagram_url IS 'User''s Instagram profile URL';
```

### Implementation Status:

1. **Profile Components**: Ready to display Twitter and Instagram links (currently commented out in `profile-contact.tsx`)
2. **Profile Edit Dialog**: Has a note that these fields are pending database migration
3. **Server Actions**: Ready to accept and update these fields

### Next Steps:

1. Run the migration SQL in Supabase dashboard or via migration file
2. Regenerate TypeScript types:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/database.types.ts
   ```
3. Uncomment the Twitter and Instagram sections in:
   - `/src/components/profile/profile-contact.tsx` (lines ~60-70)
   - `/src/components/profile/profile-edit-dialog.tsx` (add input fields after LinkedIn)

### File Locations:
- Profile page: `/src/app/(authenticated)/profile/[id]/page.tsx`
- Profile actions: `/src/lib/actions/profile.ts`
- Profile components: `/src/components/profile/*`

---

**Created**: 2025-12-15
**Related to**: Task 3.9 - Build Profile Page
