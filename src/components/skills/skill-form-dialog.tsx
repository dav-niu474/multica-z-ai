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
import { useTranslation } from '@/lib/i18n'

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
  defaultType?: 'skill' | 'tool'
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
  defaultType = 'skill',
}: SkillFormDialogProps) {
  const { t } = useTranslation()
  const isEditing = !!skill
  const [name, setName] = useState(skill?.name ?? '')
  const [description, setDescription] = useState(skill?.description ?? '')
  const [content, setContent] = useState(skill?.content ?? '')
  const [type, setType] = useState<string>(skill?.type ?? defaultType)
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
      setType(defaultType)
      setCategory('engineering')
      setSource('manual')
    }
  }, [skill, defaultType])

  const resetForm = () => {
    setName('')
    setDescription('')
    setContent('')
    setType(defaultType)
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
          <DialogTitle>
            {isEditing
              ? (type === 'tool' ? t.skills.editTool : t.skills.editSkill)
              : (type === 'tool' ? t.skills.createToolTitle : t.skills.createSkillTitle)}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t.skills.editSkillDesc
              : (type === 'tool' ? t.skills.createToolDesc : t.skills.createSkillDesc)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="skill-name">
                {t.common.name} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="skill-name"
                placeholder={t.skills.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="skill-type">{t.skills.typeLabel}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="skill-type" className="w-full">
                  <SelectValue placeholder={t.skills.selectType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skill">
                    <span className="flex items-center gap-1.5">
                      <Zap className="size-3.5 text-amber-500" />
                      {t.skills.skillLabel}
                    </span>
                  </SelectItem>
                  <SelectItem value="tool">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="size-3.5 text-emerald-500" />
                      {t.skills.toolLabel}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="skill-category">{t.skills.category}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="skill-category" className="w-full">
                  <SelectValue placeholder={t.skills.selectCategory} />
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
            <Label htmlFor="skill-description">{t.common.description}</Label>
            <Input
              id="skill-description"
              placeholder={t.skills.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="skill-source">{t.skills.source}</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="skill-source" className="w-full">
                  <SelectValue placeholder={t.skills.selectSource} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t.skills.sourceManual}</SelectItem>
                  <SelectItem value="url">{t.skills.sourceUrlImport}</SelectItem>
                  <SelectItem value="import">{t.skills.sourceFileImport}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="skill-content">
              {t.skills.contentMarkdown} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="skill-content"
              placeholder={t.skills.contentPlaceholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              {t.skills.contentLength(content.length)}
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
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={submitting || !name.trim() || !content.trim()}>
              {submitting ? t.common.saving : isEditing ? t.common.saveChanges : t.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
