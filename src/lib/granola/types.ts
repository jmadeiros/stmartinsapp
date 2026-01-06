/**
 * Granola API TypeScript Types
 *
 * Type definitions for integrating with the Granola meeting notes API.
 * Based on the reverse-engineered API documented in GRANOLA_API_IMPLEMENTATION.md
 *
 * @module granola/types
 */

// =============================================================================
// Authentication Types
// =============================================================================

/**
 * WorkOS authentication tokens retrieved from Granola's local storage.
 * These tokens are used to authenticate API requests to the Granola API.
 *
 * @remarks
 * Tokens are stored in `~/Library/Application Support/Granola/supabase.json`
 * and expire after approximately 6 hours (21,599 seconds).
 *
 * @example
 * ```typescript
 * const tokens: WorkOSTokens = JSON.parse(authData.workos_tokens);
 * const isValid = Date.now() < tokens.obtained_at + (tokens.expires_in * 1000);
 * ```
 */
export interface WorkOSTokens {
  /**
   * JWT access token for authenticating API requests.
   * Include in the Authorization header as `Bearer ${access_token}`.
   */
  access_token: string;

  /**
   * Token used to refresh the access token when it expires.
   * Note: The refresh endpoint is not publicly documented.
   */
  refresh_token: string;

  /**
   * Token lifetime in seconds.
   * Typically 21,599 seconds (approximately 6 hours).
   */
  expires_in: number;

  /**
   * The type of token.
   * Always "Bearer" for WorkOS tokens.
   */
  token_type: 'Bearer' | string;

  /**
   * Unix timestamp in milliseconds when the token was obtained.
   * Used to calculate token expiration: `obtained_at + (expires_in * 1000)`.
   */
  obtained_at: number;

  /**
   * WorkOS session identifier.
   * @example "session_01K82Z9BGCP6JD43A3YP5N15NE"
   */
  session_id: string;

  /**
   * User's external identifier in UUID format.
   */
  external_id: string;

  /**
   * The method used to sign in to Granola.
   * @example "GoogleOAuth"
   */
  sign_in_method: string;
}

/**
 * Full authentication data structure stored in Granola's supabase.json file.
 * Located at `~/Library/Application Support/Granola/supabase.json`
 *
 * @remarks
 * The `workos_tokens` field contains the primary tokens for API access.
 * Parse with `JSON.parse()` to extract the actual token values.
 */
export interface GranolaAuth {
  /**
   * JSON string containing WorkOS tokens.
   * Must be parsed with `JSON.parse()` to get `WorkOSTokens`.
   */
  workos_tokens: string;

  /**
   * JSON string containing legacy Cognito tokens (backup/legacy authentication).
   */
  cognito_tokens: string;

  /**
   * JSON string containing user information (email, name, etc.).
   */
  user_info: string;

  /**
   * Current session identifier.
   */
  session_id: string;
}

// =============================================================================
// ProseMirror Document Types
// =============================================================================

/**
 * ProseMirror document node types supported by Granola.
 */
export type ProseMirrorNodeType =
  | 'doc'
  | 'heading'
  | 'paragraph'
  | 'bulletList'
  | 'orderedList'
  | 'listItem'
  | 'text'
  | 'hardBreak'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | string; // Allow for unknown/future node types

/**
 * Mark types that can be applied to text nodes in ProseMirror.
 */
export type ProseMirrorMarkType =
  | 'bold'
  | 'strong'
  | 'italic'
  | 'em'
  | 'code'
  | 'strike'
  | 'strikethrough'
  | 'link'
  | 'underline'
  | string; // Allow for unknown mark types

/**
 * Attributes that can be applied to text marks.
 *
 * @example
 * ```typescript
 * // Link mark attributes
 * const linkAttrs: ProseMirrorMarkAttrs = {
 *   href: 'https://example.com',
 *   title: 'Example Link'
 * };
 * ```
 */
export interface ProseMirrorMarkAttrs {
  /** URL for link marks */
  href?: string;
  /** Title/tooltip for link marks */
  title?: string;
  /** Allow additional custom attributes */
  [key: string]: unknown;
}

/**
 * Mark (formatting) applied to text nodes in ProseMirror.
 *
 * @remarks
 * Marks represent inline formatting like bold, italic, links, etc.
 * Multiple marks can be applied to the same text node.
 */
export interface ProseMirrorMark {
  /**
   * The type of mark (e.g., 'bold', 'italic', 'link', 'code').
   */
  type: ProseMirrorMarkType;

  /**
   * Optional attributes for the mark (e.g., href for links).
   */
  attrs?: ProseMirrorMarkAttrs;
}

/**
 * Attributes that can be applied to ProseMirror nodes.
 */
export interface ProseMirrorNodeAttrs {
  /**
   * Heading level (1-6) for heading nodes.
   */
  level?: number;

  /**
   * Starting number for ordered lists.
   */
  start?: number;

  /**
   * Language identifier for code blocks.
   */
  language?: string;

  /**
   * Additional custom attributes.
   */
  [key: string]: unknown;
}

/**
 * A single node in a ProseMirror document tree.
 *
 * @remarks
 * ProseMirror is a rich text editor framework. Granola uses it to store
 * both user notes and AI-generated content in a structured JSON format.
 *
 * @example
 * ```typescript
 * // A heading node
 * const heading: ProseMirrorNode = {
 *   type: 'heading',
 *   attrs: { level: 2 },
 *   content: [{ type: 'text', text: 'Meeting Summary' }]
 * };
 *
 * // A bullet list
 * const list: ProseMirrorNode = {
 *   type: 'bulletList',
 *   content: [
 *     {
 *       type: 'listItem',
 *       content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action item 1' }] }]
 *     }
 *   ]
 * };
 * ```
 */
export interface ProseMirrorNode {
  /**
   * The type of this node.
   */
  type: ProseMirrorNodeType;

  /**
   * Optional attributes for this node (e.g., heading level).
   */
  attrs?: ProseMirrorNodeAttrs;

  /**
   * Child nodes contained within this node.
   */
  content?: ProseMirrorNode[];

  /**
   * Text content for text nodes.
   */
  text?: string;

  /**
   * Marks (formatting) applied to this node.
   */
  marks?: ProseMirrorMark[];
}

/**
 * Root document node in ProseMirror format.
 *
 * @remarks
 * The top-level document always has type 'doc' and contains
 * an array of block-level nodes (paragraphs, headings, lists, etc.).
 *
 * @example
 * ```typescript
 * const doc: ProseMirrorDoc = {
 *   type: 'doc',
 *   content: [
 *     { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
 *     { type: 'paragraph', content: [{ type: 'text', text: 'Content here.' }] }
 *   ]
 * };
 * ```
 */
export interface ProseMirrorDoc {
  /**
   * Always 'doc' for the root document node.
   */
  type: 'doc';

  /**
   * Top-level content nodes (paragraphs, headings, lists, etc.).
   */
  content: ProseMirrorNode[];
}

// =============================================================================
// Meeting Attendee Types
// =============================================================================

/**
 * Response status for a meeting invitation.
 */
export type AttendeeResponseStatus =
  | 'needsAction'
  | 'declined'
  | 'tentative'
  | 'accepted';

/**
 * Information about a meeting attendee.
 *
 * @remarks
 * Attendees come from Google Calendar event data and include
 * response status and organizer information.
 */
export interface Attendee {
  /**
   * Attendee's email address.
   */
  email?: string;

  /**
   * Attendee's display name.
   */
  name?: string;

  /**
   * Whether this attendee is optional for the meeting.
   */
  optional?: boolean;

  /**
   * Attendee's response status to the meeting invitation.
   */
  response_status?: AttendeeResponseStatus;

  /**
   * Alternative casing for response status (from some API responses).
   */
  responseStatus?: AttendeeResponseStatus;

  /**
   * Whether this attendee is the meeting organizer.
   */
  organizer?: boolean;

  /**
   * Whether this attendee represents the current user.
   */
  self?: boolean;

  /**
   * Display name (alternative field from some responses).
   */
  displayName?: string;
}

/**
 * People information associated with a Granola document.
 *
 * @remarks
 * Contains the meeting creator and all attendees extracted
 * from the calendar event.
 */
export interface DocumentPeople {
  /**
   * The meeting title (may differ from document title).
   */
  title: string;

  /**
   * The creator/organizer of the meeting.
   */
  creator: Attendee;

  /**
   * List of all meeting attendees.
   */
  attendees: Attendee[];

  /**
   * ISO 8601 timestamp when this people data was created.
   */
  created_at: string;

  /**
   * Visibility setting for sharing links.
   */
  sharing_link_visibility: string;
}

// =============================================================================
// Google Calendar Types
// =============================================================================

/**
 * Time specification for calendar events.
 */
export interface CalendarEventTime {
  /**
   * ISO 8601 datetime string for timed events.
   * @example "2024-01-15T14:00:00-05:00"
   */
  dateTime?: string;

  /**
   * Timezone identifier.
   * @example "America/New_York"
   */
  timeZone?: string;

  /**
   * Date string for all-day events (YYYY-MM-DD format).
   * @example "2024-01-15"
   */
  date?: string;
}

/**
 * Conference entry point for video calls.
 */
export interface ConferenceEntryPoint {
  /**
   * Type of entry point.
   */
  entryPointType: 'video' | 'phone' | 'more' | 'sip';

  /**
   * URI to join the conference.
   */
  uri: string;

  /**
   * Human-readable label for the entry point.
   */
  label?: string;
}

/**
 * Conference solution details.
 */
export interface ConferenceSolution {
  /**
   * Name of the conference solution.
   * @example "Google Meet", "Zoom"
   */
  name: string;

  /**
   * URI to the solution's icon.
   */
  iconUri?: string;
}

/**
 * Conference data for video meetings.
 */
export interface ConferenceData {
  /**
   * Ways to join the conference.
   */
  entryPoints?: ConferenceEntryPoint[];

  /**
   * Information about the conference solution.
   */
  conferenceSolution?: ConferenceSolution;

  /**
   * Conference ID.
   */
  conferenceId?: string;
}

/**
 * Google Calendar event metadata associated with a Granola document.
 *
 * @remarks
 * This data is extracted from Google Calendar and includes
 * meeting details, attendees, and conference information.
 */
export interface GoogleCalendarEvent {
  /**
   * Unique identifier for the calendar event.
   */
  id: string;

  /**
   * The event summary/title.
   */
  summary: string;

  /**
   * Event description (may contain meeting agenda or details).
   */
  description?: string;

  /**
   * Event location (physical address or video call link).
   */
  location?: string;

  /**
   * Event start time information.
   */
  start: CalendarEventTime;

  /**
   * Event end time information.
   */
  end: CalendarEventTime;

  /**
   * List of event attendees.
   */
  attendees?: Attendee[];

  /**
   * Event organizer information.
   */
  organizer?: Attendee;

  /**
   * Google Meet link (if applicable).
   */
  hangoutLink?: string;

  /**
   * HTML link to view the event in Google Calendar.
   */
  htmlLink?: string;

  /**
   * Conference data (video call information).
   */
  conferenceData?: ConferenceData;

  /**
   * ISO 8601 timestamp when the event was created.
   */
  created?: string;

  /**
   * ISO 8601 timestamp when the event was last updated.
   */
  updated?: string;

  /**
   * Event status.
   */
  status?: 'confirmed' | 'tentative' | 'cancelled';

  /**
   * Recurrence rules for recurring events.
   */
  recurrence?: string[];

  /**
   * ID of the recurring event this instance belongs to.
   */
  recurringEventId?: string;

  /**
   * Calendar ID where this event exists.
   */
  calendarId?: string;

  /**
   * Event transparency (whether it blocks time).
   */
  transparency?: 'opaque' | 'transparent';
}

// =============================================================================
// Document Panel Types
// =============================================================================

/**
 * A line of AI-generated content with matching information.
 *
 * @remarks
 * Generated lines are used by Granola to track which parts
 * of the AI summary correspond to transcript content.
 */
export interface GeneratedLine {
  /**
   * The generated text content.
   */
  text: string;

  /**
   * Whether this line matches or is relevant to the transcript context.
   */
  matches: boolean;
}

/**
 * A content panel within a Granola document.
 *
 * @remarks
 * Panels contain the AI-generated summaries and processed content.
 * The `last_viewed_panel` is typically the main summary panel
 * and contains the most important meeting content.
 *
 * @example
 * ```typescript
 * // Access the main summary content
 * const panel = document.last_viewed_panel;
 * if (panel) {
 *   const htmlContent = panel.original_content;
 *   const prosemirrorContent = panel.content;
 * }
 * ```
 */
export interface DocumentPanel {
  /**
   * Unique identifier for this panel (UUID).
   */
  id: string;

  /**
   * Parent document's identifier (UUID).
   */
  document_id: string;

  /**
   * ISO 8601 timestamp when the panel was created.
   */
  created_at: string;

  /**
   * ISO 8601 timestamp when the panel was last updated.
   */
  updated_at: string;

  /**
   * ISO 8601 timestamp when the panel was deleted, or null if active.
   */
  deleted_at: string | null;

  /**
   * Panel title describing its content type.
   * @example "Summary", "Action Items", "Key Points"
   */
  title: string;

  /**
   * Template identifier used to generate this panel's content.
   * @example "v2:meeting-summary-consolidated"
   */
  template_slug: string;

  /**
   * Panel content in ProseMirror JSON format.
   * Can be converted to Markdown or plain text.
   */
  content: ProseMirrorDoc;

  /**
   * Original content in HTML format.
   * This is the primary rendered content and usually the most complete.
   */
  original_content: string;

  /**
   * ISO 8601 timestamp when the panel was last viewed.
   */
  last_viewed_at: string;

  /**
   * ISO 8601 timestamp when the content was last updated.
   */
  content_updated_at: string;

  /**
   * AI-suggested follow-up questions based on the meeting content.
   */
  suggested_questions: unknown | null;

  /**
   * Lines of AI-generated content with relevance matching.
   */
  generated_lines: GeneratedLine[];
}

// =============================================================================
// Granola Document Types
// =============================================================================

/**
 * Platform where the document was created.
 */
export type CreationSource = 'macOS' | 'iOS' | 'windows';

/**
 * Document type. Currently only 'meeting' is supported.
 */
export type DocumentType = 'meeting';

/**
 * Visibility options for sharing links.
 */
export type SharingLinkVisibility = 'public' | 'private';

/**
 * A complete Granola meeting document with all associated metadata.
 *
 * @remarks
 * This is the main data structure returned by the Granola API's
 * `/v2/get-documents` endpoint. It contains the meeting notes,
 * AI-generated summaries, attendee information, and calendar integration.
 *
 * @example
 * ```typescript
 * // Fetch and process documents
 * const response = await client.getDocuments({ limit: 50 });
 * for (const doc of response.docs) {
 *   console.log(`Meeting: ${doc.title}`);
 *   console.log(`Date: ${doc.created_at}`);
 *   console.log(`Attendees: ${doc.people?.attendees.length ?? 0}`);
 *
 *   if (doc.last_viewed_panel) {
 *     console.log(`Summary: ${doc.last_viewed_panel.original_content}`);
 *   }
 * }
 * ```
 */
export interface GranolaDocument {
  /**
   * Unique identifier for the document (UUID).
   */
  id: string;

  /**
   * ISO 8601 timestamp when the document was created.
   */
  created_at: string;

  /**
   * ISO 8601 timestamp when the document was last updated.
   * Used for sync comparison to detect changes.
   */
  updated_at: string;

  /**
   * ISO 8601 timestamp when the document was deleted, or null if active.
   */
  deleted_at: string | null;

  /**
   * Document title (usually the meeting title from calendar).
   */
  title: string;

  /**
   * Document type (currently always 'meeting').
   */
  type: DocumentType;

  /**
   * User identifier who owns this document (UUID).
   */
  user_id: string;

  /**
   * Workspace identifier this document belongs to (UUID).
   */
  workspace_id: string;

  /**
   * User's manual notes in ProseMirror format.
   */
  notes: ProseMirrorDoc;

  /**
   * Plain text version of user notes.
   * Often empty; prefer extracting from `notes` ProseMirror doc.
   */
  notes_plain: string;

  /**
   * Markdown version of user notes.
   * Often empty; prefer extracting from `notes` ProseMirror doc.
   */
  notes_markdown: string;

  /**
   * Associated Google Calendar event metadata.
   * Null if the meeting was not linked to a calendar event.
   */
  google_calendar_event: GoogleCalendarEvent | null;

  /**
   * Whether transcription was enabled for this meeting.
   */
  transcribe: boolean;

  /**
   * Whether this was detected as a valid meeting with actual content.
   */
  valid_meeting: boolean;

  /**
   * Count of meeting end events (for tracking multiple sessions).
   */
  meeting_end_count: number;

  /**
   * AI-generated brief overview of the meeting.
   */
  overview: string | null;

  /**
   * AI-generated detailed summary of the meeting.
   */
  summary: string | null;

  /**
   * AI-generated chapter/section breakdown of the meeting.
   */
  chapters: unknown | null;

  /**
   * Meeting participants information.
   * Null if no people information is available.
   */
  people: DocumentPeople | null;

  /**
   * Whether this document is publicly accessible.
   */
  public: boolean;

  /**
   * Whether a shareable link has been generated for this document.
   */
  has_shareable_link: boolean;

  /**
   * Visibility setting for the sharing link.
   */
  sharing_link_visibility: SharingLinkVisibility;

  /**
   * General visibility setting (may be null).
   */
  visibility: string | null;

  /**
   * File attachments associated with the document.
   */
  attachments: unknown[];

  /**
   * Template used to generate the meeting notes structure.
   */
  selected_template: string | null;

  /**
   * Subscription plan identifier for the user.
   */
  subscription_plan_id: string;

  /**
   * Platform where this document was created.
   */
  creation_source: CreationSource;

  /**
   * The main content panel containing AI-generated summary.
   * Only included when `include_last_viewed_panel: true` in the request.
   * This is where the primary meeting content lives.
   */
  last_viewed_panel?: DocumentPanel;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Request parameters for the `/v2/get-documents` endpoint.
 */
export interface GetDocumentsRequest {
  /**
   * Maximum number of documents to return.
   * Tested up to 200.
   * @default 100
   */
  limit: number;

  /**
   * Number of documents to skip for pagination.
   * @default 0
   */
  offset: number;

  /**
   * Whether to include the main content panel with each document.
   * Set to true to get full content including AI summaries.
   * @default true
   */
  include_last_viewed_panel: boolean;
}

/**
 * Response from the `/v2/get-documents` endpoint.
 *
 * @remarks
 * Contains both active documents and a list of deleted document IDs.
 * The `deleted` array is useful for sync operations to remove
 * documents that have been deleted in Granola.
 */
export interface GetDocumentsResponse {
  /**
   * Array of Granola documents matching the request.
   */
  docs: GranolaDocument[];

  /**
   * Array of document IDs that have been deleted.
   * Useful for sync operations to remove deleted documents locally.
   */
  deleted: string[];
}

/**
 * Options for fetching documents from the Granola API.
 */
export interface GetDocumentsOptions {
  /**
   * Maximum number of documents to retrieve.
   * @default 100
   */
  limit?: number;

  /**
   * Number of documents to skip (for pagination).
   * @default 0
   */
  offset?: number;

  /**
   * Whether to include full content panels.
   * @default true
   */
  includeContent?: boolean;
}

// =============================================================================
// Sync Types
// =============================================================================

/**
 * Result of a sync operation between Granola and the local database.
 *
 * @example
 * ```typescript
 * const result = await syncGranolaNotes(userId);
 * console.log(`Synced: ${result.synced}, Skipped: ${result.skipped}`);
 * if (result.errors.length > 0) {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export interface SyncResult {
  /**
   * Number of documents successfully synced (created or updated).
   */
  synced: number;

  /**
   * Number of documents skipped (already up to date).
   */
  skipped: number;

  /**
   * Array of error messages for failed sync operations.
   */
  errors: string[];
}

/**
 * Extended sync result with additional metadata.
 */
export interface DetailedSyncResult extends SyncResult {
  /**
   * Total number of documents found in Granola.
   */
  total_documents: number;

  /**
   * Number of new documents created during sync.
   */
  created: number;

  /**
   * Number of existing documents updated during sync.
   */
  updated: number;

  /**
   * Number of documents deleted during sync.
   */
  deleted: number;

  /**
   * ISO 8601 timestamp when the sync started.
   */
  started_at: string;

  /**
   * ISO 8601 timestamp when the sync completed.
   */
  completed_at: string;

  /**
   * Duration of the sync operation in milliseconds.
   */
  duration_ms: number;
}

// =============================================================================
// Local Cache Types
// =============================================================================

/**
 * A transcript entry from Granola's local cache.
 *
 * @remarks
 * Transcripts are only available in the local cache file
 * (`~/Library/Application Support/Granola/cache-v3.json`),
 * not through the API.
 */
export interface TranscriptEntry {
  /**
   * Document ID this transcript belongs to (UUID).
   */
  document_id: string;

  /**
   * Start timestamp in milliseconds from meeting start.
   */
  start_timestamp: number;

  /**
   * End timestamp in milliseconds from meeting start.
   */
  end_timestamp: number;

  /**
   * Transcribed text content.
   */
  text: string;

  /**
   * Source of the transcript (speaker identification).
   */
  source: string;

  /**
   * Unique identifier for this transcript entry.
   */
  id: string;

  /**
   * Whether this is a finalized transcript (vs. interim/partial result).
   */
  is_final: boolean;
}

/**
 * Structure of Granola's local cache file (cache-v3.json).
 *
 * @remarks
 * The local cache contains more data than the API, including
 * full transcripts. Located at:
 * `~/Library/Application Support/Granola/cache-v3.json`
 */
export interface GranolaCache {
  /**
   * Map of document IDs to document objects.
   */
  documents: Record<string, GranolaDocument>;

  /**
   * Map of document IDs to their panels (keyed by panel ID).
   */
  documentPanels: Record<string, Record<string, DocumentPanel>>;

  /**
   * Map of document IDs to their transcript entries.
   */
  transcripts: Record<string, TranscriptEntry[]>;
}

// =============================================================================
// Client Configuration Types
// =============================================================================

/**
 * Configuration options for the Granola API client.
 */
export interface GranolaClientConfig {
  /**
   * Access token for API authentication.
   */
  accessToken: string;

  /**
   * Optional custom API base URL.
   * @default "https://api.granola.ai"
   */
  baseUrl?: string;

  /**
   * Optional custom user agent string.
   * @default "Granola/5.354.0"
   */
  userAgent?: string;

  /**
   * Optional custom client version.
   * @default "5.354.0"
   */
  clientVersion?: string;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error thrown when Granola authentication fails or tokens are invalid.
 */
export interface GranolaAuthError {
  /**
   * Error type identifier.
   */
  type: 'auth_error';

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * Whether the token has expired.
   */
  tokenExpired: boolean;

  /**
   * Suggested action for the user to resolve the error.
   * @example "Please open Granola app to refresh authentication"
   */
  suggestedAction: string;
}

/**
 * Error thrown when a Granola API request fails.
 */
export interface GranolaApiError {
  /**
   * Error type identifier.
   */
  type: 'api_error';

  /**
   * HTTP status code from the API response.
   */
  statusCode: number;

  /**
   * HTTP status text from the API response.
   */
  statusText: string;

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * The API endpoint that failed.
   */
  endpoint: string;
}

/**
 * Union type of all Granola-related errors.
 */
export type GranolaError = GranolaAuthError | GranolaApiError;

// =============================================================================
// Extracted Content Types
// =============================================================================

/**
 * Content extracted and converted from a Granola document.
 *
 * @remarks
 * This type represents the processed content ready for storage
 * in the application database.
 */
export interface ExtractedContent {
  /**
   * Content in HTML format (from `original_content`).
   */
  html: string;

  /**
   * Content converted to Markdown format.
   */
  markdown: string;

  /**
   * Plain text content with formatting stripped.
   */
  plain: string;
}

/**
 * Meeting note data prepared for database storage.
 *
 * @remarks
 * This structure maps to the `meeting_notes` table schema
 * and includes all fields needed for upsert operations.
 */
export interface MeetingNoteData {
  /**
   * Granola document ID for deduplication.
   */
  granola_id: string;

  /**
   * User ID who owns this meeting note.
   */
  user_id: string;

  /**
   * Meeting title.
   */
  title: string;

  /**
   * HTML content of the meeting notes.
   */
  content_html: string;

  /**
   * Markdown content of the meeting notes.
   */
  content_markdown: string;

  /**
   * Plain text content of the meeting notes.
   */
  content_plain: string;

  /**
   * ISO 8601 timestamp of the meeting.
   */
  meeting_date: string;

  /**
   * List of meeting attendees.
   */
  attendees: Attendee[];

  /**
   * ISO 8601 timestamp when the Granola document was last updated.
   */
  granola_updated_at: string;

  /**
   * ISO 8601 timestamp when this record was synced.
   */
  synced_at: string;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if a node is a ProseMirror document.
 */
export function isProseMirrorDoc(node: unknown): node is ProseMirrorDoc {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    (node as ProseMirrorDoc).type === 'doc' &&
    'content' in node &&
    Array.isArray((node as ProseMirrorDoc).content)
  );
}

/**
 * Type guard to check if an error is a Granola auth error.
 */
export function isGranolaAuthError(error: unknown): error is GranolaAuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as GranolaAuthError).type === 'auth_error'
  );
}

/**
 * Type guard to check if an error is a Granola API error.
 */
export function isGranolaApiError(error: unknown): error is GranolaApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as GranolaApiError).type === 'api_error'
  );
}

/**
 * Type guard to check if a value is a GranolaError.
 */
export function isGranolaError(error: unknown): error is GranolaError {
  return isGranolaAuthError(error) || isGranolaApiError(error);
}
