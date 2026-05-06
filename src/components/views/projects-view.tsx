'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Circle,
  CircleDot,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  Project,
  ProjectStatus,
  IssuePriority,
  Issue,
  IssueStatus,
} from '@/types'
import {
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  ISSUE_STATUS_COLORS,
  ISSUE_STATUS_LABELS,
  PRIORITY_COLORS,
  ISSUE_PRIORITY_LABELS,
} from '@/types'

// Aliases for compatibility
const PRIORITY_LABELS = ISSUE_PRIORITY_LABELS
import { ProjectFormDialog } from '@/components/projects/project-form-dialog'

interface ProjectWithStats extends Project {
  statusCounts?: Record<string, number>
  totalIssues?: number
  issues?: { status: string }[]
  _count?: { issues: number }
}

interface ProjectIssuesViewProps {
  workspaceId: string
  onNavigateToIssue?: (issueId: string) => void
}

const ISSUE_STATUS_ICONS: Record<IssueStatus, React.ReactNode> = {
  backlog: <Circle className="size-3.5 text-gray-400" />,
  todo: <CircleDot className="size-3.5 text-sky-500" />,
  in_progress: <Loader2 className="size-3.5 text-amber-500" />,
  in_review: <AlertCircle className="size-3.5 text-violet-500" />,
  done: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  cancelled: <XCircle className="size-3.5 text-red-400" />,
}

export function ProjectsView({ workspaceId, onNavigateToIssue }: ProjectIssuesViewProps) {
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [projectIssues, setProjectIssues] = useState<Record<string, Issue[]>>({})
  const [loadingIssues, setLoadingIssues] = useState<string | null>(null)

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ProjectWithStats | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchProjects().finally(() => setLoading(false))
  }, [fetchProjects])

  // Fetch issues for a project
  const fetchProjectIssues = useCallback(
    async (projectId: string) => {
      if (projectIssues[projectId]) return
      setLoadingIssues(projectId)
      try {
        const res = await fetch(
          `/api/issues?workspaceId=${workspaceId}&projectId=${projectId}`
        )
        if (res.ok) {
          const data = await res.json()
          setProjectIssues((prev) => ({ ...prev, [projectId]: data }))
        }
      } catch (err) {
        console.error('Failed to fetch project issues:', err)
      } finally {
        setLoadingIssues(null)
      }
    },
    [workspaceId, projectIssues]
  )

  // Toggle project expansion
  const handleToggleExpand = async (projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null)
    } else {
      setExpandedProjectId(projectId)
      await fetchProjectIssues(projectId)
    }
  }

  // Submit handler
  const handleProjectSubmit = async (data: {
    title: string
    description: string
    icon: string
    status: ProjectStatus
    priority: IssuePriority
    workspaceId: string
  }) => {
    if (editingProject) {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update project')
    } else {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create project')
    }
    await fetchProjects()
    setEditingProject(null)
  }

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        if (expandedProjectId === deleteTarget.id) setExpandedProjectId(null)
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
    } finally {
      setDeleteTarget(null)
    }
  }

  // Calculate progress
  const getProgress = (project: ProjectWithStats) => {
    const total = project.totalIssues ?? project._count?.issues ?? 0
    const done = project.statusCounts?.done ?? 0
    return total > 0 ? Math.round((done / total) * 100) : 0
  }

  const getStatusCount = (project: ProjectWithStats, status: IssueStatus) => {
    return project.statusCounts?.[status] ?? 0
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Organize issues into projects and track team progress
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProject(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-64 mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="gap-4">
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <FolderKanban className="size-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a project to organize and track your team&apos;s issues
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-4 mr-1" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const progress = getProgress(project)
            const total = project.totalIssues ?? project._count?.issues ?? 0
            const isExpanded = expandedProjectId === project.id
            const issues = projectIssues[project.id] ?? []
            const isLoadingIssues = loadingIssues === project.id

            return (
              <div key={project.id} className="flex flex-col gap-0">
                <Card className="gap-0 py-0 hover:shadow-md transition-shadow group">
                  <CardHeader className="px-4 pt-4 pb-2 gap-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-muted text-xl shrink-0">
                          {project.icon || '📁'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {project.title}
                          </CardTitle>
                          {project.description && (
                            <CardDescription className="line-clamp-2 text-xs mt-0.5">
                              {project.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            setEditingProject(project)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(project)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 pb-4 flex flex-col gap-3">
                    {/* Status & Priority badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${PROJECT_STATUS_COLORS[project.status as ProjectStatus]}`}
                      >
                        {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${PRIORITY_COLORS[project.priority as IssuePriority]}`}
                      >
                        {PRIORITY_LABELS[project.priority as IssuePriority] ?? project.priority}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {total} {total === 1 ? 'issue' : 'issues'}
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    {/* Issue breakdown */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {getStatusCount(project, 'backlog') > 0 && (
                        <span className="flex items-center gap-1">
                          <Circle className="size-2.5 text-gray-400" />
                          {getStatusCount(project, 'backlog')} backlog
                        </span>
                      )}
                      {getStatusCount(project, 'todo') > 0 && (
                        <span className="flex items-center gap-1">
                          <CircleDot className="size-2.5 text-sky-500" />
                          {getStatusCount(project, 'todo')} todo
                        </span>
                      )}
                      {getStatusCount(project, 'in_progress') > 0 && (
                        <span className="flex items-center gap-1">
                          <Loader2 className="size-2.5 text-amber-500" />
                          {getStatusCount(project, 'in_progress')} active
                        </span>
                      )}
                      {getStatusCount(project, 'in_review') > 0 && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="size-2.5 text-violet-500" />
                          {getStatusCount(project, 'in_review')} review
                        </span>
                      )}
                      {getStatusCount(project, 'done') > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-2.5 text-emerald-500" />
                          {getStatusCount(project, 'done')} done
                        </span>
                      )}
                    </div>

                    {/* Expand button */}
                    {total > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => handleToggleExpand(project.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="size-3.5 mr-1" />
                            Hide Issues
                          </>
                        ) : (
                          <>
                            <ChevronRight className="size-3.5 mr-1" />
                            View Issues ({total})
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Expanded Issues List */}
                {isExpanded && (
                  <Card className="rounded-t-none border-t-0 gap-0 py-0">
                    <CardContent className="px-4 py-3">
                      {isLoadingIssues ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                          ))}
                        </div>
                      ) : issues.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No issues found
                        </p>
                      ) : (
                        <ScrollArea className="max-h-64">
                          <div className="flex flex-col gap-1">
                            {issues.map((issue) => (
                              <button
                                key={issue.id}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left w-full group/issue"
                                onClick={() => onNavigateToIssue?.(issue.id)}
                              >
                                {ISSUE_STATUS_ICONS[issue.status as IssueStatus]}
                                <span className="text-sm flex-1 truncate">
                                  {issue.title}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] shrink-0 ${
                                    PRIORITY_COLORS[issue.priority as IssuePriority]
                                  }`}
                                >
                                  {PRIORITY_LABELS[issue.priority as IssuePriority]}
                                </Badge>
                                <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover/issue:opacity-100 transition-opacity shrink-0" />
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Project Form Dialog - key forces remount when switching create/edit */}
      <ProjectFormDialog
        key={editingProject?.id ?? 'create-new'}
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        workspaceId={workspaceId}
        onSubmit={handleProjectSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? The issues in this
              project will not be deleted, but they will no longer be associated with this project.
            </DialogDescription>
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
  )
}
