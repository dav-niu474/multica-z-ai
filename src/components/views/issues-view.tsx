'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LayoutGrid,
  List,
  Plus,
  GripVertical,
  MessageSquare,
  ChevronDown,
  ArrowUpDown,
  Radio,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import IssueFormDialog from '@/components/issues/issue-form-dialog'
import IssueDetailPanel from '@/components/issues/issue-detail-panel'
import { useRealtime } from '@/lib/realtime-context'
import type { Issue, Agent, Project, IssueStatus, IssuePriority } from '@/types'

interface IssuesViewProps {
  workspaceId: string
}

const COLUMNS: { id: IssueStatus; label: string; color: string; dotColor: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'text-gray-500', dotColor: 'bg-gray-400' },
  { id: 'todo', label: 'Todo', color: 'text-sky-500', dotColor: 'bg-sky-500' },
  { id: 'in_progress', label: 'In Progress', color: 'text-amber-500', dotColor: 'bg-amber-500' },
  { id: 'in_review', label: 'In Review', color: 'text-violet-500', dotColor: 'bg-violet-500' },
  { id: 'done', label: 'Done', color: 'text-emerald-500', dotColor: 'bg-emerald-500' },
]

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string; dotColor: string }> = {
  none: { label: 'None', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dotColor: 'bg-gray-400' },
  low: { label: 'Low', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', dotColor: 'bg-sky-500' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dotColor: 'bg-amber-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dotColor: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500' },
}

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  todo: { label: 'Todo', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  in_review: { label: 'In Review', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  done: { label: 'Done', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

// Sortable Issue Card for Kanban
function SortableIssueCard({
  issue,
  agents,
  onClick,
}: {
  issue: Issue
  agents: Agent[]
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const assignee = issue.assigneeId
    ? issue.assigneeType === 'agent'
      ? agents.find((a) => a.id === issue.assigneeId)
      : { name: issue.assigneeId, avatar: null }
    : null

  const prioCfg = PRIORITY_CONFIG[issue.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          #{issue.id.slice(-6)}
        </div>
        {issue.priority !== 'none' && (
          <Badge variant="secondary" className={`${prioCfg.color} text-[10px] h-5 px-1.5`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${prioCfg.dotColor} mr-1`} />
            {prioCfg.label}
          </Badge>
        )}
      </div>

      <p className="text-sm font-medium mt-1.5 leading-snug line-clamp-2">
        {issue.title}
      </p>

      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {issue.labels.slice(0, 3).map((label) => (
            <span key={label} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
              {label}
            </span>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
              +{issue.labels.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5 pt-2 border-t">
        <div className="flex items-center gap-1.5">
          {assignee ? (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-muted">
                {assignee.avatar ? (
                  <img src={assignee.avatar} alt={assignee.name} className="h-5 w-5 rounded-full" />
                ) : (
                  assignee.name?.charAt(0) || '?'
                )}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="text-[10px] text-muted-foreground">Unassigned</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {issue._count?.comments ? (
            <span className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="h-3 w-3" />
              {issue._count.comments}
            </span>
          ) : null}
          <span className="text-[10px]">
            {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: false })}
          </span>
        </div>
      </div>

      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  )
}

export default function IssuesView({ workspaceId }: IssuesViewProps) {
  const { onEvent } = useRealtime()
  const [issues, setIssues] = useState<Issue[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pulseKey, setPulseKey] = useState(0)

  // List view filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'createdAt' | 'priority' | 'status'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const fetchData = useCallback(async () => {
    try {
      const [issuesRes, agentsRes, projectsRes] = await Promise.all([
        fetch(`/api/issues?workspaceId=${workspaceId}`),
        fetch(`/api/agents?workspaceId=${workspaceId}`),
        fetch(`/api/projects?workspaceId=${workspaceId}`),
      ])
      const [issuesData, agentsData, projectsData] = await Promise.all([
        issuesRes.json(),
        agentsRes.json(),
        projectsRes.json(),
      ])
      setIssues(issuesData)
      setAgents(agentsData)
      setProjects(projectsData)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Listen for realtime issue updates — smart re-fetch: only re-fetch issues list
  useEffect(() => {
    const unsub = onEvent('issue:updated', () => {
      // Smart re-fetch: only re-fetch issues, not agents/projects
      fetch(`/api/issues?workspaceId=${workspaceId}`)
        .then((res) => res.json())
        .then((data) => setIssues(data))
        .catch((err) => console.error('Realtime issue re-fetch error:', err))
      setPulseKey((k) => k + 1)
    })
    return unsub
  }, [onEvent, workspaceId])

  // Column mapping for Kanban
  const columnIssues = useMemo(() => {
    const map: Record<string, Issue[]> = {}
    COLUMNS.forEach((col) => {
      map[col.id] = issues.filter((i) => i.status === col.id)
    })
    return map
  }, [issues])

  // Find active issue for drag overlay
  const activeIssue = useMemo(
    () => (activeId ? issues.find((i) => i.id === activeId) : null),
    [activeId, issues]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeIssueData = issues.find((i) => i.id === active.id)
    if (!activeIssueData) return

    // Determine target column
    let targetStatus: IssueStatus | null = null

    // Check if dropped on a column droppable
    const overId = over.id as string
    if (COLUMNS.some((c) => c.id === overId)) {
      targetStatus = overId as IssueStatus
    } else {
      // Dropped on another card — use that card's status
      const overIssue = issues.find((i) => i.id === overId)
      if (overIssue) {
        targetStatus = overIssue.status
      }
    }

    if (targetStatus && targetStatus !== activeIssueData.status) {
      try {
        const res = await fetch(`/api/issues/${activeIssueData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus }),
        })
        if (res.ok) {
          setIssues((prev) =>
            prev.map((i) =>
              i.id === activeIssueData.id ? { ...i, status: targetStatus } : i
            )
          )
        }
      } catch (err) {
        console.error('Error updating issue status:', err)
      }
    }
  }

  // List view filtering & sorting
  const filteredIssues = useMemo(() => {
    let result = [...issues]

    if (statusFilter !== 'all') {
      result = result.filter((i) => i.status === statusFilter)
    }
    if (priorityFilter !== 'all') {
      result = result.filter((i) => i.priority === priorityFilter)
    }

    const priorityOrder: Record<IssuePriority, number> = {
      urgent: 5, high: 4, medium: 3, low: 2, none: 1,
    }

    result.sort((a, b) => {
      if (sortField === 'priority') {
        const diff = priorityOrder[a.priority] - priorityOrder[b.priority]
        return sortDir === 'desc' ? -diff : diff
      }
      if (sortField === 'status') {
        const statusOrder: Record<string, number> = {
          backlog: 1, todo: 2, in_progress: 3, in_review: 4, done: 5, cancelled: 6,
        }
        const diff = statusOrder[a.status] - statusOrder[b.status]
        return sortDir === 'asc' ? diff : -diff
      }
      // createdAt
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDir === 'desc' ? -diff : diff
    })

    return result
  }, [issues, statusFilter, priorityFilter, sortField, sortDir])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 min-w-[260px] space-y-3">
              <Skeleton className="h-6 w-24" />
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Live update indicator */}
      {pulseKey > 0 && (
        <div
          key={pulseKey}
          className="flex items-center gap-1.5 px-4 py-1 text-[10px] text-primary animate-in fade-in duration-300"
        >
          <Radio className="h-3 w-3 animate-pulse" />
          <span>Issue updated live</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Issues</h2>
          <Badge variant="secondary" className="text-xs">
            {issues.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'board' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5 rounded-r-none"
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Issue
          </Button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-4 overflow-x-auto flex-1 min-h-0">
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                className="flex flex-col min-w-[260px] max-w-[300px] w-[280px] flex-shrink-0"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <span className={`text-sm font-medium ${col.color}`}>{col.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {columnIssues[col.id]?.length || 0}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>

                {/* Cards */}
                <SortableContext
                  items={(columnIssues[col.id] || []).map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto rounded-lg bg-muted/30 p-2 relative">
                    {(columnIssues[col.id] || []).length === 0 && (
                      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                        No issues
                      </div>
                    )}
                    {(columnIssues[col.id] || []).map((issue) => (
                      <SortableIssueCard
                        key={issue.id}
                        issue={issue}
                        agents={agents}
                        onClick={() => setSelectedIssueId(issue.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeIssue ? (
              <div className="bg-card border rounded-lg p-3 shadow-lg w-[260px] opacity-90">
                <p className="text-sm font-medium">{activeIssue.title}</p>
                {activeIssue.priority !== 'none' && (
                  <Badge
                    variant="secondary"
                    className={`${PRIORITY_CONFIG[activeIssue.priority].color} text-[10px] h-5 px-1.5 mt-1.5`}
                  >
                    {PRIORITY_CONFIG[activeIssue.priority].label}
                  </Badge>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 p-4 pb-3">
            <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
            <div className="flex flex-wrap gap-1">
              <Button
                variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              {COLUMNS.map((col) => (
                <Button
                  key={col.id}
                  variant={statusFilter === col.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 text-xs ${statusFilter === col.id ? col.color : ''}`}
                  onClick={() => setStatusFilter(col.id)}
                >
                  {col.label}
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-4 mx-1" />

            <span className="text-xs font-medium text-muted-foreground mr-1">Priority:</span>
            <div className="flex flex-wrap gap-1">
              <Button
                variant={priorityFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPriorityFilter('all')}
              >
                All
              </Button>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <Button
                  key={key}
                  variant={priorityFilter === key ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPriorityFilter(key)}
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dotColor} mr-1`} />
                  {cfg.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-xs">ID</TableHead>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead
                    className="text-xs cursor-pointer select-none w-[120px]"
                    onClick={() => toggleSort('status')}
                  >
                    <span className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs cursor-pointer select-none w-[100px]"
                    onClick={() => toggleSort('priority')}
                  >
                    <span className="flex items-center gap-1">
                      Priority
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs w-[120px]">Assignee</TableHead>
                  <TableHead className="text-xs w-[120px]">Labels</TableHead>
                  <TableHead
                    className="text-xs cursor-pointer select-none w-[100px]"
                    onClick={() => toggleSort('createdAt')}
                  >
                    <span className="flex items-center gap-1">
                      Created
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                      No issues found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => {
                    const assignee = issue.assigneeId
                      ? issue.assigneeType === 'agent'
                        ? agents.find((a) => a.id === issue.assigneeId)
                        : { name: issue.assigneeId, avatar: null }
                      : null
                    const prioCfg = PRIORITY_CONFIG[issue.priority]
                    const statCfg = STATUS_CONFIG[issue.status]

                    return (
                      <TableRow
                        key={issue.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedIssueId(issue.id)}
                      >
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          #{issue.id.slice(-6)}
                        </TableCell>
                        <TableCell className="text-sm font-medium max-w-[300px]">
                          <span className="line-clamp-1">{issue.title}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${statCfg.color} text-[10px] h-5`}>
                            {statCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {issue.priority !== 'none' ? (
                            <Badge variant="secondary" className={`${prioCfg.color} text-[10px] h-5`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${prioCfg.dotColor} mr-1`} />
                              {prioCfg.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px] bg-muted">
                                  {'avatar' in assignee && assignee.avatar ? (
                                    <img src={assignee.avatar} alt={assignee.name} className="h-5 w-5 rounded-full" />
                                  ) : (
                                    assignee.name?.charAt(0) || '?'
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs truncate max-w-[80px]">{assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {issue.labels && issue.labels.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {issue.labels.slice(0, 2).map((l) => (
                                <span key={l} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                  {l}
                                </span>
                              ))}
                              {issue.labels.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">+{issue.labels.length - 2}</span>
                              )}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create Issue Dialog */}
      <IssueFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        workspaceId={workspaceId}
        agents={agents}
        projects={projects}
        onIssueCreated={fetchData}
      />

      {/* Issue Detail Panel */}
      <IssueDetailPanel
        issueId={selectedIssueId}
        open={!!selectedIssueId}
        onOpenChange={(open) => {
          if (!open) setSelectedIssueId(null)
        }}
        agents={agents}
        onIssueUpdated={fetchData}
      />
    </div>
  )
}
