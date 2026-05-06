'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Image, FileText, Download } from 'lucide-react'
import type { Attachment } from '@/types'

interface CommentAttachmentsProps {
  attachments: Attachment[]
  onImageClick?: (attachment: Attachment) => void
  className?: string
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export function CommentAttachments({
  attachments,
  onImageClick,
  className,
}: CommentAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null

  const images = attachments.filter((a) => isImageMime(a.mimeType))
  const files = attachments.filter((a) => !isImageMime(a.mimeType))

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {images.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group rounded-md overflow-hidden ring-1 ring-border cursor-pointer"
              onClick={() => onImageClick?.(attachment)}
            >
              <img
                src={attachment.url}
                alt={attachment.name}
                className="h-16 w-16 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Image className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File download links */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.url}
              download={attachment.name}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[140px]">{attachment.name}</span>
              <span className="text-[10px] opacity-60">{formatFileSize(attachment.size)}</span>
              <Download className="h-3 w-3 flex-shrink-0 opacity-50" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
