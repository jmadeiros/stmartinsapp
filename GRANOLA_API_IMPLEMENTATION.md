# Granola API Direct Sync Implementation Plan

## Overview

This document outlines how to implement direct synchronization with Granola's API to automatically pull meeting notes into The Village Hub. The implementation is based on reverse engineering research from [Joseph Thacker's blog post](https://josephthacker.com/hacking/2025/05/08/reverse-engineering-granola-notes.html) and analysis of the local Granola data structures.

## Authentication

### Token Location

Granola stores authentication tokens in:
```
~/Library/Application Support/Granola/supabase.json
```

### Token Structure

The file contains multiple authentication systems:

```typescript
interface GranolaAuth {
  // WorkOS tokens - PRIMARY for API access
  workos_tokens: string; // JSON string containing:
  // {
  //   access_token: string;      // JWT for API calls
  //   refresh_token: string;     // For token refresh (25 chars)
  //   expires_in: number;        // Typically 21599 seconds (~6 hours)
  //   token_type: "Bearer";
  //   obtained_at: number;       // Unix timestamp in milliseconds
  //   session_id: string;        // e.g., "session_01K82Z9BGCP6JD43A3YP5N15NE"
  //   external_id: string;       // User UUID
  //   sign_in_method: "GoogleOAuth";
  // }

  // Cognito tokens - legacy/backup
  cognito_tokens: string;

  // User information
  user_info: string; // JSON with email, name, etc.

  // Current session
  session_id: string;
}
```

### Reading Credentials (TypeScript)

```typescript
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

interface WorkOSTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  obtained_at: number;
  session_id: string;
  external_id: string;
  sign_in_method: string;
}

async function getGranolaCredentials(): Promise<WorkOSTokens> {
  const authPath = join(
    homedir(),
    'Library/Application Support/Granola/supabase.json'
  );

  const raw = await readFile(authPath, 'utf-8');
  const data = JSON.parse(raw);

  return JSON.parse(data.workos_tokens);
}

function isTokenValid(tokens: WorkOSTokens): boolean {
  const expirationTime = tokens.obtained_at + (tokens.expires_in * 1000);
  const now = Date.now();
  // Add 5 minute buffer
  return now < (expirationTime - 300000);
}
```

## API Endpoints

### Base URL
```
https://api.granola.ai
```

### Get Documents

**Endpoint:** `POST /v2/get-documents`

**Headers:**
```typescript
{
  "Authorization": `Bearer ${access_token}`,
  "Content-Type": "application/json",
  "User-Agent": "Granola/5.354.0",
  "X-Client-Version": "5.354.0",
  "Accept-Encoding": "gzip"
}
```

**Request Body:**
```typescript
{
  limit: number;      // Max documents to return (tested up to 200)
  offset: number;     // For pagination
  include_last_viewed_panel: boolean;  // Include the main content panel
}
```

**Response:**
```typescript
interface GetDocumentsResponse {
  docs: GranolaDocument[];
  deleted: string[];  // Array of deleted document IDs
}
```

## Data Structures

### Document Structure

```typescript
interface GranolaDocument {
  id: string;                    // UUID
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
  deleted_at: string | null;

  title: string;
  type: 'meeting';

  // User association
  user_id: string;               // UUID
  workspace_id: string;          // UUID

  // Content (ProseMirror format)
  notes: ProseMirrorDoc;         // User's manual notes
  notes_plain: string;           // Plain text version (often empty)
  notes_markdown: string;        // Markdown version (often empty)

  // Meeting metadata
  google_calendar_event: GoogleCalendarEvent | null;
  transcribe: boolean;           // Whether transcription was enabled
  valid_meeting: boolean;
  meeting_end_count: number;

  // AI-generated content
  overview: string | null;
  summary: string | null;
  chapters: any | null;

  // Participants
  people: {
    title: string;
    creator: Attendee;
    attendees: Attendee[];
    created_at: string;
    sharing_link_visibility: string;
  };

  // Sharing settings
  public: boolean;
  has_shareable_link: boolean;
  sharing_link_visibility: 'public' | 'private';
  visibility: string | null;

  // Attachments
  attachments: any[];

  // Template used
  selected_template: string | null;

  // Subscription/billing
  subscription_plan_id: string;
  creation_source: 'macOS' | 'iOS' | 'windows';

  // The main content panel (when include_last_viewed_panel: true)
  last_viewed_panel?: DocumentPanel;
}

interface DocumentPanel {
  id: string;                    // Panel UUID
  document_id: string;           // Parent document UUID
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  title: string;                 // e.g., "Summary"
  template_slug: string;         // e.g., "v2:meeting-summary-consolidated"

  content: ProseMirrorDoc;       // ProseMirror JSON format
  original_content: string;      // HTML format - THE MAIN CONTENT

  last_viewed_at: string;
  content_updated_at: string;

  suggested_questions: any | null;
  generated_lines: GeneratedLine[];
}

interface GeneratedLine {
  text: string;
  matches: boolean;
}
```

### ProseMirror Document Format

```typescript
interface ProseMirrorDoc {
  type: 'doc';
  content: ProseMirrorNode[];
}

interface ProseMirrorNode {
  type: 'heading' | 'paragraph' | 'bulletList' | 'listItem' | 'text' | 'hardBreak';
  attrs?: {
    level?: number;  // For headings: 1, 2, 3
  };
  content?: ProseMirrorNode[];
  text?: string;
  marks?: { type: string; attrs?: any }[];
}
```

### Converting ProseMirror to Markdown

```typescript
function proseMirrorToMarkdown(doc: ProseMirrorDoc): string {
  if (!doc || !doc.content) return '';

  return doc.content.map(node => nodeToMarkdown(node)).join('\n\n');
}

function nodeToMarkdown(node: ProseMirrorNode): string {
  switch (node.type) {
    case 'heading':
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${extractText(node)}`;

    case 'paragraph':
      return extractText(node);

    case 'bulletList':
      return node.content?.map(item =>
        `- ${extractText(item)}`
      ).join('\n') || '';

    case 'listItem':
      return extractText(node);

    case 'text':
      return node.text || '';

    default:
      return extractText(node);
  }
}

function extractText(node: ProseMirrorNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(extractText).join('');
}
```

## Implementation Steps

### 1. Create Granola Service Module

```typescript
// src/lib/granola/client.ts
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { gunzipSync } from 'zlib';

const GRANOLA_API_BASE = 'https://api.granola.ai';
const USER_AGENT = 'Granola/5.354.0';
const CLIENT_VERSION = '5.354.0';

interface GranolaClientConfig {
  accessToken: string;
}

export class GranolaClient {
  private accessToken: string;

  constructor(config: GranolaClientConfig) {
    this.accessToken = config.accessToken;
  }

  static async fromLocalCredentials(): Promise<GranolaClient> {
    const authPath = join(
      homedir(),
      'Library/Application Support/Granola/supabase.json'
    );

    const raw = await readFile(authPath, 'utf-8');
    const data = JSON.parse(raw);
    const tokens = JSON.parse(data.workos_tokens);

    // Validate token
    const expirationTime = tokens.obtained_at + (tokens.expires_in * 1000);
    if (Date.now() >= expirationTime - 300000) {
      throw new Error('Granola token expired. Please open Granola app to refresh.');
    }

    return new GranolaClient({ accessToken: tokens.access_token });
  }

  private async request<T>(
    endpoint: string,
    body?: object,
    method: string = 'POST'
  ): Promise<T> {
    const response = await fetch(`${GRANOLA_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        'X-Client-Version': CLIENT_VERSION,
        'Accept-Encoding': 'gzip',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Granola API error: ${response.status} ${response.statusText}`);
    }

    // Handle gzip response
    const buffer = await response.arrayBuffer();
    let text: string;

    try {
      text = gunzipSync(Buffer.from(buffer)).toString('utf-8');
    } catch {
      text = new TextDecoder().decode(buffer);
    }

    return JSON.parse(text);
  }

  async getDocuments(options: {
    limit?: number;
    offset?: number;
    includeContent?: boolean;
  } = {}): Promise<GetDocumentsResponse> {
    return this.request('/v2/get-documents', {
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
      include_last_viewed_panel: options.includeContent ?? true,
    });
  }

  async getAllDocuments(includeContent: boolean = true): Promise<GranolaDocument[]> {
    const allDocs: GranolaDocument[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getDocuments({ limit, offset, includeContent });
      allDocs.push(...response.docs);

      if (response.docs.length < limit) {
        break;
      }

      offset += limit;
    }

    return allDocs;
  }
}
```

### 2. Create Sync Service

```typescript
// src/lib/granola/sync.ts
import { createClient } from '@/lib/supabase/server';
import { GranolaClient } from './client';
import { proseMirrorToMarkdown } from './prosemirror';

interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

export async function syncGranolaNotes(userId: string): Promise<SyncResult> {
  const supabase = await createClient();
  const granola = await GranolaClient.fromLocalCredentials();

  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };

  // Get all Granola documents
  const documents = await granola.getAllDocuments(true);

  for (const doc of documents) {
    try {
      // Check if already synced
      const { data: existing } = await supabase
        .from('meeting_notes')
        .select('id, granola_updated_at')
        .eq('granola_id', doc.id)
        .single();

      if (existing) {
        // Check if updated
        if (existing.granola_updated_at === doc.updated_at) {
          result.skipped++;
          continue;
        }
      }

      // Extract content
      const content = extractContent(doc);

      // Upsert to database
      const { error } = await supabase
        .from('meeting_notes')
        .upsert({
          granola_id: doc.id,
          user_id: userId,
          title: doc.title,
          content_html: content.html,
          content_markdown: content.markdown,
          content_plain: content.plain,
          meeting_date: doc.created_at,
          attendees: doc.people?.attendees || [],
          granola_updated_at: doc.updated_at,
          synced_at: new Date().toISOString(),
        }, {
          onConflict: 'granola_id',
        });

      if (error) {
        result.errors.push(`Failed to sync ${doc.title}: ${error.message}`);
      } else {
        result.synced++;
      }
    } catch (err) {
      result.errors.push(`Error processing ${doc.title}: ${err}`);
    }
  }

  return result;
}

function extractContent(doc: GranolaDocument): {
  html: string;
  markdown: string;
  plain: string;
} {
  const panel = doc.last_viewed_panel;

  if (!panel) {
    return {
      html: '',
      markdown: proseMirrorToMarkdown(doc.notes),
      plain: doc.notes_plain || '',
    };
  }

  return {
    html: panel.original_content || '',
    markdown: proseMirrorToMarkdown(panel.content),
    plain: extractText(panel.content),
  };
}

function extractText(doc: ProseMirrorDoc): string {
  if (!doc || !doc.content) return '';

  const texts: string[] = [];

  function walk(node: ProseMirrorNode) {
    if (node.text) texts.push(node.text);
    node.content?.forEach(walk);
  }

  doc.content.forEach(walk);
  return texts.join(' ');
}
```

### 3. Database Schema for Meeting Notes Sync

```sql
-- Migration: Add Granola sync tracking
ALTER TABLE meeting_notes ADD COLUMN IF NOT EXISTS granola_id UUID UNIQUE;
ALTER TABLE meeting_notes ADD COLUMN IF NOT EXISTS granola_updated_at TIMESTAMPTZ;
ALTER TABLE meeting_notes ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE meeting_notes ADD COLUMN IF NOT EXISTS content_html TEXT;
ALTER TABLE meeting_notes ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]';

-- Create index for efficient sync checks
CREATE INDEX IF NOT EXISTS idx_meeting_notes_granola_id
  ON meeting_notes(granola_id)
  WHERE granola_id IS NOT NULL;
```

### 4. API Route for Manual Sync

```typescript
// src/app/api/granola/sync/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncGranolaNotes } from '@/lib/granola/sync';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncGranolaNotes(user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
```

### 5. Scheduled Sync (Optional - using cron)

```typescript
// scripts/sync-granola.ts
import { GranolaClient } from '../src/lib/granola/client';

async function main() {
  try {
    const client = await GranolaClient.fromLocalCredentials();
    const documents = await client.getAllDocuments();

    console.log(`Found ${documents.length} documents`);

    // Process and sync...
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
```

## Risks and Considerations

### 1. Token Expiration

**Risk:** WorkOS tokens expire after ~6 hours (21,599 seconds).

**Mitigation:**
- Check token expiration before API calls
- Prompt user to open Granola app if token expired (app auto-refreshes)
- The `refresh_token` exists but the refresh endpoint is not documented

**Implementation:**
```typescript
function isTokenExpired(tokens: WorkOSTokens): boolean {
  const expirationTime = tokens.obtained_at + (tokens.expires_in * 1000);
  return Date.now() >= expirationTime - 300000; // 5 min buffer
}
```

### 2. No Official Token Refresh API

**Issue:** While a `refresh_token` exists, the refresh endpoint is not publicly known.

**Workaround:**
- The Granola desktop app refreshes tokens automatically when running
- Sync should be designed to work when the app is open/recently used
- Consider displaying a "Please open Granola to refresh authentication" message

### 3. Rate Limiting

**Risk:** Unknown rate limits on the API.

**Mitigation:**
- Implement exponential backoff on 429 responses
- Cache results locally
- Only sync changes (use `updated_at` comparison)
- Limit sync frequency (e.g., every 15 minutes max)

### 4. Terms of Service

**Risk:** Using undocumented APIs may violate ToS.

**Considerations:**
- This is for personal/internal use only
- No redistribution of Granola data
- Respects user's own data ownership
- Could break at any time with API changes

### 5. Data Structure Changes

**Risk:** Granola may change their API or data formats without notice.

**Mitigation:**
- Use defensive parsing with fallbacks
- Log and handle unknown fields gracefully
- Version your sync code to track changes
- Monitor for API errors and adjust

### 6. Local File Access

**Risk:** Requires filesystem access to read credentials.

**Considerations:**
- Only works on the same machine as Granola app
- Not suitable for server-side deployment without credential transfer
- macOS specific path (`~/Library/Application Support/Granola/`)
- Windows path would be different: `%APPDATA%\Granola\`

## Alternative: Local Cache Reading

Instead of hitting the API, you can read directly from the local cache:

```typescript
// src/lib/granola/local-cache.ts
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

interface GranolaCache {
  documents: Record<string, GranolaDocument>;
  documentPanels: Record<string, Record<string, DocumentPanel>>;
  transcripts: Record<string, TranscriptEntry[]>;
}

interface TranscriptEntry {
  document_id: string;
  start_timestamp: number;
  end_timestamp: number;
  text: string;
  source: string;
  id: string;
  is_final: boolean;
}

export async function readLocalCache(): Promise<GranolaCache> {
  const cachePath = join(
    homedir(),
    'Library/Application Support/Granola/cache-v3.json'
  );

  const raw = await readFile(cachePath, 'utf-8');
  const data = JSON.parse(raw);
  const cache = JSON.parse(data.cache);

  return {
    documents: cache.state.documents,
    documentPanels: cache.state.documentPanels,
    transcripts: cache.state.transcripts,
  };
}
```

**Advantages:**
- No API calls needed
- No token expiration issues
- Includes full transcripts (when available)
- Faster for bulk reads

**Disadvantages:**
- Cache may not be fully up to date
- Requires Granola app to have synced recently
- Larger file to parse (~4MB)

## Summary

### Recommended Implementation Order

1. **Phase 1: Read-only sync via API**
   - Implement `GranolaClient` with token reading
   - Create basic document fetching
   - Store in database with deduplication

2. **Phase 2: Local cache fallback**
   - Add local cache reading for offline/expired token scenarios
   - Merge with API data

3. **Phase 3: Automatic sync**
   - File watcher on `supabase.json` for token refresh detection
   - Periodic sync when app is detected as running

4. **Phase 4: UI integration**
   - Sync button in UI
   - Status indicators
   - Error handling and user feedback

### Key Files to Create

```
src/lib/granola/
  client.ts          # API client
  sync.ts            # Sync logic
  local-cache.ts     # Local cache reader
  prosemirror.ts     # Content conversion
  types.ts           # TypeScript interfaces
```

### Environment Variables (Optional)

```env
# Override Granola auth path (for testing)
GRANOLA_AUTH_PATH=/custom/path/to/supabase.json

# Disable Granola sync
GRANOLA_SYNC_ENABLED=false
```
