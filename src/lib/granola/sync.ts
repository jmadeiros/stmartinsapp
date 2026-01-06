/**
 * Granola Sync Service
 *
 * Synchronizes meeting notes from Granola (API or local cache) to Supabase.
 * Extracts action items using OpenAI GPT and handles incremental syncs
 * based on document update timestamps.
 *
 * @module granola/sync
 */

import { createClient } from '@/lib/supabase/server';
import { GranolaClient, GranolaAuthError } from './client';
import { getDocumentsFromCache, isCacheAvailable } from './local-cache';
import { proseMirrorToMarkdown, extractPlainText } from './prosemirror';
import type {
  GranolaDocument,
  SyncResult,
  ExtractedContent,
  Attendee,
} from './types';

// =============================================================================
// Constants
// =============================================================================

/** OpenAI model for action item extraction (cost-effective since Granola already did heavy lifting) */
const OPENAI_MODEL = 'gpt-4o-mini';

/** System prompt for GPT action item extraction */
const ACTION_ITEM_EXTRACTION_PROMPT = `You are extracting action items from meeting notes. Analyze the content and output a JSON object with:
{
  "action_items": [
    {
      "title": "Action item title (brief, actionable)",
      "description": "Optional additional context or details",
      "assignee_name": "Person's name if mentioned, or null"
    }
  ]
}

Guidelines:
- Extract ALL action items, tasks, follow-ups, to-dos mentioned
- Look for phrases like "will", "needs to", "should", "action:", "TODO", "follow up"
- Include assignee names exactly as written if mentioned (e.g., "John will..." -> assignee_name: "John")
- Keep titles brief and actionable (start with verb when possible)
- If no clear action items are found, return an empty array
- Only include genuine action items, not general discussion points`;

// =============================================================================
// Types
// =============================================================================

interface ExtractedActionItem {
  title: string;
  description?: string | null;
  assignee_name?: string | null;
}

interface GPTActionItemsResponse {
  action_items: ExtractedActionItem[];
}

// =============================================================================
// Content Extraction
// =============================================================================

/**
 * Extracts content from a Granola document in multiple formats.
 *
 * Gets HTML from `last_viewed_panel.original_content`, converts to Markdown
 * using the ProseMirror converter, and extracts plain text.
 *
 * @param doc - The Granola document to extract content from
 * @returns Extracted content in HTML, Markdown, and plain text formats
 *
 * @example
 * ```typescript
 * const content = extractContentFromDocument(doc);
 * console.log(content.markdown); // Formatted markdown
 * console.log(content.plain);    // Plain text for analysis
 * ```
 */
export function extractContentFromDocument(doc: GranolaDocument): ExtractedContent {
  // Get HTML content from the panel
  const html = doc.last_viewed_panel?.original_content ?? '';

  // Convert ProseMirror content to Markdown if available
  let markdown = '';
  let plain = '';

  if (doc.last_viewed_panel?.content) {
    markdown = proseMirrorToMarkdown(doc.last_viewed_panel.content);
    plain = extractPlainText(doc.last_viewed_panel.content);
  }

  // Fallback: if ProseMirror conversion yielded nothing, use summary/overview
  if (!markdown && !plain) {
    markdown = doc.summary || doc.overview || '';
    plain = doc.summary || doc.overview || '';
  }

  // If still empty, strip HTML tags from original_content as fallback
  if (!plain && html) {
    plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return { html, markdown, plain };
}

// =============================================================================
// Action Item Extraction (OpenAI)
// =============================================================================

/**
 * Extracts action items from meeting note content using OpenAI GPT.
 *
 * @param content - Plain text content to analyze
 * @param title - Meeting title for context
 * @returns Array of extracted action items
 */
async function extractActionItemsWithGPT(
  content: string,
  title: string
): Promise<ExtractedActionItem[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.warn('[Granola Sync] OPENAI_API_KEY not set, skipping action item extraction');
    return [];
  }

  if (!content || content.length < 50) {
    // Content too short to meaningfully extract action items
    return [];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: ACTION_ITEM_EXTRACTION_PROMPT },
          {
            role: 'user',
            content: `Meeting Title: ${title}\n\nMeeting Notes:\n${content.substring(0, 8000)}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent extraction
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Granola Sync] OpenAI API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    const messageContent = data.choices?.[0]?.message?.content;

    if (!messageContent) {
      console.warn('[Granola Sync] No content in OpenAI response');
      return [];
    }

    const parsed: GPTActionItemsResponse = JSON.parse(messageContent);
    return parsed.action_items || [];
  } catch (error) {
    console.error('[Granola Sync] Error extracting action items:', error);
    return [];
  }
}

// =============================================================================
// Document Sync
// =============================================================================

/**
 * Syncs a single Granola document to Supabase.
 *
 * @param doc - The Granola document to sync
 * @param orgId - Organization ID to associate with the note
 * @param userId - Optional user ID to set as author
 * @returns Object with sync status and any error
 */
async function syncSingleDocument(
  doc: GranolaDocument,
  orgId: string,
  userId?: string
): Promise<{ synced: boolean; skipped: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Check if document already exists by granola_id
    const { data: existing, error: fetchError } = await (supabase
      .from('meeting_notes') as any)
      .select('id, granola_updated_at')
      .eq('granola_id', doc.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected for new docs)
      throw new Error(`Error checking existing note: ${fetchError.message}`);
    }

    // Skip if document hasn't changed
    if (existing) {
      const existingUpdatedAt = existing.granola_updated_at;
      if (existingUpdatedAt && existingUpdatedAt === doc.updated_at) {
        return { synced: false, skipped: true };
      }
    }

    // Extract content
    const content = extractContentFromDocument(doc);

    // Prepare attendees data
    const attendees: Attendee[] = doc.people?.attendees ?? [];

    // Determine meeting date
    let meetingDate: string | null = null;
    if (doc.google_calendar_event?.start?.dateTime) {
      meetingDate = doc.google_calendar_event.start.dateTime;
    } else if (doc.google_calendar_event?.start?.date) {
      meetingDate = doc.google_calendar_event.start.date;
    } else {
      meetingDate = doc.created_at;
    }

    // Prepare note data for upsert
    const noteData: Record<string, any> = {
      granola_id: doc.id,
      title: doc.title || 'Untitled Meeting',
      content: content.markdown || content.plain || null,
      content_html: content.html || null,
      meeting_date: meetingDate ? meetingDate.split('T')[0] : null,
      attendees: JSON.stringify(attendees),
      granola_updated_at: doc.updated_at,
      synced_at: new Date().toISOString(),
      status: 'published',
      org_id: orgId,
    };

    // Set author_id if provided
    if (userId) {
      noteData.author_id = userId;
    }

    let noteId: string;

    if (existing) {
      // Update existing note
      const { error: updateError } = await (supabase
        .from('meeting_notes') as any)
        .update(noteData)
        .eq('id', existing.id);

      if (updateError) {
        throw new Error(`Error updating note: ${updateError.message}`);
      }

      noteId = existing.id;
      console.log(`[Granola Sync] Updated meeting note: ${doc.title} (${noteId})`);
    } else {
      // Insert new note
      const { data: newNote, error: insertError } = await (supabase
        .from('meeting_notes') as any)
        .insert(noteData)
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Error inserting note: ${insertError.message}`);
      }

      noteId = newNote.id;
      console.log(`[Granola Sync] Created meeting note: ${doc.title} (${noteId})`);

      // Extract and create action items for new notes only
      const actionItems = await extractActionItemsWithGPT(
        content.plain || content.markdown,
        doc.title
      );

      if (actionItems.length > 0) {
        const actionItemsData = actionItems.map((item) => ({
          note_id: noteId,
          title: item.title,
          description: item.description || null,
          status: 'open',
        }));

        const { error: actionError } = await (supabase
          .from('action_items') as any)
          .insert(actionItemsData);

        if (actionError) {
          console.warn(
            `[Granola Sync] Error creating action items for ${doc.title}:`,
            actionError.message
          );
        } else {
          console.log(
            `[Granola Sync] Created ${actionItems.length} action items for ${doc.title}`
          );
        }
      }
    }

    return { synced: true, skipped: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Granola Sync] Error syncing document ${doc.id}:`, errorMessage);
    return { synced: false, skipped: false, error: errorMessage };
  }
}

// =============================================================================
// Main Sync Function
// =============================================================================

/**
 * Synchronizes Granola meeting notes to the Supabase database.
 *
 * This function attempts to fetch documents from the Granola API first.
 * If the API token is expired, it falls back to reading from the local
 * Granola cache file. For each document, it:
 *
 * 1. Checks if the document already exists (by granola_id)
 * 2. Skips if granola_updated_at matches (no changes)
 * 3. Extracts content using the ProseMirror converter
 * 4. Upserts to the meeting_notes table
 * 5. Extracts action items using GPT (for new documents)
 *
 * @param orgId - Organization ID to associate with synced notes
 * @param userId - Optional user ID to set as author for all notes
 * @returns SyncResult with counts and any errors
 *
 * @example
 * ```typescript
 * // Sync all Granola notes to a specific org
 * const result = await syncGranolaNotes('org-uuid-here');
 * console.log(`Synced: ${result.synced}, Skipped: ${result.skipped}`);
 *
 * if (result.errors.length > 0) {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export async function syncGranolaNotes(
  orgId: string,
  userId?: string
): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    skipped: 0,
    errors: [],
  };

  let documents: GranolaDocument[];

  // Try API first, fall back to local cache
  try {
    console.log('[Granola Sync] Attempting to fetch from Granola API...');
    const client = await GranolaClient.fromLocalCredentials();
    documents = await client.getAllDocuments(true);
    console.log(`[Granola Sync] Fetched ${documents.length} documents from API`);
  } catch (error) {
    if (error instanceof GranolaAuthError && error.tokenExpired) {
      console.log('[Granola Sync] Token expired, falling back to local cache...');

      if (!(await isCacheAvailable())) {
        result.errors.push(
          'Granola API token expired and local cache not available. Please open Granola to refresh.'
        );
        return result;
      }

      try {
        documents = await getDocumentsFromCache();
        console.log(`[Granola Sync] Loaded ${documents.length} documents from cache`);
      } catch (cacheError) {
        const errorMessage =
          cacheError instanceof Error ? cacheError.message : String(cacheError);
        result.errors.push(`Failed to read local cache: ${errorMessage}`);
        return result;
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Failed to fetch from Granola: ${errorMessage}`);
      return result;
    }
  }

  // Filter out deleted documents
  documents = documents.filter((doc) => !doc.deleted_at);

  if (documents.length === 0) {
    console.log('[Granola Sync] No documents to sync');
    return result;
  }

  console.log(`[Granola Sync] Processing ${documents.length} documents...`);

  // Process documents one at a time to avoid overwhelming the database
  for (const doc of documents) {
    const syncResult = await syncSingleDocument(doc, orgId, userId);

    if (syncResult.synced) {
      result.synced++;
    } else if (syncResult.skipped) {
      result.skipped++;
    }

    if (syncResult.error) {
      result.errors.push(`Document "${doc.title}": ${syncResult.error}`);
    }
  }

  console.log(
    `[Granola Sync] Complete. Synced: ${result.synced}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`
  );

  return result;
}

// =============================================================================
// Utility Exports
// =============================================================================

/**
 * Checks if Granola sync is available (either API or local cache).
 *
 * @returns true if documents can be fetched from either source
 */
export async function isGranolaSyncAvailable(): Promise<{
  available: boolean;
  source: 'api' | 'cache' | null;
  message: string;
}> {
  // Try API first
  try {
    const client = await GranolaClient.fromLocalCredentials();
    // Quick check - don't actually fetch all docs
    await client.getDocuments({ limit: 1, includeContent: false });
    return {
      available: true,
      source: 'api',
      message: 'Granola API is available',
    };
  } catch (error) {
    if (error instanceof GranolaAuthError && error.tokenExpired) {
      // Check cache availability
      if (await isCacheAvailable()) {
        return {
          available: true,
          source: 'cache',
          message: 'API token expired but local cache is available',
        };
      }
      return {
        available: false,
        source: null,
        message: 'API token expired and no local cache available. Please open Granola.',
      };
    }

    // Check if cache is available as fallback
    if (await isCacheAvailable()) {
      return {
        available: true,
        source: 'cache',
        message: 'API unavailable but local cache is available',
      };
    }

    return {
      available: false,
      source: null,
      message: error instanceof Error ? error.message : 'Granola is not available',
    };
  }
}
