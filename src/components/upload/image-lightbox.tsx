'use client'

import { useEffect, useCallback, useState } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ZoomIn, ZoomOut, Download, X } from 'lucide-react'

interface LightboxInnerProps {
  imageUrl: string
  imageName?: string
  onClose: () => void
}

function LightboxInner({ imageUrl, imageName, onClose }: LightboxInnerProps) {
  const [scale, setScale] = useState(1)

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.25, 5))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.25, 0.25))
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1)
  }, [])

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        setScale((s) => Math.min(s + 0.25, 5))
      } else if (e.key === '-') {
        setScale((s) => Math.max(s - 0.25, 0.25))
      } else if (e.key === '0') {
        setScale(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                onClick={zoomOut}
                disabled={scale <= 0.25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out (-)</TooltipContent>
          </Tooltip>

          <button
            onClick={resetZoom}
            className="px-2 py-1 text-xs text-white/60 hover:text-white transition-colors min-w-[48px] text-center"
          >
            {Math.round(scale * 100)}%
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                onClick={zoomIn}
                disabled={scale >= 5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in (+)</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          {imageName && (
            <span className="text-xs text-white/50 mr-2 truncate max-w-[200px]">
              {imageName}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                asChild
              >
                <a
                  href={imageUrl}
                  download={imageName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden cursor-zoom-out"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <img
          src={imageUrl}
          alt={imageName || 'Image preview'}
          className="max-w-full max-h-full object-contain transition-transform duration-150"
          style={{ transform: `scale(${scale})` }}
        />
      </div>

      {/* Footer hint */}
      <div className="px-4 py-1.5 text-center shrink-0">
        <p className="text-[10px] text-white/30">
          ESC to close · +/- to zoom · 0 to reset
        </p>
      </div>
    </>
  )
}

interface ImageLightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string | null
  imageName?: string
}

export function ImageLightbox({
  open,
  onOpenChange,
  imageUrl,
  imageName,
}: ImageLightboxProps) {
  if (!imageUrl) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-black/95 backdrop-blur-sm flex flex-col gap-0 overflow-hidden">
        {/* Key on imageUrl ensures fresh state when image changes */}
        <LightboxInner
          key={imageUrl}
          imageUrl={imageUrl}
          imageName={imageName}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
