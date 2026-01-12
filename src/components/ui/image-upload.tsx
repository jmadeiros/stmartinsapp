"use client"

import * as React from "react"
import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react"

/**
 * Maximum file size: 50MB
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024

/**
 * Allowed MIME types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

/**
 * File extension to MIME type mapping
 */
const EXTENSION_MAP: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp'
}

export interface ImageUploadProps {
  /** Callback when an image is selected and converted to base64 */
  onImageSelect: (base64Data: string, file: File) => void
  /** Callback when the image is cleared */
  onImageClear?: () => void
  /** Whether the component is in a loading/uploading state */
  isUploading?: boolean
  /** Upload progress (0-100) */
  uploadProgress?: number
  /** Error message to display */
  error?: string | null
  /** Current preview URL (if image already uploaded) */
  previewUrl?: string | null
  /** Additional class names */
  className?: string
  /** Disabled state */
  disabled?: boolean
  /** Custom accept string for file input */
  accept?: string
  /** Maximum file size in bytes */
  maxSize?: number
}

export function ImageUpload({
  onImageSelect,
  onImageClear,
  isUploading = false,
  uploadProgress = 0,
  error = null,
  previewUrl = null,
  className,
  disabled = false,
  accept = "image/jpeg,image/png,image/gif,image/webp",
  maxSize = MAX_FILE_SIZE,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync external preview URL
  React.useEffect(() => {
    setPreview(previewUrl)
  }, [previewUrl])

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      // Also check by extension for some browsers that don't report MIME correctly
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !EXTENSION_MAP[extension]) {
        return `Invalid file type. Allowed types: JPEG, PNG, GIF, WebP`
      }
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024)
      return `File too large. Maximum size is ${maxSizeMB}MB`
    }

    return null
  }, [maxSize])

  const handleFile = useCallback(async (file: File) => {
    setLocalError(null)

    // Validate the file
    const validationError = validateFile(file)
    if (validationError) {
      setLocalError(validationError)
      return
    }

    // Read file and convert to base64
    const reader = new FileReader()

    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      setPreview(base64Data)
      onImageSelect(base64Data, file)
    }

    reader.onerror = () => {
      setLocalError('Failed to read file')
    }

    reader.readAsDataURL(file)
  }, [validateFile, onImageSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [disabled, isUploading, handleFile])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFile])

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, isUploading])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setLocalError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageClear?.()
  }, [onImageClear])

  const displayError = error || localError

  // Show preview state
  if (preview && !displayError) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
          {/* Preview Image */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />

          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              {uploadProgress > 0 && (
                <div className="w-2/3">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-white text-sm text-center mt-2">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Clear button */}
          {!isUploading && (
            <Button
              variant="destructive"
              size="icon-sm"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Show drop zone state
  return (
    <div className={cn("relative", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "flex flex-col items-center justify-center gap-3 min-h-[160px]",
          isDragging && "border-primary bg-primary/5",
          !isDragging && !displayError && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          displayError && "border-destructive bg-destructive/5",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
            {uploadProgress > 0 && (
              <div className="w-2/3">
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </>
        ) : displayError ? (
          <>
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-destructive text-center">{displayError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setLocalError(null)
              }}
            >
              Try Again
            </Button>
          </>
        ) : (
          <>
            <div className={cn(
              "rounded-full p-3 transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}>
              {isDragging ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging ? "Drop image here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, GIF, or WebP (max {Math.round(maxSize / 1024 / 1024)}MB)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Compact image upload button variant
 * Shows only a button that opens file picker
 */
export interface ImageUploadButtonProps {
  /** Callback when an image is selected */
  onImageSelect: (base64Data: string, file: File) => void
  /** Whether the component is in a loading/uploading state */
  isUploading?: boolean
  /** Error message */
  error?: string | null
  /** Additional class names */
  className?: string
  /** Disabled state */
  disabled?: boolean
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary"
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon"
  /** Custom label */
  label?: string
  /** Max file size */
  maxSize?: number
}

export function ImageUploadButton({
  onImageSelect,
  isUploading = false,
  error = null,
  className,
  disabled = false,
  variant = "ghost",
  size = "sm",
  label = "Photo",
  maxSize = MAX_FILE_SIZE,
}: ImageUploadButtonProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !EXTENSION_MAP[extension]) {
        return `Invalid file type`
      }
    }
    if (file.size > maxSize) {
      return `File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`
    }
    return null
  }, [maxSize])

  const handleFile = useCallback(async (file: File) => {
    setLocalError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setLocalError(validationError)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      onImageSelect(base64Data, file)
    }
    reader.onerror = () => {
      setLocalError('Failed to read file')
    }
    reader.readAsDataURL(file)
  }, [validateFile, onImageSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFile])

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, isUploading])

  const displayError = error || localError

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={cn(
          "gap-2",
          displayError && "text-destructive border-destructive"
        )}
        title={displayError || undefined}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
        {label && <span className="text-sm hidden sm:inline">{label}</span>}
      </Button>
    </div>
  )
}
