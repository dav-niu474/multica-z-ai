'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Loader2 } from 'lucide-react'
import type { Agent, Project, IssuePriority } from '@/types'

interface IssueFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  agents: Agent[]
  projects: Project[]
  onIssueCreated?: () => void
}

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; color: string }[] = [
  { value: 'none', label: 'No Priority', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'low', label: 'Low', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
]

export default function IssueFormDialog({
  open,
  onOpenChange,
  workspaceId,
  agents,
  projects,
  onIssueCreated,
}: IssueFormDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<IssuePriority>('none')
  const [assigneeType, setAssigneeType] = useState<string>('none')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [labelInput, setLabelInput] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('none')
    setAssigneeType('none')
    setAssigneeId('')
    setProjectId('')
    setLabelInput('')
    setLabels([])
  }

  const handleAddLabel = () => {
    const trimmed = labelInput.trim()
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed])
      setLabelInput('')
    }
  }

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label))
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status: 'backlog',
          assigneeType: assigneeType !== 'none' ? assigneeType : null,
          assigneeId: assigneeId || null,
          projectId: projectId || null,
          workspaceId,
          labels: labels.length > 0 ? labels : null,
        }),
      })

      if (!res.ok) throw new Error('Failed to create issue')

      resetForm()
      onOpenChange(false)
      onIssueCreated?.()
    } catch {
      console.error('Error creating issue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="issue-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="issue-title"
              placeholder="Brief summary of the issue..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="issue-desc">Description</Label>
            <Textarea
              id="issue-desc"
              placeholder="Add a more detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        opt.value === 'none' ? 'bg-gray-400' :
                        opt.value === 'low' ? 'bg-sky-500' :
                        opt.value === 'medium' ? 'bg-amber-500' :
                        opt.value === 'high' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`} />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.icon ? `${p.icon} ` : ''}{p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select value={assigneeType} onValueChange={setAssigneeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assigneeType === 'agent' && (
            <div className="space-y-2">
              <Label>Select Agent</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assigneeType === 'member' && (
            <div className="space-y-2">
              <Label>Member ID</Label>
              <Input
                placeholder="Enter member ID..."
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              />
            </div>
          )}

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a label..."
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddLabel()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddLabel}
                disabled={!labelInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {labels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs gap-1">
                    {label}
                    <button
                      onClick={() => handleRemoveLabel(label)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
