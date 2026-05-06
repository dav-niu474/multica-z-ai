'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow, isToday, isYesterday, subDays, format } from 'date-fns'
import {
  Inbox as InboxIcon,
  Archive,
  ArchiveRestore,
  CheckCheck,
  Filter,
  PartyPopper,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { InboxItem, InboxSeverity } from '@/types'
import { useWorkspace } from '@/hooks/use-workspace'
import { useTranslation } from '@/lib/i18n'

// ---- Severity Colors ----
const SEVERITY_DOT: Record<InboxSeverity, string> = {
  info: 'bg-sky-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
}

// ---- Group items by date ----
function groupByDate(items: InboxItem[]) {
  const today: InboxItem[] = []
  const yesterday: InboxItem[] = []
  const earlier: InboxItem[] = []

  items.forEach((item) => {
    const date = new Date(item.createdAt)
    if (isToday(date)) {
      today.push(item)
    } else if (isYesterday(date)) {
      yesterday.push(item)
    } else {
      earlier.push(item)
    }
  })

  return { today, yesterday, earlier }
}

// ---- Date Group Header ----
function DateGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
        {count}
      </Badge>
    </div>
  )
}

// ---- Inbox Item ----
function InboxItemRow({
  item,
  onRead,
  onArchive,
  onUnarchive,
}: {
  item: InboxItem
  onRead: (id: string) => void
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={`flex items-start gap-3 p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${
        !item.read ? 'bg-primary/5' : ''
      }`}
      onClick={() => {
        if (!item.read) onRead(item.id)
      }}
    >
      <div
        className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
          SEVERITY_DOT[item.severity]
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!item.read ? 'font-medium' : ''}`}>{item.title}</p>
        {item.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {item.body}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </p>
          {item.issueIdentifier && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0">
              {item.issueIdentifier}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {!item.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={t.inbox.markRead}
            onClick={(e) => {
              e.stopPropagation()
              onRead(item.id)
            }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </Button>
        )}
        {item.archived ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={t.inbox.unarchive}
            onClick={(e) => {
              e.stopPropagation()
              onUnarchive(item.id)
            }}
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={t.inbox.archive}
            onClick={(e) => {
              e.stopPropagation()
              onArchive(item.id)
            }}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ---- Main Component ----
export default function InboxView() {
  const { workspaceId, loading: wsLoading, error: wsError } = useWorkspace()
  const { t } = useTranslation()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const [deleteTarget, setDeleteTarget] = useState<InboxItem | null>(null)

  const fetchInbox = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/inbox?workspaceId=${workspaceId}`)
      if (!res.ok) throw new Error('Failed to fetch inbox')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : data.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    async function load() {
      try {
        setLoading(true)
        await fetchInbox()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceId, fetchInbox])

  const handleMarkRead = async (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))
    try {
      await fetch(`/api/inbox/${id}/read?workspaceId=${workspaceId}`, { method: 'POST' })
    } catch {
      // Optimistic update already applied
    }
  }

  const handleArchive = async (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, archived: true } : item)))
    try {
      await fetch(`/api/inbox/${id}/archive?workspaceId=${workspaceId}`, { method: 'POST' })
    } catch {
      // Optimistic
    }
  }

  const handleUnarchive = async (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, archived: false } : item)))
    try {
      await fetch(`/api/inbox/${id}/unarchive?workspaceId=${workspaceId}`, { method: 'POST' })
    } catch {
      // Optimistic
    }
  }

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    try {
      await fetch(`/api/inbox/mark-all-read?workspaceId=${workspaceId}`, { method: 'POST' })
    } catch {
      // Optimistic
    }
  }

  const handleArchiveAll = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, archived: true })))
    try {
      await fetch(`/api/inbox/archive-all?workspaceId=${workspaceId}`, { method: 'POST' })
    } catch {
      // Optimistic
    }
  }

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (filter === 'unread') return !item.read && !item.archived
    if (filter === 'archived') return item.archived
    return !item.archived
  })

  const unreadCount = items.filter((i) => !i.read && !i.archived).length
  const { today, yesterday, earlier } = groupByDate(filteredItems)
  const hasItems = today.length > 0 || yesterday.length > 0 || earlier.length > 0

  if (wsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <p className="text-sm text-destructive">{wsError}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium">{t.inbox.title}</h1>
          <p className="text-sm text-muted-foreground">{t.inbox.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="size-4 mr-1.5" />
              {t.inbox.markAllRead}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleArchiveAll}>
            <Archive className="size-4 mr-1.5" />
            {t.inbox.archiveAll}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">{t.inbox.all}</TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            {t.inbox.unread}
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">{t.inbox.archived}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <Card>
        {loading ? (
          <CardContent className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-1" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-7 w-7" />
                </div>
              ))}
            </div>
          </CardContent>
        ) : !hasItems ? (
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <PartyPopper className="size-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {filter === 'unread'
                  ? t.inbox.noUnread
                  : filter === 'archived'
                    ? t.inbox.noNotifications
                    : t.inbox.noUnread}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter === 'unread'
                  ? t.inbox.noUnreadDesc
                  : t.inbox.noNotificationsDesc}
              </p>
            </div>
          </CardContent>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {today.length > 0 && (
              <>
                <DateGroupHeader label={t.inbox.today} count={today.length} />
                {today.map((item) => (
                  <InboxItemRow
                    key={item.id}
                    item={item}
                    onRead={handleMarkRead}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                  />
                ))}
              </>
            )}
            {yesterday.length > 0 && (
              <>
                <DateGroupHeader label={t.inbox.yesterday} count={yesterday.length} />
                {yesterday.map((item) => (
                  <InboxItemRow
                    key={item.id}
                    item={item}
                    onRead={handleMarkRead}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                  />
                ))}
              </>
            )}
            {earlier.length > 0 && (
              <>
                <DateGroupHeader label={t.inbox.earlier} count={earlier.length} />
                {earlier.map((item) => (
                  <InboxItemRow
                    key={item.id}
                    item={item}
                    onRead={handleMarkRead}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
