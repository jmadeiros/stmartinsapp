'use server'

import { createClient } from "@/lib/supabase/server"

export type StorageBucket = 'avatars' | 'post-images' | 'event-images'

export type UploadResult = {
  success: boolean
  data: {
    path: string
    publicUrl: string
  } | null
  error: string | null
}

export type DeleteResult = {
  success: boolean
  error: string | null
}

/**
 * Maximum file size in bytes (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

/**
 * Generate a unique filename with timestamp and random string
 */
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg'
  return `${timestamp}-${randomString}.${extension}`
}

/**
 * Upload an image to a storage bucket
 *
 * @param bucket - The storage bucket to upload to
 * @param file - The file to upload (as base64 data URL or File object converted to base64)
 * @param filename - Optional custom filename
 * @param customPath - Optional custom path within the user's folder
 * @returns Upload result with public URL
 */
export async function uploadImage(
  bucket: StorageBucket,
  fileData: string, // Base64 data URL (e.g., "data:image/png;base64,...")
  filename?: string,
  customPath?: string
): Promise<UploadResult> {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[uploadImage] Not authenticated:', authError)
      return { success: false, data: null, error: 'Not authenticated' }
    }

    // Validate file data format
    if (!fileData.startsWith('data:')) {
      return { success: false, data: null, error: 'Invalid file data format. Expected base64 data URL.' }
    }

    // Parse the data URL
    const matches = fileData.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      return { success: false, data: null, error: 'Invalid data URL format' }
    }

    const mimeType = matches[1]
    const base64Data = matches[2]

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        success: false,
        data: null,
        error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      }
    }

    // Convert base64 to binary
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Validate file size
    if (bytes.length > MAX_FILE_SIZE) {
      return {
        success: false,
        data: null,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    }

    // Generate filename
    const finalFilename = filename || generateUniqueFilename('image.' + mimeType.split('/')[1])

    // Build the storage path: {user_id}/{customPath?}/{filename}
    const storagePath = customPath
      ? `${user.id}/${customPath}/${finalFilename}`
      : `${user.id}/${finalFilename}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, bytes.buffer, {
        contentType: mimeType,
        upsert: true // Overwrite if exists
      })

    if (uploadError) {
      console.error('[uploadImage] Upload error:', uploadError)
      return { success: false, data: null, error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path)

    console.log(`[uploadImage] Successfully uploaded to ${bucket}/${uploadData.path}`)

    return {
      success: true,
      data: {
        path: uploadData.path,
        publicUrl: urlData.publicUrl
      },
      error: null
    }
  } catch (error) {
    console.error('[uploadImage] Exception:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error during upload'
    }
  }
}

/**
 * Delete an image from a storage bucket
 *
 * @param bucket - The storage bucket
 * @param path - The path to the file to delete
 * @returns Delete result
 */
export async function deleteImage(
  bucket: StorageBucket,
  path: string
): Promise<DeleteResult> {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[deleteImage] Not authenticated:', authError)
      return { success: false, error: 'Not authenticated' }
    }

    // Verify the path belongs to the current user (security check)
    if (!path.startsWith(user.id)) {
      console.error('[deleteImage] Unauthorized: Path does not belong to user')
      return { success: false, error: 'Unauthorized to delete this file' }
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (deleteError) {
      console.error('[deleteImage] Delete error:', deleteError)
      return { success: false, error: deleteError.message }
    }

    console.log(`[deleteImage] Successfully deleted ${bucket}/${path}`)

    return { success: true, error: null }
  } catch (error) {
    console.error('[deleteImage] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during deletion'
    }
  }
}

/**
 * Get the public URL for a file in a storage bucket
 * This is a client-side safe function that doesn't require authentication
 *
 * @param bucket - The storage bucket
 * @param path - The path to the file
 * @returns Public URL string
 */
export async function getPublicUrl(
  bucket: StorageBucket,
  path: string
): Promise<string> {
  const supabase = await createClient()

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Upload avatar image - convenience wrapper
 * Stores avatar at: {user_id}/avatar.{ext}
 */
export async function uploadAvatar(fileData: string): Promise<UploadResult> {
  const supabase = await createClient()

  // Get current user to determine the correct filename
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, data: null, error: 'Not authenticated' }
  }

  // Parse MIME type to get extension
  const matches = fileData.match(/^data:([^;]+);base64,/)
  const mimeType = matches?.[1] || 'image/jpeg'
  const extension = mimeType.split('/')[1] || 'jpg'

  // Upload with a fixed filename for easy replacement
  return uploadImage('avatars', fileData, `avatar.${extension}`)
}

/**
 * Upload post image - convenience wrapper
 * Stores image at: {user_id}/posts/{timestamp}-{random}.{ext}
 */
export async function uploadPostImage(fileData: string): Promise<UploadResult> {
  return uploadImage('post-images', fileData, undefined, 'posts')
}

/**
 * Upload event image - convenience wrapper
 * Stores image at: {user_id}/events/{timestamp}-{random}.{ext}
 */
export async function uploadEventImage(fileData: string): Promise<UploadResult> {
  return uploadImage('event-images', fileData, undefined, 'events')
}
