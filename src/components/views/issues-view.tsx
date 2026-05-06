'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  GripVertical,
  MessageSquare,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Radio,
  Circle,
  CircleDashed,
  Loader,
  Eye,
  CheckCircle2,
  ShieldAlert,
  XCircle,
  Filter,
  X,
  UserCircle,
  Calendar,
  Trash2,
  FolderOpen,
} from 'lucide-react'
import { formatDistanceToNow, isPast, format } from 'date-fns'
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
import type { LucideIcon } from 'lucide-react'
import IssueFormDialog from '@/components/issues/issue-form-dialog'
import IssueDetailPanel from '@/components/issues/issue-detail-panel'
import { useRealtime } from '@/lib/realtime-context'
import { useTranslation } from '@/lib/i18n'
import { useIssueSelectionStore } from '@/store/issue-selection-store'
import type {
  Issue,
  Agent,
  Project,
  IssueStatus,
  IssuePriority,
  Label,
} from '@/types'

// ==================== Type Definitions ====================

interface IssuesViewProps {
  workspaceId: string
}

interface IssuesFilters {
  status: IssueStatus | null
  priority: IssuePriority | null
  assigneeType: IssueAssigneeFilter | null
  projectId: string | null
  search: string
}

type IssueAssigneeFilter = 'member' | 'agent' | 'unassigned' | null
type SortField = 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'dueDate'
type SortOrder = 'asc' | 'desc'

// ==================== Status & Priority Configuration ====================

const STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; color: string; bgColor: string; textColor: string; dotColor: string; icon: LucideIcon }
> = {
  backlog: {
    label: 'Backlog',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-900/30',
    textColor: 'text-gray-700 dark:text-gray-300',
    dotColor: 'bg-gray-400',
    icon: Circle,
  },
  todo: {
    label: 'To Do',
    color: 'text-sky-500',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    textColor: 'text-sky-700 dark:text-sky-300',
    dotColor: 'bg-sky-500',
    icon: CircleDashed,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    icon: Loader,
  },
  in_review: {
    label: 'In Review',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-700 dark:text-purple-300',
    dotColor: 'bg-purple-500',
    icon: Eye,
  },
  done: {
    label: 'Done',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  blocked: {
    label: 'Blocked',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    dotColor: 'bg-red-500',
    icon: ShieldAlert,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    textColor: 'text-gray-500 dark:text-gray-400',
    dotColor: 'bg-gray-300',
    icon: XCircle,
  },
}

const BOARD_STATUSES: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done']

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string; bgColor: string; dotColor: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30', dotColor: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950/30', dotColor: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30', dotColor: 'bg-amber-500' },
  low: { label: 'Low', color: 'text-sky-500', bgColor: 'bg-sky-50 dark:bg-sky-950/30', dotColor: 'bg-sky-500' },
  none: { label: 'No Priority', color: 'text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-900/20', dotColor: 'bg-gray-400' },
}

const ALL_STATUSES: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled']
const ALL_PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low', 'none']

const DEFAULT_FILTERS: IssuesFilters = {
  status: null,
  priority: null,
  assigneeType: null,
  projectId: null,
  search: '',
}

// ==================== Helpers ====================

function getLabelDisplay(label: unknown): { key: string; name: string; color: string } | null {
  if (typeof label === 'string') return { key: label, name: label, color: '#6b7280' }
  if (typeof label === 'object' && label !== null && 'name' in label) {
    const l = label as Label
    return { key: l.id, name: l.name, color: l.color || '#6b7280' }
  }
  return null
}

function hasActiveFilters(filters: IssuesFilters): boolean {
  return !!(filters.status || filters.priority || filters.assigneeType || filters.projectId || filters.search)
}

function renderSortIcon(sortField: SortField, field: SortField, sortOrder: SortOrder) {
  if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />
  return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
}

// ==================== IssuesHeader Component ====================

function IssuesHeader({
  viewMode,
  onViewModeChange,
  searchInput,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  projects,
  onCreateIssue,
  issueCount,
  filteredCount,
}: {
  viewMode: 'board' | 'list'
  onViewModeChange: (mode: 'board' | 'list') => void
  searchInput: string
  onSearchChange: (value: string) => void
  filters: IssuesFilters
  onFilterChange: (filters: IssuesFilters) => void
  onClearFilters: () => void
  projects: Project[]
  onCreateIssue: () => void
  issueCount: number
  filteredCount: number
}) {
  const { t } = useTranslation()
  const showFiltered = hasActiveFilters(filters)

  return (
    <div className="flex flex-col gap-3 p-4 pb-3 border-b bg-background">
      {/* Row 1: Title + Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t.issues.title}</h2>
          <Badge variant="secondary" className="text-xs tabular-nums">
            {showFiltered ? `${filteredCount}/${issueCount}` : issueCount}
          </Badge>
          {showFiltered && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onClearFilters}>
              <X className="h-3 w-3 mr-1" />
              {t.issues.clearFilters}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) onViewModeChange(value as 'board' | 'list')
            }}
            className="border"
          >
            <ToggleGroupItem value="board" className="px-2.5 h-8" aria-label={t.issues.boardView}>
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="px-2.5 h-8" aria-label={t.issues.listView}>
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* New Issue button */}
          <Button size="sm" onClick={onCreateIssue}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t.issues.createIssue}
          </Button>
        </div>
      </div>

      {/* Row 2: Search + Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.issues.searchPlaceholder}
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
          {searchInput && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 gap-1.5 ${filters.status ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <Filter className="h-3.5 w-3.5" />
              {t.issues.filterByStatus}
              {filters.status && <Badge variant="secondary" className="ml-1 h-5 text-[10px] px-1.5">{STATUS_CONFIG[filters.status].label}</Badge>}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{t.issues.filterByStatus}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filters, status: null })}
              className={filters.status === null ? 'bg-accent' : ''}
            >
              <span className="flex items-center gap-2">
                {filters.status === null && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                {filters.status === null ? <span className="w-3.5" /> : <span className="w-3.5" />}
                {t.common.all}
              </span>
            </DropdownMenuItem>
            {ALL_STATUSES.map((status) => {
              const cfg = STATUS_CONFIG[status]
              const StatusIcon = cfg.icon
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onFilterChange({ ...filters, status: filters.status === status ? null : status })}
                  className={filters.status === status ? 'bg-accent' : ''}
                >
                  <span className="flex items-center gap-2">
                    {filters.status === status ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <span className="w-3.5 flex justify-center">
                        <StatusIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </span>
                    )}
                    {cfg.label}
                  </span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 gap-1.5 ${filters.priority ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <Filter className="h-3.5 w-3.5" />
              {t.issues.filterByPriority}
              {filters.priority && <Badge variant="secondary" className="ml-1 h-5 text-[10px] px-1.5">{PRIORITY_CONFIG[filters.priority].label}</Badge>}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{t.issues.filterByPriority}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filters, priority: null })}
              className={filters.priority === null ? 'bg-accent' : ''}
            >
              <span className="flex items-center gap-2">
                {filters.priority === null && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                {filters.priority === null ? <span className="w-3.5" /> : <span className="w-3.5" />}
                {t.common.all}
              </span>
            </DropdownMenuItem>
            {ALL_PRIORITIES.map((priority) => {
              const cfg = PRIORITY_CONFIG[priority]
              return (
                <DropdownMenuItem
                  key={priority}
                  onClick={() => onFilterChange({ ...filters, priority: filters.priority === priority ? null : priority })}
                  className={filters.priority === priority ? 'bg-accent' : ''}
                >
                  <span className="flex items-center gap-2">
                    {filters.priority === priority ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <span className="w-3.5 flex justify-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${cfg.dotColor}`} />
                      </span>
                    )}
                    {cfg.label}
                  </span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Assignee filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 gap-1.5 ${filters.assigneeType ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <UserCircle className="h-3.5 w-3.5" />
              {t.issues.filterByAssignee}
              {filters.assigneeType && (
                <Badge variant="secondary" className="ml-1 h-5 text-[10px] px-1.5">
                  {filters.assigneeType === 'agent' ? t.issues.assignedToAgent : t.issues.assignedToMember}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>{t.issues.filterByAssignee}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filters, assigneeType: null })}
              className={filters.assigneeType === null ? 'bg-accent' : ''}
            >
              <span className="flex items-center gap-2">
                {filters.assigneeType === null && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                {filters.assigneeType === null ? <span className="w-3.5" /> : <span className="w-3.5" />}
                {t.common.all}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filters, assigneeType: filters.assigneeType === 'unassigned' ? null : 'unassigned' })}
              className={filters.assigneeType === 'unassigned' ? 'bg-accent' : ''}
            >
              <span className="flex items-center gap-2">
                {filters.assigneeType === 'unassigned' ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <span className="w-3.5" />}
                {t.issues.unassigned}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filters, assigneeType: filters.assigneeType === 'agent' ? null : 'agent' })}
              className={filters.assigneeType === 'agent' ? 'bg-accent' : ''}
            >
              <span className="flex items-center gap-2">
                {filters.assigneeType === 'agent' ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <span className="w-3.5" />}
                {t.issues.assignedToAgent}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filters, assigneeType: filters.assigneeType === 'member' ? null : 'member' })}
              className={filters.assigneeType === 'member' ? 'bg-accent' : ''}
            >
              <span className="flex items-center gap-2">
                {filters.assigneeType === 'member' ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <span className="w-3.5" />}
                {t.issues.assignedToMember}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Project filter */}
        {projects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 gap-1.5 ${filters.projectId ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {t.issues.filterByProject}
                {filters.projectId && (
                  <Badge variant="secondary" className="ml-1 h-5 text-[10px] px-1.5">
                    {projects.find((p) => p.id === filters.projectId)?.title || '...'}
                  </Badge>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{t.issues.filterByProject}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onFilterChange({ ...filters, projectId: null })}
                className={filters.projectId === null ? 'bg-accent' : ''}
              >
                <span className="flex items-center gap-2">
                  {filters.projectId === null && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  {filters.projectId === null ? <span className="w-3.5" /> : <span className="w-3.5" />}
                  {t.common.all}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onFilterChange({ ...filters, projectId: filters.projectId === project.id ? null : project.id })}
                  className={filters.projectId === project.id ? 'bg-accent' : ''}
                >
                  <span className="flex items-center gap-2">
                    {filters.projectId === project.id ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <span className="w-3.5" />
                    )}
                    {project.icon && <span className="text-sm">{project.icon}</span>}
                    {project.title}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

// ==================== IssueCard Component (Board) ====================

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
      : { name: issue.assigneeName || issue.assigneeId, avatar: null as string | null }
    : null

  const prioCfg = PRIORITY_CONFIG[issue.priority]

  const labelDisplays = (issue.labels || []).map(getLabelDisplay).filter(Boolean) as { key: string; name: string; color: string }[]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all group relative"
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Identifier + Priority */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-mono text-muted-foreground">
          {issue.identifier || `#${issue.id.slice(-6)}`}
        </span>
        {issue.priority !== 'none' && (
          <Badge variant="secondary" className={`${prioCfg.bgColor} ${prioCfg.color} text-[10px] h-5 px-1.5 border-0`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${prioCfg.dotColor} mr-1`} />
            {prioCfg.label}
          </Badge>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">{issue.title}</p>

      {/* Labels */}
      {labelDisplays.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-2">
          {labelDisplays.slice(0, 3).map((label) => (
            <Badge
              key={label.key}
              variant="outline"
              className="text-[10px] h-5 px-1.5 py-0 border-current/20"
              style={{ borderColor: label.color, color: label.color, backgroundColor: `${label.color}10` }}
            >
              {label.name}
            </Badge>
          ))}
          {labelDisplays.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{labelDisplays.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: Assignee + Comments + Time */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-1.5">
          {assignee ? (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-muted">
                {'avatar' in assignee && assignee.avatar ? (
                  <img src={assignee.avatar} alt={assignee.name} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  assignee.name?.charAt(0)?.toUpperCase() || '?'
                )}
              </AvatarFallback>
            </Avatar>
          ) : (
            <UserCircle className="h-4 w-4 text-muted-foreground/40" />
          )}
          {assignee && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{assignee.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {issue.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="h-3 w-3" />
              {issue.commentCount}
            </span>
          )}
          <span className="text-[10px]">
            {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: false })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ==================== Board Column Component ====================

function BoardColumn({
  status,
  issues,
  agents,
  onIssueClick,
}: {
  status: IssueStatus
  issues: Issue[]
  agents: Agent[]
  onIssueClick: (issue: Issue) => void
}) {
  const cfg = STATUS_CONFIG[status]
  const StatusIcon = cfg.icon

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-[290px] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 tabular-nums">
            {issues.length}
          </Badge>
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto rounded-lg bg-muted/30 p-2 custom-scrollbar">
          {issues.length === 0 && (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
              {cfg.label} — empty
            </div>
          )}
          {issues.map((issue) => (
            <SortableIssueCard
              key={issue.id}
              issue={issue}
              agents={agents}
              onClick={() => onIssueClick(issue)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// ==================== BoardView Component ====================

function BoardView({
  issues,
  agents,
  workspaceId,
  onIssueClick,
  onStatusChange,
}: {
  issues: Issue[]
  agents: Agent[]
  workspaceId: string
  onIssueClick: (issue: Issue) => void
  onStatusChange: (issueId: string, newStatus: IssueStatus) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const columnIssues = useMemo(() => {
    const map: Record<string, Issue[]> = {}
    BOARD_STATUSES.forEach((status) => {
      map[status] = issues.filter((i) => i.status === status)
    })
    return map
  }, [issues])

  const activeIssue = useMemo(
    () => (activeId ? issues.find((i) => i.id === activeId) : null),
    [activeId, issues]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const draggedIssue = issues.find((i) => i.id === active.id)
    if (!draggedIssue) return

    let targetStatus: IssueStatus | null = null
    const overId = over.id as string

    if (BOARD_STATUSES.includes(overId as IssueStatus)) {
      targetStatus = overId as IssueStatus
    } else {
      const overIssue = issues.find((i) => i.id === overId)
      if (overIssue) targetStatus = overIssue.status
    }

    if (targetStatus && targetStatus !== draggedIssue.status) {
      onStatusChange(draggedIssue.id, targetStatus)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="flex-1">
        <div className="flex gap-4 p-4 min-h-[400px]">
          {BOARD_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              issues={columnIssues[status] || []}
              agents={agents}
              onIssueClick={onIssueClick}
            />
          ))}
        </div>
      </ScrollArea>

      <DragOverlay>
        {activeIssue ? (
          <div className="bg-card border rounded-lg p-3 shadow-xl w-[260px] opacity-90">
            <p className="text-sm font-medium">{activeIssue.title}</p>
            {activeIssue.priority !== 'none' && (
              <Badge
                variant="secondary"
                className={`${PRIORITY_CONFIG[activeIssue.priority].bgColor} ${PRIORITY_CONFIG[activeIssue.priority].color} text-[10px] h-5 px-1.5 mt-1.5 border-0`}
              >
                {PRIORITY_CONFIG[activeIssue.priority].label}
              </Badge>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ==================== BatchActionBar Component ====================

function BatchActionBar({
  selectedIds,
  issues,
  onClearSelection,
  onBatchStatusChange,
  onBatchPriorityChange,
  onBatchDelete,
}: {
  selectedIds: Set<string>
  issues: Issue[]
  onClearSelection: () => void
  onBatchStatusChange: (status: IssueStatus) => void
  onBatchPriorityChange: (priority: IssuePriority) => void
  onBatchDelete: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-popover border rounded-xl shadow-lg px-4 py-2.5 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <span className="text-sm font-medium">{t.issues.selectedCount(selectedIds.size)}</span>
      <Separator orientation="vertical" className="h-5" />

      <Select onValueChange={(value) => onBatchStatusChange(value as IssueStatus)}>
        <SelectTrigger size="sm" className="w-[140px] h-8 text-xs">
          <SelectValue placeholder={t.issues.batchChangeStatus} />
        </SelectTrigger>
        <SelectContent>
          {ALL_STATUSES.map((status) => (
            <SelectItem key={status} value={status} className="text-xs">
              <span className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${STATUS_CONFIG[status].dotColor}`} />
                {STATUS_CONFIG[status].label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={(value) => onBatchPriorityChange(value as IssuePriority)}>
        <SelectTrigger size="sm" className="w-[140px] h-8 text-xs">
          <SelectValue placeholder={t.issues.batchChangePriority} />
        </SelectTrigger>
        <SelectContent>
          {ALL_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority} className="text-xs">
              <span className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${PRIORITY_CONFIG[priority].dotColor}`} />
                {PRIORITY_CONFIG[priority].label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-5" />

      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-destructive hover:text-destructive"
        onClick={onBatchDelete}
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        {t.issues.batchDelete}
      </Button>

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearSelection}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ==================== ListView Component ====================

function ListView({
  issues,
  agents,
  projects,
  sortField,
  sortOrder,
  onSortChange,
  onIssueClick,
}: {
  issues: Issue[]
  agents: Agent[]
  projects: Project[]
  sortField: SortField
  sortOrder: SortOrder
  onSortChange: (field: SortField) => void
  onIssueClick: (issue: Issue) => void
}) {
  const { t } = useTranslation()
  const { selectedIds, toggle, isSelected, selectAll, clear } = useIssueSelectionStore()
  const lastClickedRef = useRef<string | null>(null)

  const allSelected = issues.length > 0 && issues.every((i) => isSelected(i.id))

  const handleCheckboxClick = (e: React.MouseEvent, issue: Issue) => {
    e.stopPropagation()

    if (e.shiftKey && lastClickedRef.current) {
      // Shift+click range select
      const lastIdx = issues.findIndex((i) => i.id === lastClickedRef.current)
      const currentIdx = issues.findIndex((i) => i.id === issue.id)
      if (lastIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(lastIdx, currentIdx)
        const end = Math.max(lastIdx, currentIdx)
        for (let i = start; i <= end; i++) {
          if (!isSelected(issues[i].id)) {
            toggle(issues[i].id)
          }
        }
      }
    } else {
      toggle(issue.id)
    }
    lastClickedRef.current = issue.id
  }

  const handleSelectAll = () => {
    if (allSelected) {
      clear()
    } else {
      selectAll(issues.map((i) => i.id))
    }
  }

  const getProjectTitle = (projectId: string | null) => {
    if (!projectId) return null
    const project = projects.find((p) => p.id === projectId)
    return project?.title || null
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {selectedIds.size > 0 && (
        <BatchActionBar
          selectedIds={selectedIds}
          issues={issues}
          onClearSelection={clear}
          onBatchStatusChange={async (status) => {
            const ids = Array.from(selectedIds)
            await Promise.all(ids.map((id) => fetch(`/api/issues/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            })))
            clear()
          }}
          onBatchPriorityChange={async (priority) => {
            const ids = Array.from(selectedIds)
            await Promise.all(ids.map((id) => fetch(`/api/issues/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ priority }),
            })))
            clear()
          }}
          onBatchDelete={async () => {
            const ids = Array.from(selectedIds)
            await Promise.all(ids.map((id) => fetch(`/api/issues/${id}`, { method: 'DELETE' })))
            clear()
          }}
        />
      )}

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px] p-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label={t.issues.selectAll}
                />
              </TableHead>
              <TableHead className="w-[100px] p-3 text-xs font-medium text-muted-foreground">
                {t.issues.id}
              </TableHead>
              <TableHead className="p-3 text-xs font-medium text-muted-foreground min-w-[200px]">
                {t.issues.titleHeader}
              </TableHead>
              <TableHead className="w-[110px] p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => onSortChange('status')}>
                <span className="flex items-center gap-1">{t.issues.statusHeader}{renderSortIcon(sortField, 'status', sortOrder)}</span>
              </TableHead>
              <TableHead className="w-[100px] p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => onSortChange('priority')}>
                <span className="flex items-center gap-1">{t.issues.priorityHeader}{renderSortIcon(sortField, 'priority', sortOrder)}</span>
              </TableHead>
              <TableHead className="w-[130px] p-3 text-xs font-medium text-muted-foreground">
                {t.issues.assigneeHeader}
              </TableHead>
              <TableHead className="w-[110px] p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                {t.issues.projectHeader}
              </TableHead>
              <TableHead className="w-[100px] p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                {t.issues.labelsHeader}
              </TableHead>
              <TableHead className="w-[90px] p-3 text-xs font-medium text-muted-foreground hidden xl:table-cell cursor-pointer select-none" onClick={() => onSortChange('dueDate')}>
                <span className="flex items-center gap-1">{t.issues.dueDateHeader}{renderSortIcon(sortField, 'dueDate', sortOrder)}</span>
              </TableHead>
              <TableHead className="w-[100px] p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => onSortChange('updatedAt')}>
                <span className="flex items-center gap-1">{t.issues.updatedHeader}{renderSortIcon(sortField, 'updatedAt', sortOrder)}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t.issues.noIssuesFound}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              issues.map((issue) => {
                const statCfg = STATUS_CONFIG[issue.status]
                const prioCfg = PRIORITY_CONFIG[issue.priority]
                const assignee = issue.assigneeId
                  ? issue.assigneeType === 'agent'
                    ? agents.find((a) => a.id === issue.assigneeId)
                    : { name: issue.assigneeName || issue.assigneeId, avatar: null as string | null }
                  : null
                const projectTitle = getProjectTitle(issue.projectId)
                const labelDisplays = (issue.labels || []).map(getLabelDisplay).filter(Boolean) as { key: string; name: string; color: string }[]
                const checked = isSelected(issue.id)
                const isOverdue = issue.dueDate && isPast(new Date(issue.dueDate)) && issue.status !== 'done'

                return (
                  <TableRow
                    key={issue.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${checked ? 'bg-primary/5' : ''}`}
                    onClick={() => onIssueClick(issue)}
                  >
                    <TableCell className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(issue.id)}
                        aria-label={`Select ${issue.identifier}`}
                      />
                    </TableCell>
                    <TableCell className="p-3 text-xs font-mono text-muted-foreground">
                      {issue.identifier || `#${issue.id.slice(-6)}`}
                    </TableCell>
                    <TableCell className="p-3">
                      <span className="text-sm font-medium line-clamp-1">{issue.title}</span>
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge variant="secondary" className={`${statCfg.bgColor} ${statCfg.textColor} text-[10px] h-5 border-0`}>
                        {statCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3">
                      {issue.priority !== 'none' ? (
                        <Badge variant="secondary" className={`${prioCfg.bgColor} ${prioCfg.color} text-[10px] h-5 border-0`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${prioCfg.dotColor} mr-1`} />
                          {prioCfg.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3">
                      {assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-muted">
                              {'avatar' in assignee && assignee.avatar ? (
                                <img src={assignee.avatar} alt={assignee.name} className="h-5 w-5 rounded-full object-cover" />
                              ) : (
                                assignee.name?.charAt(0)?.toUpperCase() || '?'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate max-w-[80px]">{assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t.issues.unassigned}</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 hidden lg:table-cell">
                      {projectTitle ? (
                        <span className="text-xs text-muted-foreground truncate block max-w-[100px]">{projectTitle}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 hidden md:table-cell">
                      {labelDisplays.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {labelDisplays.slice(0, 2).map((label) => (
                            <Badge
                              key={label.key}
                              variant="outline"
                              className="text-[10px] h-5 px-1.5 py-0"
                              style={{ borderColor: label.color, color: label.color }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                          {labelDisplays.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{labelDisplays.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 hidden xl:table-cell">
                      {issue.dueDate ? (
                        <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          {format(new Date(issue.dueDate), 'MMM d')}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ==================== Loading Skeleton ====================

function IssuesLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 flex-1 max-w-xs" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex gap-4 mt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 min-w-[260px] space-y-3">
            <Skeleton className="h-5 w-24" />
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== Main IssuesView Component ====================

export default function IssuesView({ workspaceId }: IssuesViewProps) {
  const { t } = useTranslation()
  const { onEvent } = useRealtime()
  const { clear: clearSelection } = useIssueSelectionStore()

  // Data state
  const [issues, setIssues] = useState<Issue[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [pulseKey, setPulseKey] = useState(0)

  // Filters & search
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<IssuesFilters>({ ...DEFAULT_FILTERS })

  // Sort
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Search debounce
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
  }, [])

  // Fetch data
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
      setIssues(Array.isArray(issuesData) ? issuesData : issuesData?.issues || [])
      setAgents(Array.isArray(agentsData) ? agentsData : [])
      setProjects(Array.isArray(projectsData) ? projectsData : [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime updates
  useEffect(() => {
    const unsub = onEvent('issue:updated', () => {
      fetch(`/api/issues?workspaceId=${workspaceId}`)
        .then((res) => res.json())
        .then((data) => setIssues(Array.isArray(data) ? data : data?.issues || []))
        .catch((err) => console.error('Realtime re-fetch error:', err))
      setPulseKey((k) => k + 1)
    })
    return unsub
  }, [onEvent, workspaceId])

  // Handle status change (for DnD)
  const handleStatusChange = useCallback(async (issueId: string, newStatus: IssueStatus) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)))
      }
    } catch (err) {
      console.error('Error updating issue status:', err)
    }
  }, [])

  // Filtering
  const filteredIssues = useMemo(() => {
    let result = [...issues]

    // Search
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          (i.identifier || '').toLowerCase().includes(query) ||
          (i.description || '').toLowerCase().includes(query) ||
          (i.assigneeName || '').toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filters.status) {
      result = result.filter((i) => i.status === filters.status)
    }

    // Priority filter
    if (filters.priority) {
      result = result.filter((i) => i.priority === filters.priority)
    }

    // Assignee type filter
    if (filters.assigneeType === 'unassigned') {
      result = result.filter((i) => !i.assigneeId)
    } else if (filters.assigneeType) {
      result = result.filter((i) => i.assigneeType === filters.assigneeType)
    }

    // Project filter
    if (filters.projectId) {
      result = result.filter((i) => i.projectId === filters.projectId)
    }

    return result
  }, [issues, debouncedSearch, filters])

  // Sorting (list view only)
  const sortedIssues = useMemo(() => {
    if (viewMode !== 'list') return filteredIssues

    const result = [...filteredIssues]
    const priorityOrder: Record<IssuePriority, number> = { urgent: 5, high: 4, medium: 3, low: 2, none: 1 }
    const statusOrder: Record<string, number> = { backlog: 1, todo: 2, in_progress: 3, in_review: 4, done: 5, blocked: 6, cancelled: 7 }

    result.sort((a, b) => {
      let diff = 0
      switch (sortField) {
        case 'priority':
          diff = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'status':
          diff = statusOrder[a.status] - statusOrder[b.status]
          break
        case 'createdAt':
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'dueDate': {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          diff = aDate - bDate
          break
        }
        case 'updatedAt':
        default:
          diff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }
      return sortOrder === 'asc' ? diff : -diff
    })

    return result
  }, [filteredIssues, viewMode, sortField, sortOrder])

  const handleSortChange = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortOrder('desc')
      }
    },
    [sortField]
  )

  const handleIssueClick = useCallback((issue: Issue) => {
    setSelectedIssueId(issue.id)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS })
    setSearchInput('')
    setDebouncedSearch('')
  }, [])

  // Render
  if (loading) {
    return <IssuesLoadingSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Realtime pulse indicator */}
      {pulseKey > 0 && (
        <div
          key={pulseKey}
          className="flex items-center gap-1.5 px-4 py-1 text-[10px] text-primary animate-in fade-in duration-300"
        >
          <Radio className="h-3 w-3 animate-pulse" />
          <span>{t.issues.issueUpdatedLive}</span>
        </div>
      )}

      {/* Header */}
      <IssuesHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
        projects={projects}
        onCreateIssue={() => setShowCreateDialog(true)}
        issueCount={issues.length}
        filteredCount={filteredIssues.length}
      />

      {/* Board View */}
      {viewMode === 'board' && (
        <BoardView
          issues={filteredIssues}
          agents={agents}
          workspaceId={workspaceId}
          onIssueClick={handleIssueClick}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <ListView
          issues={sortedIssues}
          agents={agents}
          projects={projects}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onIssueClick={handleIssueClick}
        />
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
