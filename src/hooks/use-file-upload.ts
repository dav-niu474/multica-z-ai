'use client'

import { useState, useCallback, useRef } from 'react'

export interface UploadResult {
  id: string
  name: string
  url: string
  size: number
  mimeType: string
  createdAt: string
}

export interface UseFileUploadReturn {
  upload: (file: File, workspaceId: string) => Promise<UploadResult | null>
  uploading: boolean
  progress: number
  error: string | null
  clearError: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const upload = useCallback(async (
    file: File,
    workspaceId: string
  ): Promise<UploadResult | null> => {
    // Cancel any in-flight upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('workspaceId', workspaceId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message =
          (errorData as { error?: string }).error ||
          `Upload failed (${response.status})`
        throw new Error(message)
      }

      const result: UploadResult = await response.json()
      setProgress(100)
      return result
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Upload cancelled')
      } else {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
      }
      return null
    } finally {
      setUploading(false)
      abortControllerRef.current = null
    }
  }, [])

  return {
    upload,
    uploading,
    progress,
    error,
    clearError,
  }
}
