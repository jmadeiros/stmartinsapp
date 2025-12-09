# St Martins Village Hub - AI Features Roadmap

> **Created:** December 9, 2024
> **Related Docs:** [MASTER_PLAN_DEC2024.md](./MASTER_PLAN_DEC2024.md), [ARCHITECTURE_MAP.md](./ARCHITECTURE_MAP.md)

---

## 1. Recommended AI Features

| Feature | What It Does | Priority | Complexity | Est. Cost/Month |
|---------|--------------|----------|------------|-----------------|
| **Auto-tagging** | Suggests category/cause when creating posts/events | High | 🟢 Easy | ~$0.50 |
| **Event-Project Linking** | "This event seems related to that project" | High | 🟡 Medium | ~$1.50 |
| **Smart Notifications** | "Based on your interests, check out this event" | Medium | 🟡 Medium | ~$2.50 |
| **Org Collaboration Matcher** | "These orgs work on similar causes" | Medium | 🟡 Medium | ~$1.00 |
| **Meeting Notes Summary** | Auto-generates summary + action items | Medium | 🟡 Medium | ~$1.00 |
| **Weekly/Monthly Highlights** | AI-generated community summary | Medium | 🟡 Medium | ~$0.50 |
| **Data Health Analyzer** | "This project has no activity in 30 days" | Low | 🟢 Easy | ~$0.50 |

**Total Estimated Cost:** ~$8/month for medium usage (100-500 users)

---

## 2. Implementation Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    Next.js      │    │   Vercel Cron    │    │   Anthropic     │
│   API Routes    │    │   (scheduled)    │    │   Claude API    │
└────────┬────────┘    └────────┬─────────┘    └────────┬────────┘
         │                      │                       │
         └──────────────────────┼───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │       Supabase        │
                    │  ┌─────────────────┐  │
                    │  │  ai_suggestions │  │
                    │  │  ai_analysis    │  │
                    │  └─────────────────┘  │
                    └───────────────────────┘
```

### Recommended Stack
- **AI Provider:** Anthropic Claude (Sonnet for complex, Haiku for simple)
- **Triggers:** Next.js API Routes + Vercel Cron for scheduled jobs
- **Storage:** New Supabase tables for AI suggestions and cached analysis

---

## 3. Database Schema for AI

```sql
-- Store AI-generated suggestions
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  suggestion_type TEXT NOT NULL, -- 'link_event_project', 'org_collaboration', 'data_quality'
  source_entity_type TEXT,       -- 'event', 'project', 'post', 'organization'
  source_entity_id UUID,
  target_entity_type TEXT,
  target_entity_id UUID,
  confidence DECIMAL(3,2),       -- 0.00 to 1.00
  reasoning TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed'
  actioned_by UUID REFERENCES auth.users(id),
  actioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Cache AI analysis results
CREATE TABLE ai_content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,    -- 'post', 'event', 'project'
  content_id UUID NOT NULL,
  analysis_type TEXT NOT NULL,   -- 'sentiment', 'categorization', 'tags', 'summary'
  result JSONB NOT NULL,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_suggestions_org_status ON ai_suggestions(org_id, status);
CREATE INDEX idx_ai_content_analysis_content ON ai_content_analysis(content_type, content_id);
```

---

## 4. Feature Details

### 4.1 Auto-Tagging

**Trigger:** On post/event creation
**Function:**
```typescript
const tags = await autoTagContent(postContent, 'post')
// Returns: {
//   suggestedCategory: 'wins',
//   suggestedCause: 'Youth Development',
//   suggestedTags: ['milestone', 'graduation']
// }
```

**Implementation:**
- Call Claude API with content
- Parse response for category, cause, tags
- Show suggestions in UI (user confirms)

### 4.2 Event-Project Linking

**Trigger:** Nightly cron job
**Function:**
```typescript
const suggestions = await analyzeUnlinkedEvents()
// Returns: [{
//   event_id: '...',
//   project_id: '...',
//   confidence: 0.85,
//   reasoning: 'Both focus on food security and target same community'
// }]
```

**Implementation:**
- Query events without `parent_project_id`
- Query active projects
- Use Claude to find semantic matches
- Store suggestions in `ai_suggestions` table
- Show in admin/notification UI

### 4.3 Smart Notifications

**Trigger:** Daily or on-demand
**Function:**
```typescript
const recommendations = await generateSmartNotifications(userId)
// Returns: [{
//   type: 'ai_recommendation',
//   title: 'Event Suggestion',
//   message: 'Based on your interest in Education, check out "Youth Coding Camp"',
//   resource_type: 'event',
//   resource_id: '...',
//   confidence: 0.8
// }]
```

**Implementation:**
- Get user's skills, interests from profile
- Match against upcoming events/projects
- Generate personalized recommendations

### 4.4 Org Collaboration Matcher

**Trigger:** On-demand or weekly
**Function:**
```typescript
const matches = await findPotentialCollaborators(orgId)
// Returns: [{
//   org_id: '...',
//   score: 0.9,
//   collaboration_ideas: ['Joint food drive', 'Shared volunteer training'],
//   reasoning: 'Both focus on food security in Eastside district'
// }]
```

**Implementation:**
- Compare `cause_areas[]` arrays
- Use Claude for semantic mission matching
- Suggest collaboration opportunities

### 4.5 Meeting Notes Summary

**Trigger:** On meeting note creation/update
**Function:**
```typescript
const summary = await summarizeMeetingNotes(rawNotes, meetingTitle)
// Returns: {
//   summary: '2-3 sentence overview',
//   actionItems: [{ task: '...', assignee: '...', deadline: '...' }],
//   keyDecisions: ['Decision 1', 'Decision 2'],
//   followUps: ['Item 1', 'Item 2']
// }
```

### 4.6 Weekly/Monthly Highlights

**Trigger:** Scheduled (weekly Monday 8am, monthly 1st)
**Function:**
```typescript
const highlights = await generateWeeklyHighlights(orgId)
// Returns: {
//   summary: 'AI-generated narrative',
//   upcomingEvents: [...],
//   recentWins: [...],
//   activeProjects: [...],
//   newMemberCount: 3
// }
```

**Output Example:**
```
November 2024 - Village Hub Highlights

WINS
- Youth Forward completed 6-week coding bootcamp - 47 students graduated
- Food Bank distributed 2,400 meals across 12 events

EVENTS
- 23 events hosted across 8 organizations
- Top attended: Community Thanksgiving Dinner (156 attendees)

COLLABORATIONS
- 5 new partnerships formed
- Most active: Tech for Good x City Food Bank

COMMUNITY
- 2 new organizations joined the hub
- 84 volunteer hours logged
```

### 4.7 Data Health Analyzer

**Trigger:** Weekly cron job
**Function:**
```typescript
const report = await generateDataHealthReport(orgId)
// Returns: {
//   orphanedEvents: [{ id, title, issue: 'no_rsvps', suggestion: '...' }],
//   orphanedProjects: [{ id, title, issue: 'stale', suggestion: '...' }],
//   connectionSuggestions: [...]
// }
```

---

## 5. API Routes

```
/api/ai/
├── analyze-suggestions/route.ts    # Nightly analysis job
├── weekly-highlights/route.ts      # Monday 8am summary
├── auto-tag/route.ts               # On-demand content tagging
├── summarize-notes/route.ts        # Meeting notes summary
└── health-report/route.ts          # Data health check
```

### Example: Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/ai/analyze-suggestions",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/ai/weekly-highlights",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

---

## 6. Cost Optimization

### Strategies
1. **Cache aggressively** - Store results in `ai_content_analysis`
2. **Batch operations** - Analyze multiple items in single API calls
3. **Use Haiku for simple tasks** - Sentiment, categorization
4. **Use Sonnet for complex tasks** - Summaries, matching
5. **Rate limit by org** - Prevent runaway costs
6. **Skip redundant analysis** - Check if recently analyzed

### Cost Breakdown

| Task | Model | Tokens/Call | Calls/Month | Cost |
|------|-------|-------------|-------------|------|
| Auto-tagging | Haiku | 500 | 200 | $0.50 |
| Event linking | Sonnet | 3,000 | 30 | $0.45 |
| Smart notifications | Sonnet | 1,000 | 500 | $2.50 |
| Weekly highlights | Sonnet | 2,000 | 4 | $0.04 |
| Meeting summaries | Sonnet | 1,500 | 50 | $0.75 |
| **Total** | | | | **~$4-8/month** |

---

## 7. Privacy Considerations

### For Charity Data
1. **Data minimization** - Only send necessary context to AI
2. **No PII in prompts** - Strip names, emails before analysis
3. **Audit logging** - Track what data is sent to AI
4. **Opt-out capability** - Let users disable AI features
5. **Transparent labeling** - Mark AI-generated content clearly

### Example: Sanitization
```typescript
function sanitizeForAI(content: string): string {
  // Remove email addresses
  content = content.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]')
  // Remove phone numbers
  content = content.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
  return content
}
```

---

## 8. UI Components Needed

| Component | Purpose | Location |
|-----------|---------|----------|
| `AISuggestionCard` | Display suggestions for admin review | Dashboard sidebar |
| `AutoTagSuggestions` | Show tag suggestions during create | Create dialogs |
| `AIInsightsBadge` | Indicate AI-generated content | Cards |
| `SmartNotificationItem` | AI recommendation in notifications | Notification dropdown |
| `HealthReportPanel` | Data health dashboard | Admin page |

---

## 9. Implementation Phases

### Phase 5A: Foundation
- [ ] Install `@anthropic-ai/sdk`
- [ ] Create `/src/lib/ai/` directory structure
- [ ] Set up database schema
- [ ] Create API route skeleton

### Phase 5B: Auto-Tagging
- [ ] Implement `autoTagContent()` function
- [ ] Add to create post/event dialogs
- [ ] Show suggestions (non-blocking)

### Phase 5C: Suggestions Engine
- [ ] Implement event-project linking
- [ ] Set up nightly cron job
- [ ] Build admin review UI

### Phase 5D: Smart Features
- [ ] Implement smart notifications
- [ ] Add meeting notes summarization
- [ ] Build weekly highlights generator

### Phase 5E: Polish
- [ ] Add cost tracking
- [ ] Implement caching
- [ ] User preference settings
- [ ] Documentation

---

## 10. Alternative: Using Claude Code Interactively

### Key Finding
For a project of this scale, **building custom AI infrastructure may be overkill**.

Claude Code already provides:
- Full codebase analysis on demand
- Pattern detection
- Architecture review
- Schema analysis

### Recommended Approach
1. **Automate simple tasks** (auto-tagging, summaries) with API
2. **Keep complex analysis interactive** (architecture review, refactoring suggestions)
3. **Create custom Claude commands** for repeated tasks:

```markdown
<!-- .claude/commands/review.md -->
Analyze the codebase for:
1. Duplicate components or code
2. Missing error handling
3. Schema improvements
4. Unused exports
5. Architectural concerns
```

---

## 11. Files to Create

```
src/
├── lib/
│   └── ai/
│       ├── index.ts                    # Main exports
│       ├── client.ts                   # Anthropic client setup
│       ├── suggestions/
│       │   ├── event-project-linker.ts
│       │   ├── org-matcher.ts
│       │   └── mention-linker.ts
│       ├── health/
│       │   ├── data-health-analyzer.ts
│       │   └── quality-checker.ts
│       ├── content/
│       │   ├── auto-tagger.ts
│       │   ├── sentiment-analyzer.ts
│       │   └── meeting-summarizer.ts
│       ├── notifications/
│       │   └── smart-recommender.ts
│       └── summaries/
│           └── weekly-highlights.ts
└── app/
    └── api/
        └── ai/
            ├── analyze-suggestions/route.ts
            ├── weekly-highlights/route.ts
            └── auto-tag/route.ts
```

---

*End of AI Features Roadmap*
