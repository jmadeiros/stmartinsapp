/**
 * Granola Local Cache Reader
 *
 * Provides fallback functionality when the API token is expired by reading
 * directly from Granola's local cache file. This allows offline access to
 * meeting notes that have been synced to the local machine.
 *
 * @module granola/local-cache
 */

import { readFile, stat } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import type {
  GranolaCache,
  GranolaDocument,
  DocumentPanel,
  TranscriptEntry,
} from './types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Path to Granola's local cache file (macOS).
 */
const CACHE_PATH = join(
  homedir(),
  'Library/Application Support/Granola/cache-v3.json'
);

// =============================================================================
// Error Classes
// =============================================================================

/**
 * Error thrown when the local cache file is not found.
 */
export class CacheNotFoundError extends Error {
  constructor(path: string) {
    super(`Granola cache file not found at: ${path}`);
    this.name = 'CacheNotFoundError';
  }
}

/**
 * Error thrown when the cache file contains invalid or corrupted data.
 */
export class CacheCorruptedError extends Error {
  constructor(reason: string) {
    super(`Granola cache file is corrupted: ${reason}`);
    this.name = 'CacheCorruptedError';
  }
}

// =============================================================================
// Cache Reading Functions
// =============================================================================

/**
 * Reads and parses Granola's local cache file.
 *
 * The cache file has a nested structure where the main content is stored
 * as a JSON string inside the `cache` property:
 * ```json
 * { "cache": "{\"state\": {\"documents\": {...}, ...}}" }
 * ```
 *
 * @returns The parsed cache containing documents, panels, and transcripts
 * @throws {CacheNotFoundError} If the cache file doesn't exist
 * @throws {CacheCorruptedError} If the cache file is malformed or corrupted
 *
 * @example
 * ```typescript
 * try {
 *   const cache = await readLocalCache();
 *   console.log(`Found ${Object.keys(cache.documents).length} documents`);
 * } catch (error) {
 *   if (error instanceof CacheNotFoundError) {
 *     console.log('Granola is not installed or has not synced');
 *   }
 * }
 * ```
 */
export async function readLocalCache(): Promise<GranolaCache> {
  let raw: string;

  try {
    raw = await readFile(CACHE_PATH, 'utf-8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new CacheNotFoundError(CACHE_PATH);
    }
    throw error;
  }

  // Parse the outer JSON structure
  let outerData: { cache?: string };
  try {
    outerData = JSON.parse(raw);
  } catch (error) {
    throw new CacheCorruptedError('Failed to parse outer JSON structure');
  }

  if (!outerData.cache || typeof outerData.cache !== 'string') {
    throw new CacheCorruptedError('Missing or invalid "cache" property');
  }

  // Parse the inner JSON (the stringified cache state)
  let innerData: {
    state?: {
      documents?: Record<string, GranolaDocument>;
      documentPanels?: Record<string, Record<string, DocumentPanel>>;
      transcripts?: Record<string, TranscriptEntry[]>;
    };
  };

  try {
    innerData = JSON.parse(outerData.cache);
  } catch (error) {
    throw new CacheCorruptedError('Failed to parse inner cache JSON');
  }

  if (!innerData.state) {
    throw new CacheCorruptedError('Missing "state" property in cache');
  }

  return {
    documents: innerData.state.documents ?? {},
    documentPanels: innerData.state.documentPanels ?? {},
    transcripts: innerData.state.transcripts ?? {},
  };
}

/**
 * Gets all documents from the local cache with panel content merged in.
 *
 * This function reads the cache and enriches each document with its
 * associated panel content (typically the AI-generated summary).
 *
 * @returns Array of GranolaDocument objects with panel content attached
 * @throws {CacheNotFoundError} If the cache file doesn't exist
 * @throws {CacheCorruptedError} If the cache file is malformed
 *
 * @example
 * ```typescript
 * const documents = await getDocumentsFromCache();
 *
 * for (const doc of documents) {
 *   console.log(`${doc.title} - ${doc.created_at}`);
 *   if (doc.last_viewed_panel) {
 *     console.log(`  Summary: ${doc.last_viewed_panel.original_content.substring(0, 100)}...`);
 *   }
 * }
 * ```
 */
export async function getDocumentsFromCache(): Promise<GranolaDocument[]> {
  const cache = await readLocalCache();
  const documents: GranolaDocument[] = [];

  for (const [docId, doc] of Object.entries(cache.documents)) {
    // Skip deleted documents
    if (doc.deleted_at) {
      continue;
    }

    // Create a copy of the document to avoid mutating the cache
    const enrichedDoc: GranolaDocument = { ...doc };

    // Merge in panel content if available
    const docPanels = cache.documentPanels[docId];
    if (docPanels) {
      // Find the most recently viewed panel (usually the main summary)
      const panels = Object.values(docPanels).filter((p) => !p.deleted_at);

      if (panels.length > 0) {
        // Sort by last_viewed_at descending to get most recent
        panels.sort((a, b) => {
          const dateA = new Date(a.last_viewed_at).getTime();
          const dateB = new Date(b.last_viewed_at).getTime();
          return dateB - dateA;
        });

        enrichedDoc.last_viewed_panel = panels[0];
      }
    }

    documents.push(enrichedDoc);
  }

  // Sort by created_at descending (most recent first)
  documents.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  return documents;
}

/**
 * Gets the modification timestamp of the cache file.
 *
 * This is useful for determining how fresh the cached data is.
 * If Granola hasn't synced recently, the cache may be stale.
 *
 * @returns Date object representing when the cache was last modified
 * @throws {CacheNotFoundError} If the cache file doesn't exist
 *
 * @example
 * ```typescript
 * const timestamp = await getCacheTimestamp();
 * const ageMinutes = (Date.now() - timestamp.getTime()) / 1000 / 60;
 *
 * if (ageMinutes > 60) {
 *   console.log('Cache is over an hour old. Consider opening Granola to sync.');
 * }
 * ```
 */
export async function getCacheTimestamp(): Promise<Date> {
  try {
    const stats = await stat(CACHE_PATH);
    return stats.mtime;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new CacheNotFoundError(CACHE_PATH);
    }
    throw error;
  }
}

/**
 * Gets transcripts for a specific document from the cache.
 *
 * Transcripts are only available in the local cache, not through the API.
 *
 * @param documentId - The UUID of the document to get transcripts for
 * @returns Array of transcript entries, or empty array if none exist
 * @throws {CacheNotFoundError} If the cache file doesn't exist
 * @throws {CacheCorruptedError} If the cache file is malformed
 *
 * @example
 * ```typescript
 * const transcripts = await getTranscriptsFromCache('doc-uuid-here');
 *
 * for (const entry of transcripts) {
 *   const timestamp = formatTimestamp(entry.start_timestamp);
 *   console.log(`[${timestamp}] ${entry.source}: ${entry.text}`);
 * }
 * ```
 */
export async function getTranscriptsFromCache(
  documentId: string
): Promise<TranscriptEntry[]> {
  const cache = await readLocalCache();
  return cache.transcripts[documentId] ?? [];
}

/**
 * Checks if the local cache file exists and is readable.
 *
 * Use this to determine if the fallback to local cache is available
 * before attempting to read it.
 *
 * @returns True if the cache exists and is accessible
 *
 * @example
 * ```typescript
 * if (await isCacheAvailable()) {
 *   const docs = await getDocumentsFromCache();
 * } else {
 *   console.log('Local cache not available, trying API...');
 * }
 * ```
 */
export async function isCacheAvailable(): Promise<boolean> {
  try {
    await stat(CACHE_PATH);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets cache freshness information.
 *
 * Returns details about when the cache was last modified and
 * how many documents it contains.
 *
 * @returns Object with cache metadata, or null if cache unavailable
 *
 * @example
 * ```typescript
 * const info = await getCacheInfo();
 * if (info) {
 *   console.log(`Cache has ${info.documentCount} documents`);
 *   console.log(`Last modified: ${info.lastModified.toISOString()}`);
 *   console.log(`Age: ${Math.round(info.ageMinutes)} minutes`);
 * }
 * ```
 */
export async function getCacheInfo(): Promise<{
  lastModified: Date;
  documentCount: number;
  panelCount: number;
  transcriptCount: number;
  ageMinutes: number;
  isStale: boolean;
} | null> {
  try {
    const [timestamp, cache] = await Promise.all([
      getCacheTimestamp(),
      readLocalCache(),
    ]);

    const ageMinutes = (Date.now() - timestamp.getTime()) / 1000 / 60;

    return {
      lastModified: timestamp,
      documentCount: Object.keys(cache.documents).length,
      panelCount: Object.values(cache.documentPanels).reduce(
        (sum, panels) => sum + Object.keys(panels).length,
        0
      ),
      transcriptCount: Object.keys(cache.transcripts).length,
      ageMinutes,
      // Consider cache stale if older than 1 hour
      isStale: ageMinutes > 60,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Type guard to check if an error is a Node.js error with a code property.
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

/**
 * Gets the path to the cache file.
 * Exported for debugging/logging purposes.
 */
export function getCachePath(): string {
  return CACHE_PATH;
}
