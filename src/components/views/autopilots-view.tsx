'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Plus,
  Play,
  Power,
  PowerOff,
  Trash2,
  History,
  Calendar,
  Webhook,
  Zap,
  Bot,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type {
  Autopilot,
  AutopilotRun,
  AutopilotTriggerKind,
  AutopilotExecutionMode,
  Agent,
} from '@/types'
import { useWorkspace } from '@/hooks/use-workspace'
import { useTranslation } from '@/lib/i18n'

// ---- Run Status Config ----
const RUN_STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock className="size-3.5" />, color: 'text-amber-500' },
  running: { icon: <Loader2 className="size-3.5 animate-spin" />, color: 'text-sky-500' },
  completed: { icon: <CheckCircle2 className="size-3.5" />, color: 'text-emerald-500' },
  failed: { icon: <XCircle className="size-3.5" />, color: 'text-red-500' },
}

// ---- Trigger Icon ----
function TriggerIcon({ kind, cronExpression }: { kind: AutopilotTriggerKind; cronExpression?: string | null }) {
  if (kind === 'webhook') return <Webhook className="size-3.5 text-violet-500" />
  if (kind === 'api') return <Zap className="size-3.5 text-amber-500" />
  return <Calendar className="size-3.5 text-sky-500" />
}

// ---- Main Component ----
export default function AutopilotsView() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const { t } = useTranslation()
  const [autopilots, setAutopilots] = useState<Autopilot[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Autopilot | null>(null)
  const [historyAutopilot, setHistoryAutopilot] = useState<Autopilot | null>(null)
  const [runHistory, setRunHistory] = useState<AutopilotRun[]>([])

  // Form state
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formAgentId, setFormAgentId] = useState('')
  const [formTriggerKind, setFormTriggerKind] = useState<AutopilotTriggerKind>('schedule')
  const [formCron, setFormCron] = useState('')
  const [formExecutionMode, setFormExecutionMode] = useState<AutopilotExecutionMode>('run_only')
  const [submitting, setSubmitting] = useState(false)

  const fetchAutopilots = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/autopilots?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setAutopilots(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch autopilots:', err)
    }
  }, [workspaceId])

  const fetchAgents = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/agents?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setAgents(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    }
  }, [workspaceId])

  useEffect(() => {
    Promise.all([fetchAutopilots(), fetchAgents()]).finally(() => setLoading(false))
  }, [fetchAutopilots, fetchAgents])

  // Create handler
  const handleCreate = async () => {
    if (!formName || !formAgentId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/autopilots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc || null,
          agentId: formAgentId,
          executionMode: formExecutionMode,
          triggerKind: formTriggerKind,
          cronExpression: formTriggerKind === 'schedule' ? formCron : null,
          workspaceId,
        }),
      })
      if (res.ok) {
        await fetchAutopilots()
        setCreateOpen(false)
        resetForm()
      }
    } catch (err) {
      console.error('Failed to create autopilot:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/autopilots/${deleteTarget.id}?workspaceId=${workspaceId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setAutopilots((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      }
    } catch (err) {
      console.error('Failed to delete autopilot:', err)
    } finally {
      setDeleteTarget(null)
    }
  }

  // Toggle active
  const handleToggleActive = async (autopilot: Autopilot) => {
    try {
      const res = await fetch(`/api/autopilots/${autopilot.id}?workspaceId=${workspaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !autopilot.isActive }),
      })
      if (res.ok) {
        setAutopilots((prev) =>
          prev.map((a) =>
            a.id === autopilot.id ? { ...a, isActive: !a.isActive } : a
          )
        )
      }
    } catch (err) {
      console.error('Failed to toggle autopilot:', err)
    }
  }

  // Trigger manually
  const handleTriggerNow = async (autopilot: Autopilot) => {
    try {
      await fetch(`/api/autopilots/${autopilot.id}/trigger?workspaceId=${workspaceId}`, {
        method: 'POST',
      })
    } catch (err) {
      console.error('Failed to trigger autopilot:', err)
    }
  }

  // View run history
  const handleViewHistory = async (autopilot: Autopilot) => {
    setHistoryAutopilot(autopilot)
    try {
      const res = await fetch(
        `/api/autopilots/${autopilot.id}/runs?workspaceId=${workspaceId}`
      )
      if (res.ok) {
        const data = await res.json()
        setRunHistory(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch run history:', err)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormDesc('')
    setFormAgentId('')
    setFormTriggerKind('schedule')
    setFormCron('')
    setFormExecutionMode('run_only')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium">{t.autopilots.title}</h1>
          <p className="text-sm text-muted-foreground">{t.autopilots.subtitle}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1.5" />
          {t.autopilots.createAutopilot}
        </Button>
      </div>

      {/* Autopilots List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : autopilots.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <Calendar className="size-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t.autopilots.noAutopilots}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t.autopilots.noAutopilotsDesc}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4 mr-1" />
              {t.autopilots.createAutopilot}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {autopilots.map((autopilot) => {
            const trigger = autopilot.triggers?.[0]
            return (
              <Card key={autopilot.id} className="gap-0 py-0">
                <CardHeader className="px-4 pt-4 pb-2 gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex items-center justify-center size-9 rounded-lg bg-muted shrink-0">
                        {trigger ? (
                          <TriggerIcon kind={trigger.kind} />
                        ) : (
                          <Calendar className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm truncate">{autopilot.name}</CardTitle>
                        {autopilot.description && (
                          <CardDescription className="line-clamp-1 text-xs mt-0.5">
                            {autopilot.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          autopilot.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {autopilot.isActive ? t.autopilots.active : t.autopilots.inactive}
                      </Badge>
                      <Switch
                        checked={autopilot.isActive}
                        onCheckedChange={() => handleToggleActive(autopilot)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 flex flex-col gap-3">
                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Bot className="size-3" />
                      {autopilot.agentName || t.common.none}
                    </span>
                    {trigger && (
                      <span className="flex items-center gap-1.5">
                        <TriggerIcon kind={trigger.kind} />
                        {trigger.kind === 'schedule' && trigger.cronExpression
                          ? trigger.cronExpression
                          : trigger.kind === 'webhook'
                            ? 'Webhook'
                            : 'API'}
                      </span>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {autopilot.executionMode === 'create_issue'
                        ? t.autopilots.createIssue
                        : t.autopilots.runOnly}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleTriggerNow(autopilot)}
                      disabled={!autopilot.isActive}
                    >
                      <Play className="size-3 mr-1" />
                      {t.autopilots.triggerNow}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleViewHistory(autopilot)}
                    >
                      <History className="size-3 mr-1" />
                      {t.autopilots.runHistory}
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(autopilot)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Autopilot Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); resetForm() } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.autopilots.createAutopilotTitle}</DialogTitle>
            <DialogDescription>{t.autopilots.createAutopilotDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.autopilots.name} *</label>
              <Input
                placeholder={t.autopilots.namePlaceholder}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.autopilots.description}</label>
              <Textarea
                placeholder={t.autopilots.descriptionPlaceholder}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.autopilots.agent} *</label>
              <Select value={formAgentId} onValueChange={setFormAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.autopilots.chooseAgent} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.autopilots.trigger}</label>
                <Select value={formTriggerKind} onValueChange={(v) => setFormTriggerKind(v as AutopilotTriggerKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">
                      <span className="flex items-center gap-2">
                        <Calendar className="size-3.5" /> {t.autopilots.schedule}
                      </span>
                    </SelectItem>
                    <SelectItem value="webhook">
                      <span className="flex items-center gap-2">
                        <Webhook className="size-3.5" /> {t.autopilots.webhook}
                      </span>
                    </SelectItem>
                    <SelectItem value="api">
                      <span className="flex items-center gap-2">
                        <Zap className="size-3.5" /> {t.autopilots.api}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.autopilots.executionMode}</label>
                <Select value={formExecutionMode} onValueChange={(v) => setFormExecutionMode(v as AutopilotExecutionMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="run_only">{t.autopilots.runOnly}</SelectItem>
                    <SelectItem value="create_issue">{t.autopilots.createIssue}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formTriggerKind === 'schedule' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.autopilots.schedule}</label>
                <Input
                  placeholder={t.autopilots.cronPlaceholder}
                  value={formCron}
                  onChange={(e) => setFormCron(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreate} disabled={!formName || !formAgentId || submitting}>
              {submitting ? t.common.saving : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run History Sheet */}
      <Sheet open={!!historyAutopilot} onOpenChange={(open) => { if (!open) { setHistoryAutopilot(null); setRunHistory([]) } }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t.autopilots.runHistory}</SheetTitle>
            <SheetDescription>
              {historyAutopilot?.name}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {runHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t.autopilots.noRunHistory}
              </p>
            ) : (
              <div className="space-y-3">
                {runHistory.map((run) => {
                  const config = RUN_STATUS_CONFIG[run.status] ?? RUN_STATUS_CONFIG.pending
                  return (
                    <Card key={run.id} className="p-3 gap-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{config.icon}</span>
                          <span className="text-sm font-medium capitalize">{run.status}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {run.output && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {run.output}
                        </p>
                      )}
                      {run.error && (
                        <p className="text-xs text-red-500 mt-1.5 line-clamp-2">
                          {run.error}
                        </p>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.autopilots.deleteAutopilot}</DialogTitle>
            <DialogDescription>
              {t.autopilots.deleteAutopilotDesc.replace('{name}', deleteTarget?.name || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
