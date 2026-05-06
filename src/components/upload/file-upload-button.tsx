'use client'

import { useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Paperclip } from 'lucide-react'

interface FileUploadButtonProps {
  onSelect: (file: File) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  tooltip?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'link' | 'destructive'
  className?: string
}

export function FileUploadButton({
  onSelect,
  accept,
  multiple = false,
  disabled = false,
  tooltip = 'Attach file',
  size = 'icon',
  variant = 'ghost',
  className,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return
      for (let i = 0; i < files.length; i++) {
        onSelect(files[i])
      }
      // Reset input so the same file can be selected again
      e.target.value = ''
    },
    [onSelect]
  )

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      <Paperclip className="h-4 w-4" />
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        tabIndex={-1}
      />
    </Button>
  )

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}
