// AgentHub - Type definitions matching Prisma schema

// ============ VIEW TYPES ============
export type ViewType = 'dashboard' | 'agents' | 'issues' | 'chat' | 'skills' | 'projects' | 'patterns' | 'settings'

// ============ BASE ============
export interface BaseRecord {
  id: string
  createdAt: string
  updatedAt: string
}

// ============ WORKSPACE ============
export interface Workspace extends BaseRecord {
  name: string
  slug: string
  description: string | null
  context: string | null
  icon: string | null
}

// ============ USER & MEMBER ============
export interface User extends BaseRecord {
  email: string
  name: string
  avatar: string | null
}

export interface Member extends BaseRecord {
  role: 'owner' | 'admin' | 'member'
  userId: string
  workspaceId: string
  user?: User
  workspace?: Workspace
}

// ============ AGENT ============
export type AgentProvider = 'claude' | 'codex' | 'openai' | 'gemini' | 'custom'
export type AgentStatus = 'idle' | 'working' | 'blocked' | 'error' | 'offline'
export type AgentVisibility = 'workspace' | 'private'

export interface Agent extends BaseRecord {
  name: string
  description: string | null
  avatar: string | null
  provider: AgentProvider
  instructions: string | null
  status: AgentStatus
  maxConcurrent: number
  visibility: AgentVisibility
  customEnv: string | null
  customArgs: string | null
  mcpConfig: string | null
  workspaceId: string
  skills?: AgentSkill[]
  _count?: {
    tasks: number
  }
}

// ============ SKILL ============
export type SkillCategory =
  | 'engineering'
  | 'testing'
  | 'review'
  | 'deployment'
  | 'custom'
  | 'security'
  | 'performance'
  | 'git'
  | 'documentation'

export interface Skill extends BaseRecord {
  name: string
  description: string | null
  content: string
  type: 'skill' | 'tool'
  category: SkillCategory | null
  source: string | null
  workspaceId: string
  agents?: AgentSkill[]
  _count?: {
    agents: number
  }
}

export interface AgentSkill {
  id: string
  agentId: string
  skillId: string
  createdAt: string
  agent?: {
    id: string
    name: string
    avatar: string | null
    provider: string
    status: string
  }
  skill?: Skill
}

// ============ ISSUE ============
export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
export type IssuePriority = 'none' | 'low' | 'medium' | 'high' | 'urgent'
export type AssigneeType = 'member' | 'agent'

export interface Issue extends BaseRecord {
  title: string
  description: string | null
  status: IssueStatus
  priority: IssuePriority
  order: number
  assigneeType: AssigneeType | null
  assigneeId: string | null
  creatorType: 'member' | 'agent'
  creatorId: string | null
  projectId: string | null
  dueDate: string | null
  labels: string[] | null
  workspaceId: string
  project?: { id: string; name: string; icon: string | null } | null
  comments?: { id: string }[]
  tasks?: { id: string; status: string }[]
  activity?: ActivityLog[]
}

// ============ COMMENT ============
export interface Comment extends BaseRecord {
  content: string
  authorType: 'member' | 'agent'
  authorId: string | null
  issueId: string
}

// ============ AGENT TASK ============
export type TaskStatus = 'queued' | 'dispatched' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface AgentTask extends BaseRecord {
  status: TaskStatus
  output: string | null
  tokensUsed: number
  startedAt: string | null
  completedAt: string | null
  agentId: string
  issueId: string | null
  chatSessionId: string | null
  agent?: Agent
  issue?: Issue
  chatSession?: ChatSession
}

// ============ PROJECT ============
export type ProjectStatus = 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

export interface Project extends BaseRecord {
  name: string
  description: string | null
  icon: string | null
  status: ProjectStatus
  priority: IssuePriority
  workspaceId: string
  issues?: { status: string }[]
  _count?: { issues: number }
  statusCounts?: Record<string, number>
  totalIssues?: number
}

// ============ CHAT SESSION ============
export interface ChatSession extends BaseRecord {
  title: string | null
  agentId: string | null
  unreadCount: number
  isArchived: boolean
  workspaceId: string
  messages?: ChatMessage[]
  tasks?: AgentTask[]
}

// ============ CHAT MESSAGE ============
export interface ChatMessage {
  id: string
  role: 'user' | 'agent' | 'system'
  content: string
  createdAt: string
  sessionId: string
}

// ============ ACTIVITY LOG ============
export interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId: string
  actorType: 'member' | 'agent' | 'system' | null
  actorId: string | null
  metadata: string | null
  createdAt: string
  issueId: string | null
}

// ============ DASHBOARD ============
export interface DashboardData {
  workspace: {
    id: string
    name: string
    slug: string
    _count: {
      members: number
      agents: number
      issues: number
      projects: number
      chatSessions: number
      skills: number
    }
  } | null
  overview: {
    totalIssues: number
    issueStatusCounts: Record<string, number>
    issuePriorityCounts: Record<string, number>
    agentStatusCounts: Record<string, number>
    taskStatusCounts: Record<string, number>
  }
  agents: Agent[]
  projects: Array<{
    id: string
    name: string
    icon: string | null
    status: string
    totalIssues: number
    doneIssues: number
    progress: number
  }>
  recentActivity: (ActivityLog & { issue?: { id: string; title: string; workspaceId: string } | null })[]
  activeTasks: Array<AgentTask & { agent?: { id: string; name: string; avatar: string | null; provider: string } | null }>
}

export interface DashboardStats {
  issueCounts: Record<IssueStatus, number>
  agentStatusCounts: Record<AgentStatus, number>
  taskStatusCounts: Record<TaskStatus, number>
  projectProgress: Array<{
    id: string
    name: string
    icon: string | null
    total: number
    done: number
    progress: number
  }>
  recentActivity: Array<ActivityLog & { actorName?: string }>
  activeTasks: Array<AgentTask & { agentName?: string; issueTitle?: string }>
}

// ============ VIEW PROPS ============
export interface WorkspaceContextValue {
  workspaceId: string
  workspaceName: string
}

// ============ COLOR MAPS ============
export const SKILL_CATEGORY_COLORS: Record<SkillCategory, string> = {
  engineering: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  testing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  review: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  deployment: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  custom: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  security: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  performance: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200',
  git: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  documentation: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

export const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  backlog: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  todo: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  in_review: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
}

export const PRIORITY_COLORS: Record<IssuePriority, string> = {
  none: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  low: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
}

// ============ LABELS ============
export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  engineering: 'Engineering',
  testing: 'Testing',
  review: 'Review',
  deployment: 'Deployment',
  custom: 'Custom',
  security: 'Security',
  performance: 'Performance',
  git: 'Git',
  documentation: 'Documentation',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
}

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}
