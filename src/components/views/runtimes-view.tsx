'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Monitor,
  Trash2,
  Wifi,
  WifiOff,
  Clock,
  Cpu,
  Globe,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AgentRuntime } from '@/types'
import { useWorkspace } from '@/hooks/use-workspace'
import { useTranslation } from '@/lib/i18n'

// ---- Health Status ----
type HealthStatus = 'online' | 'recently_lost' | 'offline'

function getHealthStatus(runtime: AgentRuntime): HealthStatus {
  if (!runtime.lastHeartbeat) return 'offline'
  const lastBeat = new Date(runtime.lastHeartbeat).getTime()
  const now = Date.now()
  const diffMs = now - lastBeat

  if (diffMs < 120_000) return 'online' // < 2 min
  if (diffMs < 86400_000) return 'recently_lost' // < 24 hours
  return 'offline'
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
}> = {
  online: {
    dotColor: 'bg-emerald-500',
    bgColor: 'border-l-emerald-500',
    label: 'online',
    icon: <Wifi className="size-3.5 text-emerald-500" />,
  },
  recently_lost: {
    dotColor: 'bg-amber-500',
    bgColor: 'border-l-amber-500',
    label: 'recently_lost',
    icon: <WifiOff className="size-3.5 text-amber-500" />,
  },
  offline: {
    dotColor: 'bg-gray-400',
    bgColor: 'border-l-gray-400',
    label: 'offline',
    icon: <WifiOff className="size-3.5 text-gray-400" />,
  },
}

// ---- Main Component ----
export default function RuntimesView() {
  const { workspaceId } = useWorkspace()
  const { t } = useTranslation()
  const [runtimes, setRuntimes] = useState<AgentRuntime[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AgentRuntime | null>(null)

  const fetchRuntimes = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/runtimes?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setRuntimes(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch runtimes:', err)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchRuntimes().finally(() => setLoading(false))

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRuntimes, 30_000)
    return () => clearInterval(interval)
  }, [fetchRuntimes])

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

  // Group by status
  const onlineRuntimes = runtimes.filter((r) => getHealthStatus(r) === 'online')
  const recentlyLostRuntimes = runtimes.filter((r) => getHealthStatus(r) === 'recently_lost')
  const offlineRuntimes = runtimes.filter((r) => getHealthStatus(r) === 'offline')

  // Runtime card renderer
  const renderRuntimeCard = (runtime: AgentRuntime) => {
    const health = getHealthStatus(runtime)
    const config = HEALTH_CONFIG[health]
    const deviceInfo = runtime.deviceInfo as Record<string, string> | null

    return (
      <Card key={runtime.id} className={`gap-0 py-0 border-l-4 ${config.bgColor}`}>
        <CardHeader className="px-4 pt-4 pb-2 gap-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center size-9 rounded-lg bg-muted shrink-0">
                <Monitor className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm truncate">
                  {runtime.agentName || runtime.provider || 'Unknown Runtime'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {runtime.provider && (
                    <span className="capitalize">{runtime.provider}</span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${config.dotColor}`} />
                <span className="text-xs text-muted-foreground capitalize">
                  {t.runtimes[config.label as keyof typeof t.runtimes]}
                </span>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">{t.runtimes.os}</span>
              <p className="font-medium mt-0.5">{runtime.os || '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.runtimes.cliVersion}</span>
              <p className="font-medium mt-0.5 font-mono">{runtime.cliVersion || '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.runtimes.lastHeartbeat}</span>
              <p className="font-medium mt-0.5">
                {formatHeartbeat(runtime.lastHeartbeat, t)}
              </p>
            </div>
            {deviceInfo?.hostname && (
              <div>
                <span className="text-muted-foreground">{t.runtimes.deviceInfo}</span>
                <p className="font-medium mt-0.5 truncate">{deviceInfo.hostname}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium">{t.runtimes.title}</h1>
          <p className="text-sm text-muted-foreground">{t.runtimes.subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setLoading(true); fetchRuntimes().finally(() => setLoading(false)) }}
        >
          <Loader2 className="size-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Status Summary */}
      {!loading && runtimes.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : runtimes.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <Monitor className="size-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t.runtimes.noRuntimes}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.runtimes.noRuntimesDesc}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Online */}
          {onlineRuntimes.length > 0 && (
            <div className="space-y-3">
              {onlineRuntimes.map(renderRuntimeCard)}
            </div>
          )}

          {/* Recently Lost */}
          {recentlyLostRuntimes.length > 0 && (
            <div className="space-y-3">
              {recentlyLostRuntimes.map(renderRuntimeCard)}
            </div>
          )}

          {/* Offline */}
          {offlineRuntimes.length > 0 && (
            <div className="space-y-3">
              {offlineRuntimes.map(renderRuntimeCard)}
            </div>
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
