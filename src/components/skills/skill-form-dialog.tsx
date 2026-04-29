'use client'

import { useState, useEffect } from 'react'
import { Zap, Wrench } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Skill, SkillCategory } from '@/types'
import { SKILL_CATEGORY_LABELS } from '@/types'

interface SkillFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill?: Skill | null
  workspaceId: string
  onSubmit: (data: {
    name: string
    description: string
    content: string
    type: 'skill' | 'tool'
    category: SkillCategory | null
    source: string
    workspaceId: string
  }) => Promise<void>
}

const CATEGORIES: SkillCategory[] = [
  'engineering',
  'testing',
  'review',
  'deployment',
  'custom',
  'security',
  'performance',
  'git',
  'documentation',
]

export function SkillFormDialog({
  open,
  onOpenChange,
  skill,
  workspaceId,
  onSubmit,
}: SkillFormDialogProps) {
  const isEditing = !!skill
  const [name, setName] = useState(skill?.name ?? '')
  const [description, setDescription] = useState(skill?.description ?? '')
  const [content, setContent] = useState(skill?.content ?? '')
  const [type, setType] = useState<string>(skill?.type ?? 'skill')
  const [category, setCategory] = useState<string>(skill?.category ?? 'engineering')
  const [source, setSource] = useState(skill?.source ?? 'manual')
  const [submitting, setSubmitting] = useState(false)

  // Sync form when skill prop changes (critical for edit mode)
  useEffect(() => {
    if (skill) {
      setName(skill.name ?? '')
      setDescription(skill.description ?? '')
      setContent(skill.content ?? '')
      setType(skill.type ?? 'skill')
      setCategory(skill.category ?? 'engineering')
      setSource(skill.source ?? 'manual')
    } else {
      setName('')
      setDescription('')
      setContent('')
      setType('skill')
      setCategory('engineering')
      setSource('manual')
    }
  }, [skill])

  const resetForm = () => {
    setName('')
    setDescription('')
    setContent('')
    setType('skill')
    setCategory('engineering')
    setSource('manual')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return

    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        content: content.trim(),
        type: (type as 'skill' | 'tool') || 'skill',
        category: (category as SkillCategory) || null,
        source: source || 'manual',
        workspaceId,
      })
      resetForm()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to submit skill:', err)
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Skill' : 'Create Skill'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the skill details and content.'
              : 'Define a new skill that can be attached to agents.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="skill-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="skill-name"
                placeholder="e.g. Code Review, TDD Workflow"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="skill-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="skill-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skill">
                    <span className="flex items-center gap-1.5">
                      <Zap className="size-3.5 text-amber-500" />
                      Skill (技能)
                    </span>
                  </SelectItem>
                  <SelectItem value="tool">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="size-3.5 text-emerald-500" />
                      Tool (工具)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="skill-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="skill-category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {SKILL_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="skill-description">Description</Label>
            <Input
              id="skill-description"
              placeholder="Brief description of what this skill covers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="skill-source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="skill-source" className="w-full">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="url">URL Import</SelectItem>
                  <SelectItem value="import">File Import</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="skill-content">
              Content (Markdown) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="skill-content"
              placeholder="# Skill Content&#10;&#10;Write your skill instructions in markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              {content.length} characters — Use markdown formatting for rich content
            </p>
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
            <Button type="submit" disabled={submitting || !name.trim() || !content.trim()}>
              {submitting ? 'Saving...' : isEditing ? 'Update Skill' : 'Create Skill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
