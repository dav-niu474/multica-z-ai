'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'

interface CreateIssueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultData?: Record<string, unknown> | null
}

export function CreateIssueModal({ open, onOpenChange, defaultData }: CreateIssueModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'none' | 'low' | 'medium' | 'high' | 'urgent'>('none')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority: priority !== 'none' ? priority : undefined,
        }),
      })

      if (res.ok) {
        onOpenChange(false)
        setTitle('')
        setDescription('')
        setPriority('none')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to create issue')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Issue
          </DialogTitle>
          <DialogDescription>
            Add a new issue to your workspace
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="issue-title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue..."
              disabled={loading}
              className="h-10"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-desc" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="issue-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority</Label>
            <div className="flex flex-wrap gap-2">
              {(['none', 'low', 'medium', 'high', 'urgent'] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs capitalize"
                  onClick={() => setPriority(p)}
                  disabled={loading}
                >
                  {p === 'none' ? 'No Priority' : p}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Creating...</>
              ) : (
                <><Plus className="h-3.5 w-3.5 mr-1.5" /> Create Issue</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
