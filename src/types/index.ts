// AgentHub - Comprehensive Type Definitions
// Foundation layer types matching the Multica reference architecture

// ============ Workspace & User ============
export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  onboardedAt: string | null
  createdAt: string
  updatedAt: string
}

export type MemberRole = 'owner' | 'admin' | 'member'

export interface Member {
  id: string
  userId: string
  workspaceId: string
  role: MemberRole
  createdAt: string
  user?: User
}

export interface MemberWithUser extends Member {
  user: User
}

export interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  context: string | null
  icon: string | null
  issuePrefix: string
  createdAt: string
  updatedAt: string
}

export interface Invitation {
  id: string
  workspaceId: string
  email: string
  role: MemberRole
  invitedBy: string
  status: 'pending' | 'accepted' | 'declined'
  expiresAt: string | null
  createdAt: string
  workspace?: Workspace
  invitedByUser?: User
}

// ============ Issue System ============
export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled'
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type IssueAssigneeType = 'member' | 'agent' | null

export interface Issue {
  id: string
  identifier: string // e.g., "AH-1"
  title: string
  description: string | null
  status: IssueStatus
  priority: IssuePriority
  assigneeType: IssueAssigneeType
  assigneeId: string | null
  assigneeName: string | null
  projectId: string | null
  parentIssueId: string | null
  position: number
  dueDate: string | null
  labels: Label[]
  reactions: IssueReaction[]
  subscriberCount: number
  commentCount: number
  taskCount: number
  workspaceId: string
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface IssueReaction {
  emoji: string
  userId: string
  userName: string
}

// ============ Project ============
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived'
export type ProjectPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

export interface Project {
  id: string
  title: string
  description: string | null
  icon: string | null
  status: ProjectStatus
  priority: ProjectPriority
  issueCount: number
  doneCount: number
  leadType: 'member' | 'agent' | null
  leadId: string | null
  workspaceId: string
  createdAt: string
  updatedAt: string
}

export interface ProjectResource {
  id: string
  projectId: string
  type: string // 'github_repo' | etc
  name: string
  url: string
  createdAt: string
}

// ============ Agent System ============
export type AgentStatus = 'idle' | 'working' | 'blocked' | 'error' | 'offline'
export type AgentRuntimeMode = 'local' | 'cloud'
export type AgentVisibility = 'workspace' | 'private'
export type AgentProvider = 'claude' | 'codex' | 'openai' | 'gemini' | 'custom' | 'nvidia' | 'glm' | 'volcano' | 'anthropic'

export interface AgentFormData {
  name: string
  description: string
  provider: AgentProvider
  instructions: string
  maxConcurrent: number
  visibility: AgentVisibility
  skillIds: string[]
}

export interface Agent {
  id: string
  name: string
  description: string | null
  provider: string
  instructions: string | null
  status: AgentStatus
  maxConcurrentTasks: number
  visibility: AgentVisibility
  model: string | null
  mcpConfig: Record<string, unknown> | null
  isArchived: boolean
  ownerId: string | null
  workspaceId: string
  skills: AgentSkill[]
  createdAt: string
  updatedAt: string
  _count?: { tasks: number; skills: number }
}

export interface AgentSkill {
  id: string
  agentId: string
  skillId: string
  createdAt: string
  skill: Skill
  agent?: Agent
}

export interface AgentTask {
  id: string
  agentId: string
  issueId: string | null
  chatSessionId: string | null
  autopilotRunId: string | null
  status: 'queued' | 'dispatched' | 'running' | 'completed' | 'failed' | 'cancelled'
  priority: IssuePriority
  output: string | null
  failureReason: string | null
  tokensUsed: number
  elapsedMs: number | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  kind: string | null
  retries: number
}

// ============ Skills ============
export type SkillType = 'skill' | 'tool'

export interface Skill {
  id: string
  name: string
  description: string | null
  content: string | null
  type: SkillType
  category: string | null
  source: string | null
  workspaceId: string
  agentCount: number
  createdAt: string
  updatedAt: string
}

export interface SkillFile {
  id: string
  skillId: string
  name: string
  path: string
  content: string
  createdAt: string
}

// ============ Chat System ============
export interface ChatSession {
  id: string
  title: string
  agentId: string | null
  agentName?: string | null
  status: string
  hasUnread?: boolean
  unreadCount: number
  isArchived: boolean
  messageCount?: number
  workspaceId: string
  createdAt: string
  updatedAt: string
  messages?: ChatMessage[]
  _count?: { messages: number }
  tasks?: Array<{
    id: string
    status: string
    agent?: { id: string; name: string; provider: string }
  }>
}

export type ChatMessageRole = 'user' | 'assistant' | 'agent' | 'system'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  taskId?: string | null
  failureReason?: string | null
  elapsedMs?: number | null
  createdAt: string
  sessionId?: string
}

export interface ChatPendingTask {
  taskId: string
  issueId: string | null
  issueIdentifier: string | null
  issueTitle: string | null
  status: 'queued' | 'dispatched' | 'running' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
}

// ============ Comments ============
export type CommentType = 'comment' | 'status_change' | 'progress_update' | 'system'
export type CommentAuthorType = 'member' | 'agent' | 'system'

export interface Comment {
  id: string
  content: string
  type: CommentType
  authorType: CommentAuthorType
  authorId: string
  authorName: string
  authorAvatar: string | null
  parentId: string | null
  issueId: string
  workspaceId: string
  reactions: Reaction[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface Reaction {
  emoji: string
  userId: string
  userName: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  mimeType: string
  createdAt: string
}

// ============ Labels ============
export interface Label {
  id: string
  name: string
  color: string
  workspaceId: string
  createdAt: string
}

// ============ Inbox ============
export type InboxSeverity = 'info' | 'warning' | 'error'
export type InboxItemType =
  | 'issue_assigned'
  | 'issue_mentioned'
  | 'comment_replied'
  | 'issue_status_changed'
  | 'issue_due_soon'
  | 'task_completed'
  | 'task_failed'
  | 'member_joined'
  | 'member_left'
  | 'invitation_received'
  | 'agent_status_changed'
  | 'autopilot_run'
  | 'workspace_updated'
  | 'skill_updated'
  | 'runtime_offline'
  | 'review_requested'
  | 'issue_unblocked'
  | 'issue_reopened'

export interface InboxItem {
  id: string
  type: InboxItemType
  severity: InboxSeverity
  title: string
  body: string | null
  recipientType: 'member' | 'agent'
  recipientId: string
  issueId: string | null
  issueIdentifier: string | null
  issueTitle: string | null
  read: boolean
  archived: boolean
  workspaceId: string
  createdAt: string
}

// ============ Autopilot ============
export type AutopilotExecutionMode = 'create_issue' | 'run_only'
export type AutopilotTriggerKind = 'schedule' | 'webhook' | 'api'
export type AutopilotRunStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface Autopilot {
  id: string
  name: string
  description: string | null
  agentId: string
  agentName: string | null
  executionMode: AutopilotExecutionMode
  isActive: boolean
  workspaceId: string
  triggers: AutopilotTrigger[]
  createdAt: string
  updatedAt: string
}

export interface AutopilotTrigger {
  id: string
  autopilotId: string
  kind: AutopilotTriggerKind
  cronExpression: string | null
  webhookToken: string | null
  isActive: boolean
  createdAt: string
}

export interface AutopilotRun {
  id: string
  autopilotId: string
  status: AutopilotRunStatus
  triggerKind: AutopilotTriggerKind
  output: string | null
  error: string | null
  startedAt: string
  completedAt: string | null
  createdAt: string
}

// ============ Runtime ============
export interface AgentRuntime {
  id: string
  agentId: string
  agentName: string | null
  provider: string | null
  status: string
  deviceInfo: Record<string, unknown> | null
  os: string | null
  cliVersion: string | null
  daemonUuid: string | null
  lastHeartbeat: string | null
  workspaceId: string
  createdAt: string
  updatedAt: string
}

// ============ Activity & Timeline ============
export interface TimelineEntry {
  id: string
  type: string
  action: string
  entityType: string
  entityId: string
  actorType: CommentAuthorType
  actorId: string
  actorName: string
  actorAvatar: string | null
  details: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  issueId: string
  workspaceId: string
  createdAt: string
  // Joined fields for comments
  content?: string | null
  commentType?: CommentType | null
  reactions?: Reaction[]
}

// ============ Pinned Items ============
export type PinnedItemType = 'issue' | 'project'

export interface PinnedItem {
  id: string
  type: PinnedItemType
  itemId: string
  order: number
  workspaceId: string
  createdAt: string
  // Joined fields
  issue?: { id: string; identifier: string; title: string; status: IssueStatus }
  project?: { id: string; title: string; status: ProjectStatus; issueCount: number; doneCount: number }
}

// ============ Dashboard ============
export interface DashboardOverview {
  totalIssues: number
  openIssues: number
  inProgressIssues: number
  issueStatusCounts: Record<IssueStatus, number>
  taskStatusCounts: Record<string, number>
}

export interface DashboardData {
  overview: DashboardOverview
  recentActivity: TimelineEntry[]
  agents: (Agent & { _count?: { tasks: number } })[]
  completedThisWeek: number
  blockedIssues: number
}

export interface DashboardStats {
  totalIssues: number
  openIssues: number
  completedIssues: number
  totalAgents: number
  activeAgents: number
  totalProjects: number
  recentActivity: TimelineEntry[]
  issueStatusBreakdown: Record<IssueStatus, number>
  issuePriorityBreakdown: Record<IssuePriority, number>
}

// ============ API Types ============
export interface CreateIssueRequest {
  title: string
  description?: string
  status?: IssueStatus
  priority?: IssuePriority
  assigneeType?: IssueAssigneeType
  assigneeId?: string
  projectId?: string
  parentIssueId?: string
  dueDate?: string
  labelIds?: string[]
}

export interface UpdateIssueRequest extends Partial<CreateIssueRequest> {
  status?: IssueStatus
}

export interface ListIssuesParams {
  status?: IssueStatus
  priority?: IssuePriority
  assigneeType?: IssueAssigneeType
  projectId?: string
  search?: string
  labelIds?: string[]
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ListIssuesResponse {
  issues: Issue[]
  total: number
  page: number
  limit: number
}

export interface CreateProjectRequest {
  title: string
  description?: string
  icon?: string
  priority?: ProjectPriority
}

export interface CreateAgentRequest {
  name: string
  description?: string
  provider?: string
  instructions?: string
  model?: string
  maxConcurrentTasks?: number
  visibility?: AgentVisibility
  skillIds?: string[]
}

export interface CreateAutopilotRequest {
  name: string
  description?: string
  agentId: string
  executionMode: AutopilotExecutionMode
  triggerKind: AutopilotTriggerKind
  cronExpression?: string
}

export interface PersonalAccessToken {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

// ============ View Types ============
export type ViewType =
  | 'dashboard'
  | 'agents'
  | 'issues'
  | 'chat'
  | 'skills'
  | 'projects'
  | 'patterns'
  | 'settings'
  | 'inbox'
  | 'autopilots'
  | 'runtimes'
  | 'my-issues'
  | 'members'

// ============ Config Types ============
export interface StatusConfig {
  label: string
  color: string
  bgColor: string
  iconColor: string
  hoverBg: string
  dividerColor?: string
  columnBg?: string
}

export interface PriorityConfig {
  label: string
  color: string
  bgColor: string
  icon: string
}

// ============ WS Event Types ============
export type WSEventType =
  | 'issue:created'
  | 'issue:updated'
  | 'issue:deleted'
  | 'issue_labels:changed'
  | 'comment:created'
  | 'comment:updated'
  | 'comment:deleted'
  | 'agent:status'
  | 'agent:created'
  | 'agent:archived'
  | 'agent:restored'
  | 'task:queued'
  | 'task:dispatch'
  | 'task:progress'
  | 'task:completed'
  | 'task:failed'
  | 'task:cancelled'
  | 'task:message'
  | 'chat:message'
  | 'chat:done'
  | 'chat:session_read'
  | 'inbox:new'
  | 'inbox:read'
  | 'inbox:archived'
  | 'inbox:batch_read'
  | 'inbox:batch_archived'
  | 'workspace:updated'
  | 'workspace:deleted'
  | 'member:added'
  | 'member:updated'
  | 'member:removed'
  | 'project:created'
  | 'project:updated'
  | 'project:deleted'
  | 'label:created'
  | 'label:updated'
  | 'label:deleted'
  | 'skill:created'
  | 'skill:updated'
  | 'skill:deleted'
  | 'pin:created'
  | 'pin:deleted'
  | 'autopilot:created'
  | 'autopilot:updated'
  | 'autopilot:deleted'
  | 'daemon:heartbeat'
  | 'daemon:register'
  | 'reaction:added'
  | 'reaction:removed'
  | 'subscriber:added'
  | 'subscriber:removed'
  | 'activity:created'

export interface WSEvent<T = unknown> {
  type: WSEventType
  payload: T
  workspaceId?: string
}

// ============ Constants: Status Labels ============
export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
}

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  archived: 'Archived',
}

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  idle: 'Idle',
  working: 'Working',
  blocked: 'Blocked',
  error: 'Error',
  offline: 'Offline',
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

// ============ Constants: Status Colors (Tailwind) ============
export const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  backlog: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  todo: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  in_review: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

export const PRIORITY_COLORS: Record<IssuePriority, string> = {
  none: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  low: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  on_hold: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  idle: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  working: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  blocked: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  error: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
  offline: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
}

// ============ Constants: Status Config (extended) ============
export const ISSUE_STATUS_CONFIG: Record<IssueStatus, StatusConfig> = {
  backlog: {
    label: 'Backlog',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800/50',
    iconColor: 'text-gray-400',
    hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-800/30',
  },
  todo: {
    label: 'To Do',
    color: 'text-sky-600',
    bgColor: 'bg-sky-100 dark:bg-sky-950/50',
    iconColor: 'text-sky-500',
    hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-950/30',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-950/50',
    iconColor: 'text-amber-500',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
  },
  in_review: {
    label: 'In Review',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100 dark:bg-violet-950/50',
    iconColor: 'text-violet-500',
    hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-950/30',
  },
  done: {
    label: 'Done',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/50',
    iconColor: 'text-emerald-500',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
  },
  blocked: {
    label: 'Blocked',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-950/50',
    iconColor: 'text-red-500',
    hoverBg: 'hover:bg-red-50 dark:hover:bg-red-950/30',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/30',
    iconColor: 'text-gray-400',
    hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-800/20',
  },
}

export const PRIORITY_CONFIG: Record<IssuePriority, PriorityConfig> = {
  none: { label: 'None', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: '○' },
  low: { label: 'Low', color: 'text-sky-600', bgColor: 'bg-sky-100 dark:bg-sky-950', icon: '↓' },
  medium: { label: 'Medium', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-950', icon: '→' },
  high: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-950', icon: '↑' },
  urgent: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-950', icon: '⚡' },
}

// ============ Skill Category ============
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
