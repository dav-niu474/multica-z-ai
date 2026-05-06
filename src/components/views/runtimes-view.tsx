'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Monitor,
  Trash2,
  Wifi,
  WifiOff,
  Loader2,
  Activity,
  Clock,
  AlertTriangle,
  Terminal,
  Circle,
  Server,
  Copy,
  Check,
  Info,
  Bot,
  Code2,
  Sparkles,
  Brain,
  Cpu,
  Flame,
  Globe,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { AgentRuntime, AgentTask } from '@/types'
import { useWorkspace } from '@/hooks/use-workspace'
import { useTranslation } from '@/lib/i18n'

// ---- Health Status ----
type HealthStatus = 'online' | 'recently_lost' | 'offline' | 'about_to_gc'

function getHealthStatus(runtime: AgentRuntime): HealthStatus {
  if (!runtime.lastHeartbeat) return 'offline'
  const lastBeat = new Date(runtime.lastHeartbeat).getTime()
  const now = Date.now()
  const diffMs = now - lastBeat

  if (diffMs < 45_000) return 'online'       // < 45s → green dot
  if (diffMs < 300_000) return 'recently_lost' // 45s-5min → yellow dot
  return 'offline'                             // 5min+ → gray dot
}

function formatHeartbeat(heartbeat: string | null, t: ReturnType<typeof useTranslation>['t']): string {
  if (!heartbeat) return t.runtimes.never
  const diffMs = Date.now() - new Date(heartbeat).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return t.runtimes.secondsAgo(diffSec)
  if (diffMin < 60) return t.runtimes.minutesAgo(diffMin)
  if (diffHour < 24) return t.runtimes.hoursAgo(diffHour)
  return t.runtimes.daysAgo(diffDay)
}

const HEALTH_CONFIG: Record<HealthStatus, {
  dotColor: string
  bgColor: string
  label: string
  icon: React.ReactNode
  textColor: string
}> = {
  online: {
    dotColor: 'bg-emerald-500',
    bgColor: 'border-l-emerald-500',
    label: 'online',
    icon: <Wifi className="size-3.5 text-emerald-500" />,
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  recently_lost: {
    dotColor: 'bg-amber-500',
    bgColor: 'border-l-amber-500',
    label: 'recentlyLost',
    icon: <WifiOff className="size-3.5 text-amber-500" />,
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  about_to_gc: {
    dotColor: 'bg-red-500',
    bgColor: 'border-l-red-500',
    label: 'aboutToGC',
    icon: <AlertTriangle className="size-3.5 text-red-500" />,
    textColor: 'text-red-600 dark:text-red-400',
  },
  offline: {
    dotColor: 'bg-gray-400',
    bgColor: 'border-l-gray-400',
    label: 'offline',
    icon: <WifiOff className="size-3.5 text-gray-400" />,
    textColor: 'text-gray-500 dark:text-gray-400',
  },
}

// ---- Provider-specific Icon ----
function ProviderIcon({ provider, size = 'size-3.5' }: { provider: string; size?: string }) {
  const iconColor: Record<string, string> = {
    claude: 'text-orange-500',
    codex: 'text-emerald-500',
    gemini: 'text-sky-500',
    openai: 'text-green-500',
    glm: 'text-violet-500',
    nvidia: 'text-lime-500',
    volcano: 'text-rose-500',
    anthropic: 'text-orange-500',
  }

  const iconClass = `${size} ${iconColor[provider] || 'text-muted-foreground'}`

  switch (provider) {
    case 'claude':
    case 'anthropic':
      return <Bot className={iconClass} />
    case 'codex':
      return <Code2 className={iconClass} />
    case 'gemini':
      return <Sparkles className={iconClass} />
    case 'openai':
      return <Brain className={iconClass} />
    case 'nvidia':
      return <Flame className={iconClass} />
    case 'glm':
      return <Globe className={iconClass} />
    default:
      return <Cpu className={iconClass} />
  }
}

// ---- Task Progress Item ----
function TaskProgressItem({ task }: { task: AgentTask }) {
  const { t } = useTranslation()

  const statusColor: Record<string, string> = {
    queued: 'text-amber-500',
    running: 'text-sky-500',
    completed: 'text-emerald-500',
    failed: 'text-red-500',
  }

  const statusLabel: Record<string, string> = {
    queued: t.runtimes.tasksQueued,
    running: t.runtimes.tasksRunning,
    completed: t.runtimes.tasksCompleted,
    failed: t.runtimes.tasksFailed,
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Circle className={`size-2 fill-current ${statusColor[task.status] || 'text-muted-foreground'}`} />
      <span className="text-muted-foreground truncate flex-1" title={task.kind || task.id}>
        {task.kind || `Task ${task.id.slice(0, 8)}`}
      </span>
      <span className={`shrink-0 ${statusColor[task.status] || ''}`}>
        {statusLabel[task.status] || task.status}
      </span>
    </div>
  )
}

// ---- Task Stats Badge ----
function TaskStatsBadge({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className={`h-5 px-1.5 text-[10px] gap-1 ${color}`}>
          {label} {count}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{label}: {count}</p>
      </TooltipContent>
    </Tooltip>
  )
}

// ---- Main Component ----
export default function RuntimesView() {
  const { workspaceId } = useWorkspace()
  const { t } = useTranslation()
  const [runtimes, setRuntimes] = useState<AgentRuntime[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AgentRuntime | null>(null)
  const [daemonStatus, setDaemonStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [daemonHealth, setDaemonHealth] = useState<Record<string, unknown> | null>(null)
  const [taskMap, setTaskMap] = useState<Record<string, AgentTask[]>>({})
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRuntimes = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/runtimes?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        const runtimeList = Array.isArray(data) ? data : []
        setRuntimes(runtimeList)

        // Fetch all tasks (queued + running) for each runtime
        const newTaskMap: Record<string, AgentTask[]> = {}
        for (const rt of runtimeList) {
          try {
            const taskRes = await fetch(`/api/runtimes/tasks?runtimeId=${rt.id}`)
            if (taskRes.ok) {
              const taskData = await taskRes.json()
              newTaskMap[rt.id] = (taskData.tasks || []).filter(
                (tk: AgentTask) => tk.status === 'queued' || tk.status === 'running'
              )
            }
          } catch {
            // Ignore task fetch errors
          }
        }
        setTaskMap(newTaskMap)
      }
    } catch (err) {
      console.error('Failed to fetch runtimes:', err)
    }
  }, [workspaceId])

  const checkDaemonHealth = useCallback(async () => {
    setDaemonStatus('checking')
    try {
      const res = await fetch('/health?XTransformPort=3031')
      if (res.ok) {
        const data = await res.json()
        setDaemonHealth(data)
        setDaemonStatus('connected')
      } else {
        setDaemonStatus('disconnected')
        setDaemonHealth(null)
      }
    } catch {
      setDaemonStatus('disconnected')
      setDaemonHealth(null)
    }
  }, [])

  useEffect(() => {
    fetchRuntimes().finally(() => setLoading(false))
    checkDaemonHealth()

    // Auto-refresh every 30 seconds
    refreshTimerRef.current = setInterval(() => {
      fetchRuntimes()
    }, 30_000)

    // Check daemon health every 60 seconds
    const daemonInterval = setInterval(checkDaemonHealth, 60_000)

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      clearInterval(daemonInterval)
    }
  }, [fetchRuntimes, checkDaemonHealth])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/runtimes/${deleteTarget.id}?workspaceId=${workspaceId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setRuntimes((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      }
    } catch (err) {
      console.error('Failed to delete runtime:', err)
    } finally {
      setDeleteTarget(null)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUuid(id)
    setTimeout(() => setCopiedUuid(null), 2000)
  }

  // Group by status
  const onlineRuntimes = runtimes.filter((r) => getHealthStatus(r) === 'online')
  const recentlyLostRuntimes = runtimes.filter((r) => getHealthStatus(r) === 'recently_lost')
  const offlineRuntimes = runtimes.filter((r) => getHealthStatus(r) === 'offline')

  // Group runtimes by daemon UUID
  const daemonGroups = new Map<string, AgentRuntime[]>()
  for (const rt of runtimes) {
    const key = rt.daemonUuid || 'unknown'
    if (!daemonGroups.has(key)) daemonGroups.set(key, [])
    daemonGroups.get(key)!.push(rt)
  }

  // Daemon status indicator
  const daemonStatusDot = {
    checking: 'bg-amber-500 animate-pulse',
    connected: 'bg-emerald-500',
    disconnected: 'bg-gray-400',
  }

  const daemonStatusLabel = {
    checking: t.runtimes.checking,
    connected: t.runtimes.connected,
    disconnected: t.runtimes.disconnected,
  }

  // Runtime card renderer
  const renderRuntimeCard = (runtime: AgentRuntime) => {
    const health = getHealthStatus(runtime)
    const config = HEALTH_CONFIG[health]
    const deviceInfo = runtime.deviceInfo as Record<string, string> | null
    const activeTasks = taskMap[runtime.id] || []
    const agentName = (runtime as AgentRuntime & { agent?: { name: string } }).agent?.name
      || runtime.agentName
      || null

    // Count active tasks by status
    const queuedCount = activeTasks.filter((t) => t.status === 'queued').length
    const runningCount = activeTasks.filter((t) => t.status === 'running').length

    return (
      <Card key={runtime.id} className={`gap-0 py-0 border-l-4 ${config.bgColor} transition-colors`}>
        <CardHeader className="px-4 pt-4 pb-2 gap-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center size-9 rounded-lg bg-muted shrink-0">
                {runtime.provider ? <ProviderIcon provider={runtime.provider} size="size-4" /> : <Monitor className="size-4 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm truncate">
                  {agentName || runtime.provider || 'Unknown Runtime'}
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1.5">
                  <ProviderIcon provider={runtime.provider || ''} size="size-3" />
                  <span className="capitalize">{runtime.provider}</span>
                  {runtime.os && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span>{runtime.os.split(' ')[0]}</span>
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${config.dotColor} ${health === 'online' ? 'animate-pulse' : ''}`} />
                <span className={`text-xs capitalize ${config.textColor}`}>
                  {t.runtimes[config.label as keyof typeof t.runtimes]}
                </span>
              </div>
              {/* Live task count badges */}
              <div className="flex items-center gap-1">
                {runningCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-0.5 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                        <Activity className="size-2.5" />
                        {runningCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{runningCount} running</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {queuedCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        <Clock className="size-2.5" />
                        {queuedCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{queuedCount} queued</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(runtime)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {/* Connection info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div>
              <span className="text-muted-foreground">{t.runtimes.lastHeartbeat}</span>
              <p className="font-medium mt-0.5">
                {formatHeartbeat(runtime.lastHeartbeat, t)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.runtimes.os}</span>
              <p className="font-medium mt-0.5 truncate">{runtime.os || '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.runtimes.cliVersion}</span>
              <p className="font-medium mt-0.5 font-mono">{runtime.cliVersion || '—'}</p>
            </div>
            {deviceInfo?.hostname && (
              <div>
                <span className="text-muted-foreground">{t.runtimes.hostname}</span>
                <p className="font-medium mt-0.5 truncate">{deviceInfo.hostname}</p>
              </div>
            )}
          </div>

          {/* Daemon UUID */}
          {runtime.daemonUuid && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Server className="size-3" />
              <span className="font-mono truncate">{runtime.daemonUuid.slice(0, 12)}...</span>
              <button
                onClick={() => copyToClipboard(runtime.daemonUuid!, runtime.id)}
                className="shrink-0 hover:text-foreground transition-colors"
              >
                {copiedUuid === runtime.id ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          )}

          {/* Device details (if online) */}
          {health === 'online' && deviceInfo && Object.keys(deviceInfo).length > 1 && (
            <div className="bg-muted/50 rounded-md px-3 py-2 mb-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {deviceInfo.arch && (
                  <span>{t.runtimes.arch}: <span className="font-medium text-foreground">{deviceInfo.arch}</span></span>
                )}
                {deviceInfo.cpu && (
                  <span>{t.runtimes.cpu}: <span className="font-medium text-foreground">{deviceInfo.cpu}</span></span>
                )}
              </div>
            </div>
          )}

          {/* Running tasks */}
          {activeTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium mb-1.5">
                <Activity className="size-3 text-sky-500" />
                <span>{t.runtimes.runningTasks}</span>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {activeTasks.length}
                </Badge>
              </div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {activeTasks.map((task) => (
                  <TaskProgressItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Empty state with setup instructions
  const renderEmptyState = () => (
    <Card>
      <CardContent className="py-12 flex flex-col items-center gap-4 text-center max-w-lg mx-auto">
        <div className="flex items-center justify-center size-16 rounded-2xl bg-muted">
          <Monitor className="size-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{t.runtimes.noRuntimes}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.runtimes.noRuntimesDesc}</p>
        </div>
        <Separator className="my-1" />
        <div className="text-xs text-left text-muted-foreground space-y-2 w-full">
          <p className="font-medium text-foreground flex items-center gap-1.5">
            <Info className="size-3.5" />
            Setup Instructions
          </p>
          <p>{t.runtimes.noRuntimesStep1}</p>
          <p>{t.runtimes.noRuntimesStep2}</p>
          <p>{t.runtimes.noRuntimesStep3}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${daemonStatusDot[daemonStatus]}`} />
          <span className="text-xs text-muted-foreground">
            {t.runtimes.daemonStatus}: {daemonStatusLabel[daemonStatus]}
          </span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-medium">{t.runtimes.title}</h1>
            <p className="text-sm text-muted-foreground">{t.runtimes.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Daemon Status Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={checkDaemonHealth}
                >
                  <Terminal className="size-3.5" />
                  <span className="hidden sm:inline">{t.runtimes.daemonStatus}</span>
                  <div className={`h-2 w-2 rounded-full ${daemonStatusDot[daemonStatus]}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {daemonStatus === 'connected' && daemonHealth && (
                  <div className="text-xs space-y-1">
                    <p>Daemon: {String((daemonHealth as Record<string, unknown>).daemonUuid)?.slice(0, 8)}</p>
                    <p>Runtimes: {String((daemonHealth as Record<string, unknown>).runtimes?.length || 0)}</p>
                    <p>Running Tasks: {String((daemonHealth as Record<string, unknown>).runningTasks || 0)}</p>
                    <p>Tasks Processed: {String((daemonHealth as Record<string, unknown>).tasksProcessed || 0)}</p>
                    <p>Uptime: {Math.round(Number((daemonHealth as Record<string, unknown>).uptime || 0))}s</p>
                  </div>
                )}
                {daemonStatus === 'disconnected' && (
                  <p className="text-xs">Daemon service is not reachable</p>
                )}
                {daemonStatus === 'checking' && (
                  <p className="text-xs">Checking daemon status...</p>
                )}
              </TooltipContent>
            </Tooltip>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLoading(true); fetchRuntimes().finally(() => setLoading(false)) }}
            >
              <Loader2 className="size-4 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        {!loading && runtimes.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {t.runtimes.online}: {onlineRuntimes.length}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              {t.runtimes.recentlyLost}: {recentlyLostRuntimes.length}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
              {t.runtimes.offline}: {offlineRuntimes.length}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3" />
              {t.runtimes.autoRefresh}
            </span>
          </div>
        )}

        {/* Daemon Health Card (shown when connected) */}
        {daemonStatus === 'connected' && daemonHealth && !loading && runtimes.length > 0 && (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3 text-xs">
                <Terminal className="size-4 text-emerald-500" />
                <div className="flex-1">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {t.runtimes.daemonStatus}: {t.runtimes.connected}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    UUID: {String((daemonHealth as Record<string, unknown>).daemonUuid)?.slice(0, 8)}... ·
                    Uptime: {Math.round(Number((daemonHealth as Record<string, unknown>).uptime || 0))}s ·
                    Runtimes: {String((daemonHealth as Record<string, unknown>).runtimes?.length || 0)} ·
                    Tasks Processed: {String((daemonHealth as Record<string, unknown>).tasksProcessed || 0)}
                  </span>
                </div>
                <Badge variant="secondary" className="h-5 text-[10px]">
                  port 3031
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : runtimes.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-6">
            {/* Online */}
            {onlineRuntimes.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>{t.runtimes.online} ({onlineRuntimes.length})</span>
                </div>
                {onlineRuntimes.map(renderRuntimeCard)}
              </section>
            )}

            {/* Recently Lost */}
            {recentlyLostRuntimes.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>{t.runtimes.recentlyLost} ({recentlyLostRuntimes.length})</span>
                </div>
                {recentlyLostRuntimes.map(renderRuntimeCard)}
              </section>
            )}

            {/* Offline */}
            {offlineRuntimes.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                  <span>{t.runtimes.offline} ({offlineRuntimes.length})</span>
                </div>
                {offlineRuntimes.map(renderRuntimeCard)}
              </section>
            )}
          </div>
        )}

        {/* Delete Confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.runtimes.deleteRuntime}</DialogTitle>
              <DialogDescription>{t.runtimes.deleteRuntimeDesc}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
