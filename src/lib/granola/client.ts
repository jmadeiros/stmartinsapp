/**
 * Granola API Client
 *
 * A client for interacting with the Granola meeting notes API.
 * Supports authentication via local credentials and paginated document fetching.
 *
 * @module granola/client
 */

import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { gunzipSync } from 'zlib';

import type {
  GranolaAuth,
  GranolaClientConfig,
  GranolaDocument,
  GetDocumentsOptions,
  GetDocumentsResponse,
  WorkOSTokens,
} from './types';

// =============================================================================
// Constants
// =============================================================================

const GRANOLA_API_BASE = 'https://api.granola.ai';
const USER_AGENT = 'Granola/5.354.0';
const CLIENT_VERSION = '5.354.0';

/** Buffer time in milliseconds before token expiration to consider it expired (5 minutes) */
const TOKEN_EXPIRATION_BUFFER_MS = 300_000;

// =============================================================================
// Custom Error Classes
// =============================================================================

/**
 * Error thrown when Granola authentication fails or tokens are invalid/expired.
 */
export class GranolaAuthError extends Error {
  readonly type = 'auth_error' as const;
  readonly tokenExpired: boolean;
  readonly suggestedAction: string;

  constructor(message: string, tokenExpired: boolean = false) {
    super(message);
    this.name = 'GranolaAuthError';
    this.tokenExpired = tokenExpired;
    this.suggestedAction = tokenExpired
      ? 'Please open Granola app to refresh authentication'
      : 'Please ensure Granola is installed and you are logged in';
  }
}

/**
 * Error thrown when a Granola API request fails.
 */
export class GranolaApiError extends Error {
  readonly type = 'api_error' as const;
  readonly statusCode: number;
  readonly statusText: string;
  readonly endpoint: string;

  constructor(statusCode: number, statusText: string, endpoint: string) {
    super(`Granola API error: ${statusCode} ${statusText} at ${endpoint}`);
    this.name = 'GranolaApiError';
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.endpoint = endpoint;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the path to Granola's local credentials file.
 * @returns The absolute path to supabase.json
 */
function getGranolaAuthPath(): string {
  return join(homedir(), 'Library/Application Support/Granola/supabase.json');
}

/**
 * Checks if a WorkOS token is expired (with buffer time).
 * @param tokens - The WorkOS tokens to check
 * @returns true if the token is expired or about to expire
 */
function isTokenExpired(tokens: WorkOSTokens): boolean {
  const expirationTime = tokens.obtained_at + tokens.expires_in * 1000;
  return Date.now() >= expirationTime - TOKEN_EXPIRATION_BUFFER_MS;
}

/**
 * Formats token expiration information for error messages.
 * @param tokens - The WorkOS tokens
 * @returns A human-readable expiration status
 */
function getExpirationInfo(tokens: WorkOSTokens): string {
  const expirationTime = tokens.obtained_at + tokens.expires_in * 1000;
  const now = Date.now();
  const diffMs = expirationTime - now;

  if (diffMs <= 0) {
    const expiredAgo = Math.abs(diffMs);
    const minutes = Math.floor(expiredAgo / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `Token expired ${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    return `Token expired ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }

  const minutes = Math.floor(diffMs / 60000);
  return `Token expires in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

// =============================================================================
// Granola Client Class
// =============================================================================

/**
 * Client for interacting with the Granola API.
 *
 * @example
 * ```typescript
 * // Create client from local credentials
 * const client = await GranolaClient.fromLocalCredentials();
 *
 * // Fetch documents
 * const response = await client.getDocuments({ limit: 50 });
 * console.log(`Found ${response.docs.length} documents`);
 *
 * // Fetch all documents with pagination
 * const allDocs = await client.getAllDocuments();
 * ```
 */
export class GranolaClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly clientVersion: string;

  /**
   * Creates a new GranolaClient instance.
   * @param config - Client configuration including access token
   */
  constructor(config: GranolaClientConfig) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl ?? GRANOLA_API_BASE;
    this.userAgent = config.userAgent ?? USER_AGENT;
    this.clientVersion = config.clientVersion ?? CLIENT_VERSION;
  }

  /**
   * Creates a GranolaClient by reading credentials from the local Granola app.
   *
   * @remarks
   * Reads the WorkOS tokens from `~/Library/Application Support/Granola/supabase.json`.
   * Validates that the token is not expired before returning the client.
   *
   * @throws {GranolaAuthError} If credentials file is not found, malformed, or token is expired
   * @returns A new GranolaClient instance configured with local credentials
   *
   * @example
   * ```typescript
   * try {
   *   const client = await GranolaClient.fromLocalCredentials();
   *   // Use client...
   * } catch (error) {
   *   if (error instanceof GranolaAuthError && error.tokenExpired) {
   *     console.log(error.suggestedAction);
   *   }
   * }
   * ```
   */
  static async fromLocalCredentials(): Promise<GranolaClient> {
    const authPath = getGranolaAuthPath();

    let raw: string;
    try {
      raw = await readFile(authPath, 'utf-8');
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        throw new GranolaAuthError(
          `Granola credentials not found at ${authPath}. Is Granola installed and logged in?`,
          false
        );
      }
      throw new GranolaAuthError(
        `Failed to read Granola credentials: ${nodeError.message}`,
        false
      );
    }

    let authData: GranolaAuth;
    try {
      authData = JSON.parse(raw) as GranolaAuth;
    } catch {
      throw new GranolaAuthError(
        'Granola credentials file is malformed (invalid JSON)',
        false
      );
    }

    if (!authData.workos_tokens) {
      throw new GranolaAuthError(
        'Granola credentials file is missing workos_tokens',
        false
      );
    }

    let tokens: WorkOSTokens;
    try {
      tokens = JSON.parse(authData.workos_tokens) as WorkOSTokens;
    } catch {
      throw new GranolaAuthError(
        'Granola workos_tokens is malformed (invalid JSON)',
        false
      );
    }

    if (!tokens.access_token) {
      throw new GranolaAuthError(
        'Granola credentials are missing access_token',
        false
      );
    }

    // Validate token expiration
    if (isTokenExpired(tokens)) {
      const expirationInfo = getExpirationInfo(tokens);
      throw new GranolaAuthError(
        `Granola token has expired. ${expirationInfo}. Please open Granola app to refresh authentication.`,
        true
      );
    }

    return new GranolaClient({ accessToken: tokens.access_token });
  }

  /**
   * Makes an authenticated request to the Granola API.
   *
   * @param endpoint - API endpoint (e.g., '/v2/get-documents')
   * @param body - Request body to send as JSON
   * @param method - HTTP method (defaults to 'POST')
   * @returns Parsed JSON response
   * @throws {GranolaApiError} If the API returns a non-OK response
   * @throws {GranolaAuthError} If authentication fails (401/403)
   */
  private async request<T>(
    endpoint: string,
    body?: object,
    method: string = 'POST'
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
        'X-Client-Version': this.clientVersion,
        'Accept-Encoding': 'gzip',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      // Handle auth errors specifically
      if (response.status === 401 || response.status === 403) {
        throw new GranolaAuthError(
          `Authentication failed: ${response.status} ${response.statusText}`,
          response.status === 401
        );
      }

      throw new GranolaApiError(response.status, response.statusText, endpoint);
    }

    // Handle potentially gzipped response
    const buffer = await response.arrayBuffer();
    let text: string;

    try {
      // Try to decompress as gzip
      text = gunzipSync(Buffer.from(buffer)).toString('utf-8');
    } catch {
      // If decompression fails, assume it's plain text
      text = new TextDecoder().decode(buffer);
    }

    return JSON.parse(text) as T;
  }

  /**
   * Fetches documents from the Granola API with pagination support.
   *
   * @param options - Fetch options including limit, offset, and content inclusion
   * @returns Response containing documents and deleted document IDs
   * @throws {GranolaApiError} If the API request fails
   * @throws {GranolaAuthError} If authentication fails
   *
   * @example
   * ```typescript
   * // Fetch first 50 documents with full content
   * const response = await client.getDocuments({ limit: 50 });
   *
   * // Fetch next page
   * const nextPage = await client.getDocuments({ limit: 50, offset: 50 });
   *
   * // Fetch without panel content (faster, less data)
   * const lite = await client.getDocuments({ includeContent: false });
   * ```
   */
  async getDocuments(
    options: GetDocumentsOptions = {}
  ): Promise<GetDocumentsResponse> {
    const { limit = 100, offset = 0, includeContent = true } = options;

    return this.request<GetDocumentsResponse>('/v2/get-documents', {
      limit,
      offset,
      include_last_viewed_panel: includeContent,
    });
  }

  /**
   * Fetches all documents from the Granola API, handling pagination automatically.
   *
   * @remarks
   * This method repeatedly calls `getDocuments` until all documents are fetched.
   * For large document collections, this may take some time.
   *
   * @param includeContent - Whether to include full panel content (default: true)
   * @returns Array of all Granola documents
   * @throws {GranolaApiError} If any API request fails
   * @throws {GranolaAuthError} If authentication fails
   *
   * @example
   * ```typescript
   * // Fetch all documents with full content
   * const allDocs = await client.getAllDocuments();
   * console.log(`Total documents: ${allDocs.length}`);
   *
   * // Fetch all documents without content (faster)
   * const allDocsLite = await client.getAllDocuments(false);
   * ```
   */
  async getAllDocuments(includeContent: boolean = true): Promise<GranolaDocument[]> {
    const allDocs: GranolaDocument[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getDocuments({
        limit,
        offset,
        includeContent,
      });

      allDocs.push(...response.docs);

      // If we got fewer documents than requested, we've reached the end
      if (response.docs.length < limit) {
        break;
      }

      offset += limit;
    }

    return allDocs;
  }
}

// =============================================================================
// Convenience Exports
// =============================================================================

export { getGranolaAuthPath, isTokenExpired, getExpirationInfo };
