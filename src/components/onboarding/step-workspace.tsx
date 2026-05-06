'use client'

import { useState, useMemo, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  FolderKanban,
  Link2,
  Hash,
} from 'lucide-react'

interface StepWorkspaceProps {
  onNext: (data: { name: string; slug: string; description: string; issuePrefix: string }) => void
  onBack: () => void
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const containerVariants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
}

export function StepWorkspace({ onNext, onBack }: StepWorkspaceProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [issuePrefix, setIssuePrefix] = useState('ISSUE')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const slug = useMemo(() => generateSlug(name), [name])

  const canSubmit = name.trim().length >= 2 && slug.length > 0 && !submitting

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setSubmitting(true)

    try {
      // Check if workspace with this slug already exists
      const checkRes = await fetch(`/api/workspaces?slug=${encodeURIComponent(slug)}`)
      if (checkRes.ok) {
        const existing = await checkRes.json()
        if (Array.isArray(existing) && existing.length > 0) {
          setError('A workspace with this slug already exists. Try a different name.')
          setSubmitting(false)
          return
        }
      }

      // Create the workspace
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          description: description.trim() || undefined,
          issuePrefix: issuePrefix.trim().toUpperCase() || 'ISSUE',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to create workspace. Please try again.')
        setSubmitting(false)
        return
      }

      const workspace = await res.json()
      onNext({
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description || '',
        issuePrefix: workspace.issuePrefix || 'ISSUE',
      })
    } catch {
      setError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      className="max-w-lg mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FolderKanban className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Create Your Workspace</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          This is where your team and AI agents will collaborate on projects.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Workspace Name */}
        <div className="space-y-2">
          <Label htmlFor="ws-name" className="text-sm font-medium">
            Workspace Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ws-name"
            placeholder="e.g., My Startup, Acme Inc."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoFocus
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">
            {name.length}/50 characters
          </p>
        </div>

        {/* Slug Preview */}
        {slug && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span>Workspace URL</span>
            </div>
            <div className="flex items-center h-9 rounded-md border bg-muted/40 px-3">
              <code className="text-xs text-foreground/70">
                agenthub.app/{slug}
              </code>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="ws-desc" className="text-sm font-medium">
            Description <Badge variant="secondary" className="text-[10px] ml-1.5">optional</Badge>
          </Label>
          <Input
            id="ws-desc"
            placeholder="What does your workspace do?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            disabled={submitting}
          />
        </div>

        {/* Issue Prefix */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="ws-prefix" className="text-sm font-medium">
              Issue Prefix
            </Label>
            <Hash className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="ws-prefix"
              placeholder="ISSUE"
              value={issuePrefix}
              onChange={(e) => setIssuePrefix(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-36 font-mono"
              disabled={submitting}
            />
            <span className="text-xs text-muted-foreground">
              Issues will be numbered like{' '}
              <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">
                {issuePrefix || 'ISSUE'}-1
              </code>
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={submitting}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit}
            className="gap-2 px-6"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
