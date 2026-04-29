'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
import type {
  Agent,
  AgentProvider,
  AgentVisibility,
  Skill,
  AgentFormData,
} from '@/types'

interface AgentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: Agent | null
  skills: Skill[]
  workspaceId: string
  onSuccess?: () => void
}

const PROVIDERS: { value: AgentProvider; label: string }[] = [
  { value: 'claude', label: 'Claude Code' },
  { value: 'codex', label: 'Codex' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'custom', label: 'Custom' },
]

const VISIBILITIES: { value: AgentVisibility; label: string }[] = [
  { value: 'workspace', label: 'Workspace' },
  { value: 'private', label: 'Private' },
]

const SKILL_CATEGORY_COLORS: Record<string, string> = {
  engineering: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  testing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  review: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  deployment: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  custom: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
}

export default function AgentFormDialog({
  open,
  onOpenChange,
  agent,
  skills,
  workspaceId,
  onSuccess,
}: AgentFormDialogProps) {
  const isEdit = !!agent

  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    description: '',
    provider: 'claude',
    instructions: '',
    maxConcurrent: 3,
    visibility: 'workspace',
    skillIds: [],
  })

  const [submitting, setSubmitting] = useState(false)

  // Pre-fill form when editing
  useEffect(() => {
    if (agent && open) {
      setFormData({
        name: agent.name,
        description: agent.description ?? '',
        provider: agent.provider,
        instructions: agent.instructions ?? '',
        maxConcurrent: agent.maxConcurrent,
        visibility: agent.visibility,
        skillIds: agent.skills?.map((as) => as.skillId) ?? [],
      })
    } else if (!agent && open) {
      setFormData({
        name: '',
        description: '',
        provider: 'claude',
        instructions: '',
        maxConcurrent: 3,
        visibility: 'workspace',
        skillIds: [],
      })
    }
  }, [agent, open])

  function toggleSkill(skillId: string) {
    setFormData((prev) => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter((id) => id !== skillId)
        : [...prev.skillIds, skillId],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Agent name is required')
      return
    }

    try {
      setSubmitting(true)

      const url = isEdit ? `/api/agents/${agent.id}` : '/api/agents'
      const method = isEdit ? 'PUT' : 'POST'

      const body = isEdit
        ? {
            name: formData.name,
            description: formData.description || null,
            provider: formData.provider,
            instructions: formData.instructions || null,
            maxConcurrent: formData.maxConcurrent,
            visibility: formData.visibility,
          }
        : {
            ...formData,
            description: formData.description || null,
            instructions: formData.instructions || null,
            workspaceId,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? `Failed to ${isEdit ? 'update' : 'create'} agent`)
      }

      toast.success(
        isEdit
          ? `"${formData.name}" updated successfully`
          : `"${formData.name}" created successfully`
      )

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {isEdit ? 'Edit Agent' : 'Create Agent'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? 'Update agent configuration and settings'
              : 'Configure a new AI agent for your workspace'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="agent-name" className="text-xs">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="agent-name"
                placeholder="e.g. Claude Code"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="h-9 text-sm"
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="agent-desc" className="text-xs">
                Description
              </Label>
              <Input
                id="agent-desc"
                placeholder="Brief description of what this agent does"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="h-9 text-sm"
                disabled={submitting}
              />
            </div>

            {/* Provider & Visibility row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="agent-provider" className="text-xs">
                  Provider
                </Label>
                <Select
                  value={formData.provider}
                  onValueChange={(val: AgentProvider) =>
                    setFormData((prev) => ({ ...prev, provider: val }))
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="h-9 text-sm" id="agent-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="agent-visibility" className="text-xs">
                  Visibility
                </Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(val: AgentVisibility) =>
                    setFormData((prev) => ({ ...prev, visibility: val }))
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="h-9 text-sm" id="agent-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITIES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Max Concurrent */}
            <div className="grid gap-2">
              <Label htmlFor="agent-max-concurrent" className="text-xs">
                Max Concurrent Tasks
              </Label>
              <Input
                id="agent-max-concurrent"
                type="number"
                min={1}
                max={10}
                value={formData.maxConcurrent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxConcurrent: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                className="h-9 text-sm w-24"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of tasks this agent can handle simultaneously
              </p>
            </div>

            {/* Instructions */}
            <div className="grid gap-2">
              <Label htmlFor="agent-instructions" className="text-xs">
                Instructions / System Prompt
              </Label>
              <Textarea
                id="agent-instructions"
                placeholder="Enter system prompt or instructions for the agent..."
                value={formData.instructions}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    instructions: e.target.value,
                  }))
                }
                className="text-sm min-h-[100px] resize-y"
                disabled={submitting}
              />
            </div>

            {/* Skills Multi-select */}
            <div className="grid gap-2">
              <Label className="text-xs">Attached Skills</Label>
              {skills.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No skills available. Create skills first.
                </p>
              ) : (
                <ScrollArea className="max-h-40 rounded-md border p-2">
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <label
                        key={skill.id}
                        className="flex items-center gap-2.5 py-1 px-1 rounded-md hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.skillIds.includes(skill.id)}
                          onCheckedChange={() => toggleSkill(skill.id)}
                          disabled={submitting}
                        />
                        <span className="text-sm flex-1 min-w-0 truncate">
                          {skill.name}
                        </span>
                        {skill.category && (
                          <Badge
                            variant="secondary"
                            className={`text-xs shrink-0 ${
                              SKILL_CATEGORY_COLORS[skill.category] ?? ''
                            }`}
                          >
                            {skill.category}
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {formData.skillIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formData.skillIds.length} skill{formData.skillIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="text-sm">
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
