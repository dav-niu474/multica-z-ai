// AgentHub - Comprehensive API Client
// Singleton pattern with token-based auth, workspace-aware headers, and structured error handling

import type {
  User,
  Workspace,
  Member,
  MemberWithUser,
  MemberRole,
  Invitation,
  Issue,
  CreateIssueRequest,
  UpdateIssueRequest,
  ListIssuesParams,
  ListIssuesResponse,
  Comment,
  Label,
  Project,
  CreateProjectRequest,
  Agent,
  CreateAgentRequest,
  AgentTask,
  Skill,
  ChatSession,
  ChatMessage,
  ChatPendingTask,
  InboxItem,
  Autopilot,
  CreateAutopilotRequest,
  AgentRuntime,
  PinnedItem,
  PinnedItemType,
  DashboardStats,
  TimelineEntry,
} from '@/types'
import type { ModelProvider } from '@/lib/model-providers'

// ==================== ApiError ====================

export class ApiError extends Error {
  status: number
  statusText: string
  body: unknown

  constructor(status: number, statusText: string, body: unknown) {
    let message = statusText
    if (typeof body === 'object' && body !== null) {
      const b = body as Record<string, unknown>
      if (typeof b.error === 'string') message = b.error
      else if (typeof b.message === 'string') message = b.message
    }
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}

// ==================== Request helpers ====================

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ==================== ApiClient ====================

class ApiClient {
  private baseUrl: string
  private workspaceSlug: string | null = null

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  // ---- Workspace slug management ----

  setWorkspaceSlug(slug: string | null) {
    this.workspaceSlug = slug
  }

  getWorkspaceSlug(): string | null {
    return this.workspaceSlug
  }

  // ---- Token management ----

  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('multica_token')
  }

  setToken(token: string | null) {
    if (typeof window === 'undefined') return
    if (token) {
      localStorage.setItem('multica_token', token)
    } else {
      localStorage.removeItem('multica_token')
    }
  }

  // ---- Core fetch wrapper ----

  private async request<T>(
    path: string,
    options: RequestInit = {},
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`
    if (params) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value))
        }
      }
      const qs = searchParams.toString()
      if (qs) url += `?${qs}`
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Add auth token
    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Add workspace slug header
    if (this.workspaceSlug) {
      headers['x-workspace-slug'] = this.workspaceSlug
    }

    // Add request ID for debugging
    const requestId = generateRequestId()
    headers['x-request-id'] = requestId

    const response = await fetch(url, { ...options, headers })

    // Auto-handle 401
    if (response.status === 401) {
      this.setToken(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiError(401, 'Unauthorized', null)
    }

    if (!response.ok) {
      let body: unknown
      try {
        body = await response.json()
      } catch {
        const text = await response.text().catch(() => null)
        body = text || null
      }
      throw new ApiError(response.status, response.statusText, body)
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  // ---- Shorthand HTTP methods ----

  private get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, { method: 'GET' }, params)
  }

  private post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  private put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  private patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  private del<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }

  // ==================== Auth ====================

  async sendCode(email: string): Promise<void> {
    await this.post('/api/auth/send-code', { email })
  }

  async verifyCode(email: string, code: string): Promise<{ user: User; token: string }> {
    return this.post('/api/auth/verify-code', { email, code })
  }

  async loginWithGoogle(code: string): Promise<{ user: User; token: string }> {
    return this.post('/api/auth/google', { code })
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.post('/api/auth/login', { email, password })
  }

  async logout(): Promise<void> {
    try {
      await this.post('/api/auth/logout')
    } finally {
      this.setToken(null)
    }
  }

  async getMe(): Promise<User> {
    return this.get<User>('/api/auth/me')
  }

  async updateMe(data: Partial<User>): Promise<User> {
    return this.patch<User>('/api/auth/me', data)
  }

  // ==================== Workspaces ====================

  async listWorkspaces(): Promise<Workspace[]> {
    return this.get<Workspace[]>('/api/workspaces')
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return this.get<Workspace>(`/api/workspaces/${id}`)
  }

  async createWorkspace(data: { name: string; slug: string; description?: string }): Promise<Workspace> {
    return this.post<Workspace>('/api/workspaces', data)
  }

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    return this.patch<Workspace>(`/api/workspaces/${id}`, data)
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.del(`/api/workspaces/${id}`)
  }

  // ==================== Members ====================

  async listMembers(workspaceId: string): Promise<MemberWithUser[]> {
    return this.get<MemberWithUser[]>(`/api/workspaces/${workspaceId}/members`)
  }

  async createMember(
    workspaceId: string,
    data: { userId: string; role: MemberRole },
  ): Promise<Member> {
    return this.post<Member>(`/api/workspaces/${workspaceId}/members`, data)
  }

  async updateMember(memberId: string, role: MemberRole): Promise<Member> {
    return this.patch<Member>(`/api/members/${memberId}`, { role })
  }

  async deleteMember(memberId: string): Promise<void> {
    await this.del(`/api/members/${memberId}`)
  }

  // ==================== Invitations ====================

  async listInvitations(workspaceId: string): Promise<Invitation[]> {
    return this.get<Invitation[]>(`/api/workspaces/${workspaceId}/invitations`)
  }

  async createInvitation(
    workspaceId: string,
    data: { email: string; role: MemberRole },
  ): Promise<Invitation> {
    return this.post<Invitation>(`/api/workspaces/${workspaceId}/invitations`, data)
  }

  async revokeInvitation(id: string): Promise<void> {
    await this.del(`/api/invitations/${id}`)
  }

  async listMyInvitations(): Promise<Invitation[]> {
    return this.get<Invitation[]>('/api/invitations')
  }

  async acceptInvitation(id: string): Promise<void> {
    await this.post(`/api/invitations/${id}/accept`)
  }

  async declineInvitation(id: string): Promise<void> {
    await this.post(`/api/invitations/${id}/decline`)
  }

  // ==================== Issues ====================

  async listIssues(workspaceId: string, params?: ListIssuesParams): Promise<ListIssuesResponse> {
    return this.get<ListIssuesResponse>(`/api/workspaces/${workspaceId}/issues`, params as Record<string, string | number | boolean | undefined>)
  }

  async getIssue(id: string): Promise<Issue> {
    return this.get<Issue>(`/api/issues/${id}`)
  }

  async createIssue(workspaceId: string, data: CreateIssueRequest): Promise<Issue> {
    return this.post<Issue>(`/api/workspaces/${workspaceId}/issues`, data)
  }

  async updateIssue(id: string, data: UpdateIssueRequest): Promise<Issue> {
    return this.patch<Issue>(`/api/issues/${id}`, data)
  }

  async deleteIssue(id: string): Promise<void> {
    await this.del(`/api/issues/${id}`)
  }

  async batchUpdateIssues(ids: string[], data: Partial<UpdateIssueRequest>): Promise<void> {
    await this.patch('/api/issues/batch', { ids, ...data })
  }

  async batchDeleteIssues(ids: string[]): Promise<void> {
    await this.post('/api/issues/batch-delete', { ids })
  }

  async searchIssues(workspaceId: string, query: string): Promise<Issue[]> {
    return this.get<Issue[]>(`/api/workspaces/${workspaceId}/issues`, { search: query })
  }

  // ==================== Comments ====================

  async listComments(issueId: string): Promise<Comment[]> {
    return this.get<Comment[]>(`/api/issues/${issueId}/comments`)
  }

  async createComment(
    issueId: string,
    data: { content: string; parentId?: string },
  ): Promise<Comment> {
    return this.post<Comment>(`/api/issues/${issueId}/comments`, data)
  }

  async updateComment(id: string, content: string): Promise<Comment> {
    return this.patch<Comment>(`/api/comments/${id}`, { content })
  }

  async deleteComment(id: string): Promise<void> {
    await this.del(`/api/comments/${id}`)
  }

  // ==================== Labels ====================

  async listLabels(workspaceId: string): Promise<Label[]> {
    return this.get<Label[]>(`/api/workspaces/${workspaceId}/labels`)
  }

  async createLabel(
    workspaceId: string,
    data: { name: string; color: string },
  ): Promise<Label> {
    return this.post<Label>(`/api/workspaces/${workspaceId}/labels`, data)
  }

  async updateLabel(id: string, data: Partial<Label>): Promise<Label> {
    return this.patch<Label>(`/api/labels/${id}`, data)
  }

  async deleteLabel(id: string): Promise<void> {
    await this.del(`/api/labels/${id}`)
  }

  async attachLabel(issueId: string, labelId: string): Promise<void> {
    await this.post(`/api/issues/${issueId}/labels/${labelId}`)
  }

  async detachLabel(issueId: string, labelId: string): Promise<void> {
    await this.del(`/api/issues/${issueId}/labels/${labelId}`)
  }

  // ==================== Projects ====================

  async listProjects(workspaceId: string): Promise<Project[]> {
    return this.get<Project[]>(`/api/workspaces/${workspaceId}/projects`)
  }

  async getProject(id: string): Promise<Project> {
    return this.get<Project>(`/api/projects/${id}`)
  }

  async createProject(workspaceId: string, data: CreateProjectRequest): Promise<Project> {
    return this.post<Project>(`/api/workspaces/${workspaceId}/projects`, data)
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.patch<Project>(`/api/projects/${id}`, data)
  }

  async deleteProject(id: string): Promise<void> {
    await this.del(`/api/projects/${id}`)
  }

  // ==================== Agents ====================

  async listAgents(workspaceId: string): Promise<Agent[]> {
    return this.get<Agent[]>(`/api/workspaces/${workspaceId}/agents`)
  }

  async getAgent(id: string): Promise<Agent> {
    return this.get<Agent>(`/api/agents/${id}`)
  }

  async createAgent(workspaceId: string, data: CreateAgentRequest): Promise<Agent> {
    return this.post<Agent>(`/api/workspaces/${workspaceId}/agents`, data)
  }

  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
    return this.patch<Agent>(`/api/agents/${id}`, data)
  }

  async archiveAgent(id: string): Promise<Agent> {
    return this.post<Agent>(`/api/agents/${id}/archive`)
  }

  async restoreAgent(id: string): Promise<Agent> {
    return this.post<Agent>(`/api/agents/${id}/restore`)
  }

  async toggleAgentStatus(id: string): Promise<Agent> {
    return this.post<Agent>(`/api/agents/${id}/toggle`)
  }

  async cancelAgentTasks(id: string): Promise<void> {
    await this.post(`/api/agents/${id}/cancel-tasks`)
  }

  // ==================== Agent Tasks ====================

  async listAgentTasks(agentId: string): Promise<AgentTask[]> {
    return this.get<AgentTask[]>(`/api/agents/${agentId}/tasks`)
  }

  async getAgentTask(taskId: string): Promise<AgentTask> {
    return this.get<AgentTask>(`/api/agent-tasks/${taskId}`)
  }

  // ==================== Skills ====================

  async listSkills(workspaceId: string): Promise<Skill[]> {
    return this.get<Skill[]>(`/api/workspaces/${workspaceId}/skills`)
  }

  async getSkill(id: string): Promise<Skill> {
    return this.get<Skill>(`/api/skills/${id}`)
  }

  async createSkill(workspaceId: string, data: Partial<Skill>): Promise<Skill> {
    return this.post<Skill>(`/api/workspaces/${workspaceId}/skills`, data)
  }

  async updateSkill(id: string, data: Partial<Skill>): Promise<Skill> {
    return this.patch<Skill>(`/api/skills/${id}`, data)
  }

  async deleteSkill(id: string): Promise<void> {
    await this.del(`/api/skills/${id}`)
  }

  // ==================== Chat ====================

  async listChatSessions(workspaceId: string): Promise<ChatSession[]> {
    return this.get<ChatSession[]>(`/api/workspaces/${workspaceId}/chat-sessions`)
  }

  async getChatSession(id: string): Promise<ChatSession> {
    return this.get<ChatSession>(`/api/chat-sessions/${id}`)
  }

  async createChatSession(
    workspaceId: string,
    data: { agentId: string; title?: string },
  ): Promise<ChatSession> {
    return this.post<ChatSession>(`/api/workspaces/${workspaceId}/chat-sessions`, data)
  }

  async sendChatMessage(sessionId: string, content: string): Promise<ChatMessage> {
    return this.post<ChatMessage>(`/api/chat-sessions/${sessionId}/messages`, { content })
  }

  async listChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.get<ChatMessage[]>(`/api/chat-sessions/${sessionId}/messages`)
  }

  async getPendingChatTask(sessionId: string): Promise<ChatPendingTask | null> {
    return this.get<ChatPendingTask | null>(`/api/chat-sessions/${sessionId}/pending-task`)
  }

  async cancelTaskById(taskId: string): Promise<void> {
    await this.post(`/api/agent-tasks/${taskId}/cancel`)
  }

  async markChatSessionRead(sessionId: string): Promise<void> {
    await this.post(`/api/chat-sessions/${sessionId}/read`)
  }

  async archiveChatSession(sessionId: string): Promise<void> {
    await this.post(`/api/chat-sessions/${sessionId}/archive`)
  }

  // ==================== Inbox ====================

  async listInbox(workspaceId: string): Promise<InboxItem[]> {
    return this.get<InboxItem[]>(`/api/workspaces/${workspaceId}/inbox`)
  }

  async markInboxRead(id: string): Promise<void> {
    await this.post(`/api/inbox/${id}/read`)
  }

  async archiveInbox(id: string): Promise<void> {
    await this.post(`/api/inbox/${id}/archive`)
  }

  async markAllInboxRead(workspaceId: string): Promise<void> {
    await this.post(`/api/workspaces/${workspaceId}/inbox/batch-read`)
  }

  async archiveAllInbox(workspaceId: string): Promise<void> {
    await this.post(`/api/workspaces/${workspaceId}/inbox/batch-archive`)
  }

  // ==================== Autopilots ====================

  async listAutopilots(workspaceId: string): Promise<Autopilot[]> {
    return this.get<Autopilot[]>(`/api/workspaces/${workspaceId}/autopilots`)
  }

  async getAutopilot(id: string): Promise<Autopilot> {
    return this.get<Autopilot>(`/api/autopilots/${id}`)
  }

  async createAutopilot(workspaceId: string, data: CreateAutopilotRequest): Promise<Autopilot> {
    return this.post<Autopilot>(`/api/workspaces/${workspaceId}/autopilots`, data)
  }

  async updateAutopilot(id: string, data: Partial<Autopilot>): Promise<Autopilot> {
    return this.patch<Autopilot>(`/api/autopilots/${id}`, data)
  }

  async deleteAutopilot(id: string): Promise<void> {
    await this.del(`/api/autopilots/${id}`)
  }

  async triggerAutopilot(id: string): Promise<void> {
    await this.post(`/api/autopilots/${id}/trigger`)
  }

  // ==================== Runtimes ====================

  async listRuntimes(workspaceId: string): Promise<AgentRuntime[]> {
    return this.get<AgentRuntime[]>(`/api/workspaces/${workspaceId}/runtimes`)
  }

  async getRuntime(id: string): Promise<AgentRuntime> {
    return this.get<AgentRuntime>(`/api/runtimes/${id}`)
  }

  async deleteRuntime(id: string): Promise<void> {
    await this.del(`/api/runtimes/${id}`)
  }

  // ==================== Pins ====================

  async listPins(workspaceId: string): Promise<PinnedItem[]> {
    return this.get<PinnedItem[]>(`/api/workspaces/${workspaceId}/pins`)
  }

  async createPin(
    workspaceId: string,
    data: { type: PinnedItemType; itemId: string },
  ): Promise<PinnedItem> {
    return this.post<PinnedItem>(`/api/workspaces/${workspaceId}/pins`, data)
  }

  async deletePin(id: string): Promise<void> {
    await this.del(`/api/pins/${id}`)
  }

  async reorderPins(workspaceId: string, orderedIds: string[]): Promise<void> {
    await this.put(`/api/workspaces/${workspaceId}/pins/reorder`, { orderedIds })
  }

  // ==================== Dashboard ====================

  async getDashboardStats(workspaceId: string): Promise<DashboardStats> {
    return this.get<DashboardStats>(`/api/workspaces/${workspaceId}/dashboard`)
  }

  // ==================== Activity ====================

  async getActivityLog(
    workspaceId: string,
    params?: { entityType?: string; entityId?: string; limit?: number },
  ): Promise<TimelineEntry[]> {
    return this.get<TimelineEntry[]>(`/api/workspaces/${workspaceId}/activity`, params as Record<string, string | number | boolean | undefined>)
  }

  // ==================== Models ====================

  async listModels(): Promise<ModelProvider[]> {
    return this.get<ModelProvider[]>('/api/models')
  }
}

// ==================== Singleton exports ====================

let _api: ApiClient | null = null

/** Initialize the global API client singleton */
export function setApiInstance(api: ApiClient) {
  _api = api
}

/** Get the global API client instance. Throws if not initialized. */
export function getApi(): ApiClient {
  if (!_api) {
    // Auto-create with defaults
    _api = new ApiClient()
  }
  return _api
}

/**
 * Convenience proxy that delegates to the global ApiClient singleton.
 * Usage: `import { api } from '@/lib/api-client'; api.listWorkspaces()`
 */
export const api = new Proxy({} as ApiClient, {
  get(_target, prop) {
    const instance = getApi()
    const value = (instance as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

// Re-export ApiError
export { ApiError }
export type { ApiError as ApiErrorType }
