# Implementation Plan: Tasks 3.12 & 3.13

> **Created:** January 5, 2025
> **Status:** Ready for Implementation
> **Parallelization:** 6 agents total (3 per task)

---

## Task 3.12: Collaboration Management (Simplified)

### Overview
Build a simplified collaboration system where:
- **Owner** = creating org (can edit, delete, manage collaborators)
- **Collaborators** = joined orgs (can edit, but cannot delete or manage other collaborators)
- No "co-owner" concept - just owner + collaborators
- Silent removal (no notification when removed)

### What Already Exists
| Component | Status |
|-----------|--------|
| `collaboration_invitations` table | ✅ Exists (not in generated types) |
| `collaborating_orgs[]` on events | ✅ Exists |
| `collaborators[]` on projects | ✅ Exists |
| `inviteCollaborators()` action | ✅ Exists |
| `respondToInvitation()` action | ✅ Exists |
| `removeCollaborator()` action | ❌ Missing |
| `getMyCollaborations()` action | ❌ Missing |
| Collaborator management UI | ❌ Missing |
| Profile "My Collaborations" | ❌ Missing |

### Implementation Steps

#### Agent 1: Backend/Server Actions
**Files to modify/create:**
- `/src/lib/actions/collaboration.ts`

**Tasks:**
1. Add `removeCollaborator(resourceType, resourceId, collaboratorOrgId)`:
   - Verify current user is owner (org_id matches)
   - Remove org from `collaborating_orgs`/`collaborators` array
   - Use `array_remove()` SQL function
   - Return success/error

2. Add `getMyCollaborations(orgId)`:
   - Query events where `orgId = ANY(collaborating_orgs)`
   - Query projects where `orgId = ANY(collaborators)`
   - Return combined list with basic details (id, title, type, owner org name)

3. Add `canEditResource(resourceType, resourceId, userOrgId)`:
   - Return true if user's org is owner OR in collaborators array
   - Used by detail pages for permission checks

**Estimated complexity:** 🟡 Medium (2-3 hours)

---

#### Agent 2: Collaborator Management UI
**Files to create:**
- `/src/components/social/collaborator-management.tsx`

**Tasks:**
1. Build `CollaboratorManagement` component:
   ```tsx
   interface Props {
     resourceType: 'event' | 'project'
     resourceId: string
     ownerOrgId: string
     currentUserOrgId: string
     collaborators: Array<{ id: string; name: string; logo_url?: string }>
     isOwner: boolean
     onCollaboratorRemoved: () => void
   }
   ```

2. Features:
   - List current collaborators with org avatars/names
   - "Remove" button (X icon) - only visible to owner
   - Confirmation dialog before removal
   - Loading state during removal
   - Empty state if no collaborators

3. Integrate into `event-detail.tsx`:
   - Add below organizer section
   - Pass collaborator data and isOwner flag

4. Integrate into `project-detail.tsx`:
   - Add in sidebar area
   - Pass collaborator data and isOwner flag

**Estimated complexity:** 🟡 Medium (3-4 hours)

---

#### Agent 3: Profile Collaborations Section
**Files to modify/create:**
- `/src/components/profile/profile-collaborations.tsx` (NEW)
- `/src/components/profile/profile-activity.tsx` (MODIFY)

**Tasks:**
1. Create `ProfileCollaborations` component:
   - Fetch user's org collaborations via `getMyCollaborations()`
   - Display as card list (similar to posts/events tabs)
   - Show resource type badge (Event/Project)
   - Show owner org name
   - Click navigates to detail page

2. Add "Collaborations" tab to `ProfileActivity`:
   - New tab alongside "Posts", "Organized", "Attending"
   - Render `ProfileCollaborations` when selected

3. Pass org_id through component chain if not already available

**Estimated complexity:** 🟡 Medium (2-3 hours)

---

### Integration Phase (After Parallel Work)
- Wire up real data to components
- Update permission checks in detail pages (use `canEditResource`)
- Test all flows end-to-end

---

## Task 3.13: Meeting Notes (Import-Based)

### Overview
Build an import-based meeting notes system:
- Notes imported via API from Granola (through Zapier)
- Users browse notes read-only (no manual creation)
- Action items extracted and shown on dedicated page
- No assignee matching for MVP

### Granola → Zapier → Village Hub Flow
```
┌──────────┐    ┌────────┐    ┌─────────────────────────┐
│ Granola  │───▶│ Zapier │───▶│ /api/meeting-notes/import│
│ (AI)     │    │ Webhook│    │ (Village Hub)           │
└──────────┘    └────────┘    └─────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ meeting_notes   │
                              │ action_items    │
                              │ notifications   │
                              └─────────────────┘
```

### What Already Exists
| Component | Status |
|-----------|--------|
| `meeting_notes` table | ✅ Exists |
| `action_items` table | ✅ Exists |
| `meeting_attendees` table | ✅ Exists |
| `complete_action_item()` DB function | ✅ Exists |
| RLS policies | ✅ Exists |
| `/meeting-notes` route | ❌ Missing |
| Meeting notes components | ❌ Missing |
| Import API endpoint | ❌ Missing |
| Server actions | ❌ Missing |
| `/my-action-items` page | ❌ Missing |

### API Design

#### Endpoint: `POST /api/meeting-notes/import`

**Authentication:** API key in header
```
Authorization: Bearer <MEETING_NOTES_API_KEY>
```

**Request Body:**
```json
{
  "meeting_date": "2025-01-06",
  "title": "Monday Team Meeting - Jan 6, 2025",
  "summary": "## Key Discussion Points\n\n- Item 1\n- Item 2\n\n## Decisions Made\n\n...",
  "action_items": [
    {
      "title": "Follow up with partner org",
      "description": "Reach out to Hope Foundation about collaboration",
      "due_date": "2025-01-13"
    }
  ],
  "tags": ["weekly", "planning"]
}
```

**Response:**
```json
{
  "success": true,
  "meeting_note_id": "uuid",
  "action_items_created": 2
}
```

### Implementation Steps

#### Agent 1: Data Layer (Types & Queries)
**Files to create:**
- `/src/lib/meeting-notes/types.ts`
- `/src/lib/queries/meeting-notes.ts`
- `/src/lib/actions/meeting-notes.ts`

**Tasks:**
1. Create TypeScript types:
   ```typescript
   export interface MeetingNote {
     id: string
     title: string
     content: string | null
     meeting_date: string
     status: 'draft' | 'published' | 'archived'
     tags: string[] | null
     created_at: string
     author?: { id: string; full_name: string; avatar_url?: string }
   }

   export interface ActionItem {
     id: string
     note_id: string
     title: string
     description: string | null
     due_date: string | null
     status: 'open' | 'in_progress' | 'completed' | 'cancelled'
     assigned_to: string | null
     completed_at: string | null
   }
   ```

2. Create query helpers:
   - `getMeetingNotes(supabase, orgId, options)` - paginated list
   - `getMeetingNoteById(supabase, noteId)` - with action items
   - `getActionItems(supabase, orgId)` - all action items for org
   - `getMyActionItems(supabase, userId)` - action items assigned to user

3. Create server actions:
   - `completeActionItem(actionItemId)` - mark as done

**Estimated complexity:** 🟡 Medium (2-3 hours)

---

#### Agent 2: Import API
**Files to create:**
- `/src/app/api/meeting-notes/import/route.ts`

**Tasks:**
1. Create POST handler:
   - Validate API key from `MEETING_NOTES_API_KEY` env var
   - Validate request body (Zod schema)
   - Create meeting note record (status: 'published')
   - Create action item records (status: 'open')
   - Return success response

2. Error handling:
   - 401 for invalid API key
   - 400 for invalid body
   - 500 for database errors

3. Add env var to `.env.local.example`:
   ```
   MEETING_NOTES_API_KEY=your-secret-key-here
   ```

**Estimated complexity:** 🟡 Medium (2-3 hours)

---

#### Agent 3: Read-Only UI
**Files to create:**
- `/src/app/(authenticated)/meeting-notes/page.tsx`
- `/src/app/(authenticated)/meeting-notes/[id]/page.tsx`
- `/src/app/(authenticated)/my-action-items/page.tsx`
- `/src/components/meeting-notes/meeting-notes-list.tsx`
- `/src/components/meeting-notes/meeting-note-detail.tsx`
- `/src/components/meeting-notes/action-item-card.tsx`

**Tasks:**
1. **Meeting Notes List Page** (`/meeting-notes`):
   - Server component fetching notes
   - Card layout showing: title, date, tags, action item count
   - Click navigates to detail
   - Empty state if no notes

2. **Meeting Note Detail Page** (`/meeting-notes/[id]`):
   - Full note content (render Markdown)
   - Meeting date header
   - Tags display
   - Action items section at bottom
   - "Previous" / "Next" meeting navigation

3. **Action Item Card**:
   - Title, description
   - Due date with overdue styling
   - Status badge
   - "Mark Complete" button (if assigned to current user)

4. **My Action Items Page** (`/my-action-items`):
   - List of action items assigned to current user
   - Filter by status (open/completed)
   - Click opens parent meeting note

5. **Navigation Integration**:
   - Add "Meeting Notes" to header dropdown or left sidebar

**Estimated complexity:** 🔴 Large (4-6 hours)

---

### Integration Phase (After Parallel Work)
- Test Zapier webhook integration
- Verify all pages load correctly
- Test action item completion flow
- Add to navigation

---

## Parallelization Strategy

### Orchestrator Pattern (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR                            │
│  (Coordinates work, handles integration, resolves conflicts)│
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  3.12 Agent 1 │   │  3.12 Agent 2 │   │  3.12 Agent 3 │
│  Backend      │   │  Mgmt UI      │   │  Profile      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                    ┌───────┴───────┐
                    │  Integration  │
                    │    Phase      │
                    └───────────────┘

        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  3.13 Agent 1 │   │  3.13 Agent 2 │   │  3.13 Agent 3 │
│  Data Layer   │   │  Import API   │   │  Read-Only UI │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                    ┌───────┴───────┐
                    │  Integration  │
                    │    Phase      │
                    └───────────────┘
```

### Agent Dependencies

**3.12 Collaboration:**
| Agent | Depends On | Can Start |
|-------|------------|-----------|
| Agent 1 (Backend) | Nothing | Immediately |
| Agent 2 (Mgmt UI) | Types from Agent 1 | After Agent 1 types done |
| Agent 3 (Profile) | `getMyCollaborations()` from Agent 1 | After Agent 1 query done |

**3.13 Meeting Notes:**
| Agent | Depends On | Can Start |
|-------|------------|-----------|
| Agent 1 (Data) | Nothing | Immediately |
| Agent 2 (API) | Types from Agent 1 | After Agent 1 types done |
| Agent 3 (UI) | Queries from Agent 1 | After Agent 1 queries done |

### Recommended Execution Order

1. **Wave 1 (Parallel):** Start all backend/data agents
   - 3.12 Agent 1 (Backend actions)
   - 3.13 Agent 1 (Data layer)

2. **Wave 2 (Parallel):** After Wave 1 types ready
   - 3.12 Agent 2 (Management UI)
   - 3.12 Agent 3 (Profile section)
   - 3.13 Agent 2 (Import API)
   - 3.13 Agent 3 (Read-only UI)

3. **Wave 3 (Sequential):** Integration
   - Wire up 3.12 components to detail pages
   - Wire up 3.13 navigation
   - End-to-end testing

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `collaboration_invitations` not in types | Type errors | Use `as any` or regenerate types |
| Race conditions on array updates | Data corruption | Use `array_remove()`/`array_append()` SQL |
| Zapier webhook format changes | Import breaks | Validate all fields, log raw requests |
| Large meeting content | Slow page loads | Truncate in list view, lazy load |
| No assignee matching | Action items orphaned | Store raw text, allow manual assignment later |

---

## Testing Checklist

### 3.12 Collaboration
- [ ] Owner can see collaborator management section
- [ ] Owner can remove collaborators (silent, no notification)
- [ ] Non-owner cannot see remove buttons
- [ ] Collaborator can edit event/project they're on
- [ ] Profile shows "My Collaborations" with correct data
- [ ] Empty state displays when no collaborations

### 3.13 Meeting Notes
- [ ] API accepts valid import requests
- [ ] API rejects invalid API key (401)
- [ ] API rejects malformed body (400)
- [ ] Meeting notes list page shows all notes
- [ ] Meeting note detail renders Markdown content
- [ ] Action items display with status
- [ ] "Mark Complete" works for action items
- [ ] My Action Items page shows user's items
- [ ] Navigation includes Meeting Notes link

---

## Environment Variables Needed

```env
# For 3.13 Meeting Notes Import
MEETING_NOTES_API_KEY=generate-a-secure-random-key
```

---

## Files Summary

### 3.12 Collaboration (6 files)
| File | Action |
|------|--------|
| `/src/lib/actions/collaboration.ts` | MODIFY - add 3 functions |
| `/src/components/social/collaborator-management.tsx` | CREATE |
| `/src/components/social/event-detail.tsx` | MODIFY - add component |
| `/src/components/social/project-detail.tsx` | MODIFY - add component |
| `/src/components/profile/profile-collaborations.tsx` | CREATE |
| `/src/components/profile/profile-activity.tsx` | MODIFY - add tab |

### 3.13 Meeting Notes (10 files)
| File | Action |
|------|--------|
| `/src/lib/meeting-notes/types.ts` | CREATE |
| `/src/lib/queries/meeting-notes.ts` | CREATE |
| `/src/lib/actions/meeting-notes.ts` | CREATE |
| `/src/app/api/meeting-notes/import/route.ts` | CREATE |
| `/src/app/(authenticated)/meeting-notes/page.tsx` | CREATE |
| `/src/app/(authenticated)/meeting-notes/[id]/page.tsx` | CREATE |
| `/src/app/(authenticated)/my-action-items/page.tsx` | CREATE |
| `/src/components/meeting-notes/meeting-notes-list.tsx` | CREATE |
| `/src/components/meeting-notes/meeting-note-detail.tsx` | CREATE |
| `/src/components/meeting-notes/action-item-card.tsx` | CREATE |

---

*End of Implementation Plan*
