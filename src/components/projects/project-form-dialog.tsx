'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Project, ProjectStatus, IssuePriority } from '@/types'
import { PROJECT_STATUS_LABELS, PRIORITY_LABELS } from '@/types'

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  workspaceId: string
  onSubmit: (data: {
    name: string
    description: string
    icon: string
    status: ProjectStatus
    priority: IssuePriority
    workspaceId: string
  }) => Promise<void>
}

const STATUSES: ProjectStatus[] = ['planned', 'in_progress', 'paused', 'completed', 'cancelled']
const PRIORITIES: IssuePriority[] = ['none', 'low', 'medium', 'high', 'urgent']

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  workspaceId,
  onSubmit,
}: ProjectFormDialogProps) {
  const isEditing = !!project
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [icon, setIcon] = useState(project?.icon ?? '📁')
  const [status, setStatus] = useState<string>(project?.status ?? 'planned')
  const [priority, setPriority] = useState<string>(project?.priority ?? 'none')
  const [submitting, setSubmitting] = useState(false)

  // Sync form when project prop changes (critical for edit mode)
  useEffect(() => {
    if (project) {
      setName(project.name ?? '')
      setDescription(project.description ?? '')
      setIcon(project.icon ?? '📁')
      setStatus(project.status ?? 'planned')
      setPriority(project.priority ?? 'none')
    } else {
      setName('')
      setDescription('')
      setIcon('📁')
      setStatus('planned')
      setPriority('none')
    }
  }, [project])

  const resetForm = () => {
    setName('')
    setDescription('')
    setIcon('📁')
    setStatus('planned')
    setPriority('none')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || '📁',
        status: status as ProjectStatus,
        priority: priority as IssuePriority,
        workspaceId,
      })
      resetForm()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to submit project:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'Create Project'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the project details.'
              : 'Create a new project to organize issues and track progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-icon">Icon</Label>
              <Input
                id="project-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-20 text-center text-2xl"
                maxLength={4}
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor="project-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder="e.g. API Gateway v2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Input
              id="project-description"
              placeholder="Brief description of the project goals"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="project-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="project-priority" className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
