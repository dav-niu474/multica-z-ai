'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Image, FileText, Download, X, Loader2 } from 'lucide-react'
import type { UploadResult } from '@/hooks/use-file-upload'

export interface FilePreviewProps {
  file: UploadResult | (File & { _uploadResult?: UploadResult })
  uploading?: boolean
  progress?: number
  onRemove?: () => void
  onImageClick?: (url: string) => void
  compact?: boolean
  className?: string
}

function isUploadResult(file: FilePreviewProps['file']): file is UploadResult {
  return 'url' in file && typeof (file as UploadResult).url === 'string'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function FilePreview({
  file,
  uploading = false,
  progress = 0,
  onRemove,
  onImageClick,
  compact = false,
  className,
}: FilePreviewProps) {
  const [imgError, setImgError] = useState(false)

  const name = isUploadResult(file) ? file.name : file.name
  const size = isUploadResult(file) ? file.size : file.size
  const mimeType = isUploadResult(file) ? file.mimeType : file.type
  const url = isUploadResult(file) ? file.url : (file._uploadResult?.url || null)

  const isImage = isImageMime(mimeType)

  if (compact) {
    return (
      <div className={cn('group relative inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs', className)}>
        {isImage && url && !imgError ? (
          <div
            className="h-5 w-5 rounded-sm overflow-hidden flex-shrink-0 cursor-pointer"
            onClick={() => onImageClick?.(url)}
          >
            <img
              src={url}
              alt={name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : isImage ? (
          <Image className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
        <span className="truncate max-w-[120px] font-medium">{name}</span>
        {uploading ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground flex-shrink-0" />
        ) : (
          <span className="text-muted-foreground flex-shrink-0">{formatFileSize(size)}</span>
        )}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('group relative flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3', className)}>
      {/* Thumbnail / Icon */}
      <div className="flex-shrink-0">
        {isImage && url && !imgError ? (
          <div
            className="h-14 w-14 rounded-md overflow-hidden cursor-pointer ring-1 ring-border"
            onClick={() => onImageClick?.(url)}
          >
            <img
              src={url}
              alt={name}
              className="h-full w-full object-cover transition-transform hover:scale-105"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center ring-1 ring-border">
            {isImage ? (
              <Image className="h-6 w-6 text-muted-foreground" />
            ) : (
              <FileText className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatFileSize(size)} · {mimeType.split('/').pop()}
        </p>

        {/* Progress bar during upload */}
        {uploading && (
          <div className="mt-2 space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              Uploading... {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Download button after upload */}
        {!uploading && url && (
          <div className="mt-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <a href={url} download={name} target="_blank" rel="noopener noreferrer">
                <Download className="h-3 w-3 mr-1" />
                Download
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Remove button */}
      {onRemove && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">Remove</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
