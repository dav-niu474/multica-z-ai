'use client'

import { useState, useCallback, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FileDropZoneProps {
  onFiles: (files: FileList) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
}

export function FileDropZone({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  children,
  className,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      dragCounterRef.current++
      setIsDragging(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      dragCounterRef.current--
      if (dragCounterRef.current === 0) {
        setIsDragging(false)
      }
    },
    [disabled]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      setIsDragging(false)
      dragCounterRef.current = 0

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        // Filter files by accept if specified
        if (accept) {
          const acceptTypes = accept.split(',').map((t) => t.trim().toLowerCase())
          const filteredFiles: File[] = []
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const matches = acceptTypes.some((type) => {
              if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type)
              }
              if (type.endsWith('/*')) {
                return file.type.startsWith(type.replace('/*', '/'))
              }
              return file.type === type
            })
            if (matches) filteredFiles.push(file)
          }
          if (filteredFiles.length > 0) {
            const dt = new DataTransfer()
            filteredFiles.forEach((f) => dt.items.add(f))
            onFiles(dt.files)
          }
        } else {
          onFiles(files)
        }
      }
    },
    [disabled, accept, onFiles]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled) return
      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) {
            // Only accept images from clipboard unless accept is specified
            if (!accept || file.type.startsWith('image/')) {
              files.push(file)
            }
          }
        }
      }

      if (files.length > 0) {
        const dt = new DataTransfer()
        files.forEach((f) => dt.items.add(f))
        onFiles(dt.files)
      }
    },
    [disabled, accept, onFiles]
  )

  return (
    <div
      className={cn('relative', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {children}
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-md border-2 border-dashed border-primary/50 bg-primary/5 backdrop-blur-[1px] pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <svg
              className="h-8 w-8 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm font-medium">Drop files here</p>
            {!multiple && <p className="text-xs">Single file only</p>}
          </div>
        </div>
      )}
    </div>
  )
}
