'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, MessageSquare, Send, Loader2, Bot, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Issue, IssueStatus, IssuePriority, Agent, Comment, Attachment } from '@/types'
import { FileUploadButton } from '@/components/upload/file-upload-button'
import { FileDropZone } from '@/components/upload/file-drop-zone'
import { FilePreview } from '@/components/upload/file-preview'
import { ImageLightbox } from '@/components/upload/image-lightbox'
import { CommentAttachments } from '@/components/issues/comment-attachments'
import { useFileUpload, type UploadResult } from '@/hooks/use-file-upload'
import { useWorkspace } from '@/hooks/use-workspace'

interface IssueDetailPanelProps {
  issueId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  agents: Agent[]
  onIssueUpdated?: () => void
}

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  todo: { label: 'Todo', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  in_review: { label: 'In Review', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  done: { label: 'Done', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string }> = {
  none: { label: 'None', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  low: { label: 'Low', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

interface PendingUpload {
  file: File
  result: UploadResult | null
  uploading: boolean
  error: string | null
}

export default function IssueDetailPanel({
  issueId,
  open,
  onOpenChange,
  agents,
  onIssueUpdated,
}: IssueDetailPanelProps) {
  const [issue, setIssue] = useState<Issue | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [lightboxState, setLightboxState] = useState<{ open: boolean; url: string | null; name?: string }>({
    open: false,
    url: null,
  })
  const { workspace } = useWorkspace()
  const { upload } = useFileUpload()

  const workspaceId = workspace?.id || 'default'

  const fetchIssue = useCallback(async () => {
    if (!issueId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/issues/${issueId}`)
      if (res.ok) {
        const data = await res.json()
        setIssue(data)
      }
    } catch (err) {
      console.error('Error fetching issue:', err)
    } finally {
      setLoading(false)
    }
  }, [issueId])

  const fetchComments = useCallback(async () => {
    if (!issueId) return
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
    }
  }, [issueId])

  useEffect(() => {
    if (open && issueId) {
      fetchIssue()
      fetchComments()
    }
  }, [open, issueId, fetchIssue, fetchComments])

  const handleStatusChange = async (newStatus: string) => {
    if (!issueId || updating) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        setIssue(data)
        onIssueUpdated?.()
      }
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    if (!issueId || updating) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })
      if (res.ok) {
        const data = await res.json()
        setIssue(data)
        onIssueUpdated?.()
      }
    } catch (err) {
      console.error('Error updating priority:', err)
    } finally {
      setUpdating(false)
    }
  }

  // Handle file selection for upload
  const handleFileSelect = useCallback(async (file: File) => {
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const pending: PendingUpload = {
      file,
      result: null,
      uploading: true,
      error: null,
    }

    setPendingUploads((prev) => [...prev, pending])

    const result = await upload(file, workspaceId)

    setPendingUploads((prev) =>
      prev.map((p) => {
        // Match by file reference
        if (p.file === file && p.uploading) {
          return {
            ...p,
            uploading: false,
            result,
            error: result ? null : 'Upload failed',
          }
        }
        return p
      })
    )
  }, [upload, workspaceId])

  // Handle drop zone files
  const handleDropFiles = useCallback((files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      handleFileSelect(files[i])
    }
  }, [handleFileSelect])

  // Remove a pending upload
  const removePendingUpload = useCallback((index: number) => {
    setPendingUploads((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddComment = async () => {
    if (!issueId) return
    if (!newComment.trim() && pendingUploads.length === 0) return

    // Check if any uploads are still in progress
    const hasUploading = pendingUploads.some((p) => p.uploading)
    if (hasUploading) return

    setSubmittingComment(true)
    try {
      // Gather successfully uploaded attachment metadata
      const attachments = pendingUploads
        .filter((p) => p.result)
        .map((p) => p.result!)

      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          attachments,
        }),
      })

      if (res.ok) {
        setNewComment('')
        setPendingUploads([])
        fetchComments()
      }
    } catch (err) {
      console.error('Error adding comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const getAssigneeInfo = () => {
    if (!issue?.assigneeId) return null
    if (issue.assigneeType === 'agent') {
      return agents.find((a) => a.id === issue.assigneeId)
    }
    return { name: issue.assigneeId, avatar: null }
  }

  const canSubmit = (newComment.trim() && !submittingComment) || 
    (!submittingComment && pendingUploads.length > 0 && !pendingUploads.some((p) => p.uploading))

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[560px] p-0">
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!issue) return null

  const assignee = getAssigneeInfo()
  const statusCfg = STATUS_CONFIG[issue.status]
  const priorityCfg = PRIORITY_CONFIG[issue.priority]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[560px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <SheetTitle className="text-base leading-snug">{issue.title}</SheetTitle>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className={statusCfg.color}>
                {statusCfg.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">#{issue.id.slice(-6)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
            </span>
            {issue.project && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  {issue.project.icon && <span>{issue.project.icon}</span>}
                  {issue.project.name}
                </span>
              </>
            )}
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <Select
                  value={issue.status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            key === 'backlog' ? 'bg-gray-400' :
                            key === 'todo' ? 'bg-sky-500' :
                            key === 'in_progress' ? 'bg-amber-500' :
                            key === 'in_review' ? 'bg-violet-500' :
                            key === 'done' ? 'bg-emerald-500' :
                            'bg-red-500'
                          }`} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Priority</p>
                <Select
                  value={issue.priority}
                  onValueChange={handlePriorityChange}
                  disabled={updating}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            key === 'none' ? 'bg-gray-400' :
                            key === 'low' ? 'bg-sky-500' :
                            key === 'medium' ? 'bg-amber-500' :
                            key === 'high' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {assignee && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Assignee</p>
                  <div className="flex items-center gap-1.5 h-8 px-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {'avatar' in assignee && assignee.avatar ? (
                          <img src={assignee.avatar} alt={assignee.name} className="h-5 w-5 rounded-full" />
                        ) : (
                          assignee.name?.charAt(0) || '?'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{assignee.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3 min-h-[60px]">
                {issue.description || (
                  <span className="italic">No description provided</span>
                )}
              </div>
            </div>

            {/* Labels */}
            {issue.labels && issue.labels.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {issue.labels.map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
                {comments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {comments.length}
                  </Badge>
                )}
              </h3>

              {/* Existing comments */}
              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment: Comment) => {
                    // Parse attachments from JSON
                    const attachments: Attachment[] = Array.isArray(comment.attachments)
                      ? comment.attachments
                      : typeof comment.attachments === 'string'
                        ? JSON.parse(comment.attachments || '[]')
                        : []

                    return (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {comment.authorType === 'agent' ? (
                              <Bot className="h-3.5 w-3.5" />
                            ) : (
                              <User className="h-3.5 w-3.5" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {comment.authorType === 'agent' ? 'Agent' : comment.authorName || 'Member'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {comment.content && (
                            <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          )}
                          <CommentAttachments
                            attachments={attachments}
                            onImageClick={(att) => setLightboxState({
                              open: true,
                              url: att.url,
                              name: att.name,
                            })}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add comment with drag-and-drop */}
              <FileDropZone onFiles={handleDropFiles}>
                <div className="space-y-2">
                  {/* Pending file previews */}
                  {pendingUploads.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pendingUploads.map((pending, index) =>
                        pending.result ? (
                          <FilePreview
                            key={pending.result.id}
                            file={pending.result}
                            compact
                            onRemove={() => removePendingUpload(index)}
                          />
                        ) : (
                          <FilePreview
                            key={`pending-${index}`}
                            file={pending.file as File & { _uploadResult?: undefined }}
                            uploading={pending.uploading}
                            progress={0}
                            onRemove={() => removePendingUpload(index)}
                            compact
                          />
                        )
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="Add a comment... (drag & drop or paste files)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      className="flex-1 resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleAddComment()
                        }
                      }}
                    />
                    <FileUploadButton
                      onSelect={handleFileSelect}
                      tooltip="Attach file"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleAddComment}
                      disabled={!canSubmit}
                      className="shrink-0 h-9 w-9"
                    >
                      {submittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Press Ctrl+Enter to send · Attach files with the clip button or drag & drop
                  </p>
                </div>
              </FileDropZone>
            </div>
          </div>
        </ScrollArea>

        {/* Image Lightbox */}
        <ImageLightbox
          open={lightboxState.open}
          onOpenChange={(open) => setLightboxState({ open, url: null, name: undefined })}
          imageUrl={lightboxState.url}
          imageName={lightboxState.name}
        />
      </SheetContent>
    </Sheet>
  )
}
