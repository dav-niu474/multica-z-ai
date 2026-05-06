'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  List,
  Plus,
  MessageSquare,
  Circle,
  CircleDot,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import IssueFormDialog from '@/components/issues/issue-form-dialog'
import IssueDetailPanel from '@/components/issues/issue-detail-panel'
import { useRealtime } from '@/lib/realtime-context'
import type { Issue, Agent, Project, IssueStatus, IssuePriority } from '@/types'
import { useWorkspace } from '@/hooks/use-workspace'
import { useTranslation } from '@/lib/i18n'
import {
  ISSUE_STATUS_COLORS,
  ISSUE_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '@/types'

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string; dotColor: string }> = {
  none: { label: 'None', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dotColor: 'bg-gray-400' },
  low: { label: 'Low', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', dotColor: 'bg-sky-500' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dotColor: 'bg-amber-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dotColor: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500' },
}

const ISSUE_STATUS_ICONS: Record<IssueStatus, React.ReactNode> = {
  backlog: <Circle className="size-3.5 text-gray-400" />,
  todo: <CircleDot className="size-3.5 text-sky-500" />,
  in_progress: <Loader2 className="size-3.5 text-amber-500" />,
  in_review: <AlertCircle className="size-3.5 text-violet-500" />,
  done: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  blocked: <XCircle className="size-3.5 text-red-400" />,
  cancelled: <XCircle className="size-3.5 text-red-400" />,
}

export default function MyIssuesView() {
  const { workspaceId } = useWorkspace()
  const { onEvent } = useRealtime()
  const { t } = useTranslation()
  const [issues, setIssues] = useState<Issue[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [issuesRes, agentsRes, projectsRes] = await Promise.all([
        fetch(`/api/issues?workspaceId=${workspaceId}&assigneeType=member`),
        fetch(`/api/agents?workspaceId=${workspaceId}`),
        fetch(`/api/projects?workspaceId=${workspaceId}`),
      ])
      const [issuesData, agentsData, projectsData] = await Promise.all([
        issuesRes.json(),
        agentsRes.json(),
        projectsRes.json(),
      ])
      setIssues(Array.isArray(issuesData) ? issuesData : issuesData.issues ?? [])
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

  useEffect(() => {
    const unsub = onEvent('issue:updated', () => {
      fetch(`/api/issues?workspaceId=${workspaceId}&assigneeType=member`)
        .then((res) => res.json())
        .then((data) => setIssues(Array.isArray(data) ? data : data.issues ?? []))
        .catch((err) => console.error('Error re-fetching my issues:', err))
    })
    return unsub
  }, [onEvent, workspaceId])

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredIssues = useMemo(() => {
    if (statusFilter === 'all') return issues
    return issues.filter((i) => i.status === statusFilter)
  }, [issues, statusFilter])

  const statuses: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done']

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium">{t.myIssues.title}</h1>
          <p className="text-sm text-muted-foreground">{t.myIssues.subtitle}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t.issues.createIssue}
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setStatusFilter('all')}
        >
          {t.common.all}
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1.5">
            {issues.length}
          </Badge>
        </Button>
        {statuses.map((status) => {
          const count = issues.filter((i) => i.status === status).length
          if (count === 0) return null
          return (
            <Button
              key={status}
              variant={statusFilter === status ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 text-xs gap-1 ${statusFilter === status ? ISSUE_STATUS_COLORS[status] : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {ISSUE_STATUS_ICONS[status]}
              {ISSUE_STATUS_LABELS[status]}
              <span className="text-[10px]">{count}</span>
            </Button>
          )
        })}
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-12">
          <List className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">{t.myIssues.noIssuesAssigned}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.myIssues.noIssuesAssignedDesc}</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-xs">ID</TableHead>
                <TableHead className="text-xs">{t.issues.titleHeader}</TableHead>
                <TableHead className="text-xs w-[100px]">{t.issues.statusHeader}</TableHead>
                <TableHead className="text-xs w-[100px]">{t.issues.priorityHeader}</TableHead>
                <TableHead className="text-xs w-[100px]">{t.common.project}</TableHead>
                <TableHead className="text-xs w-[100px]">{t.issues.createdHeader}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => {
                const prioCfg = PRIORITY_CONFIG[issue.priority]
                const project = issue.projectId
                  ? projects.find((p) => p.id === issue.projectId)
                  : null

                return (
                  <TableRow
                    key={issue.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedIssueId(issue.id)}
                  >
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {issue.identifier || `#${issue.id.slice(-6)}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ISSUE_STATUS_ICONS[issue.status as IssueStatus]}
                        <span className="text-sm font-medium truncate max-w-[300px]">
                          {issue.title}
                        </span>
                        {issue.commentCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {issue.commentCount}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${ISSUE_STATUS_COLORS[issue.status as IssueStatus]}`}
                      >
                        {ISSUE_STATUS_LABELS[issue.status as IssueStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {issue.priority !== 'none' ? (
                        <Badge
                          variant="secondary"
                          className={`${prioCfg.color} text-[10px]`}
                        >
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${prioCfg.dotColor} mr-1`} />
                          {prioCfg.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project ? (
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                          {project.title}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Issue Dialog */}
      <IssueFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        workspaceId={workspaceId ?? ''}
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
