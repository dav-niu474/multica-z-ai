'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Pencil,
  Play,
  Pause,
  Trash2,
  Bot,
  Cpu,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type { Agent, AgentStatus, Skill } from '@/types'
import AgentFormDialog from '@/components/agents/agent-form-dialog'
import { useWorkspace } from '@/hooks/use-workspace'

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: 'bg-emerald-500',
  working: 'bg-amber-500',
  blocked: 'bg-red-500',
  error: 'bg-red-500',
  offline: 'bg-gray-400',
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: 'Idle',
  working: 'Working',
  blocked: 'Blocked',
  error: 'Error',
  offline: 'Offline',
}

const STATUS_BADGE_CLASSES: Record<AgentStatus, string> = {
  idle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  working: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  offline: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude Code',
  codex: 'Codex',
  openai: 'OpenAI',
  gemini: 'Gemini',
  custom: 'Custom',
}

const PROVIDER_BADGE_CLASSES: Record<string, string> = {
  claude: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  codex: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  openai: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  gemini: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  custom: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
}

const AVATAR_COLORS: Record<string, string> = {
  claude: 'bg-violet-500',
  codex: 'bg-teal-500',
  openai: 'bg-teal-500',
  gemini: 'bg-cyan-500',
  custom: 'bg-orange-500',
}

const SKILL_CATEGORY_COLORS: Record<string, string> = {
  engineering: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  testing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  review: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  deployment: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  custom: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
}

export default function AgentsView() {
  const { workspaceId, loading: wsLoading, error: wsError } = useWorkspace()
  const [agents, setAgents] = useState<Agent[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Action loading states
  const [togglingAgentId, setTogglingAgentId] = useState<string | null>(null)
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/agents?workspaceId=${workspaceId}`)
      if (!res.ok) throw new Error('Failed to fetch agents')
      const data = await res.json()
      setAgents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
    }
  }, [workspaceId])

  const fetchSkills = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/skills?workspaceId=${workspaceId}`)
      if (!res.ok) throw new Error('Failed to fetch skills')
      const data = await res.json()
      setSkills(data)
    } catch {
      // Skills are not critical, silently fail
    }
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    async function fetchData() {
      setLoading(true)
      setError(null)
      await Promise.all([fetchAgents(), fetchSkills()])
      setLoading(false)
    }
    fetchData()
  }, [fetchAgents, fetchSkills, workspaceId])

  async function handleToggleStatus(agent: Agent) {
    try {
      setTogglingAgentId(agent.id)
      const res = await fetch(`/api/agents/${agent.id}/toggle-status`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to toggle status')
      const data = await res.json()
      toast.success(
        `${agent.name} is now ${data.newStatus}`
      )
      await fetchAgents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle status')
    } finally {
      setTogglingAgentId(null)
    }
  }

  async function handleDelete(agentId: string) {
    try {
      setDeletingAgentId(agentId)
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete agent')
      toast.success('Agent deleted successfully')
      await fetchAgents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete agent')
    } finally {
      setDeletingAgentId(null)
    }
  }

  function openEditDialog(agent: Agent) {
    setEditingAgent(agent)
    setEditDialogOpen(true)
  }

  const displayError = wsError || error
  const isLoading = wsLoading || loading

  if (displayError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Failed to load agents</span>
          </div>
          <p className="text-sm text-muted-foreground">{displayError}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Manage AI agents in your workspace
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          size="sm"
          className="text-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create Agent
        </Button>
      </div>

      {/* Agent Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex gap-1.5 pt-1">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium mb-1">No agents yet</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Create your first AI agent to get started
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              variant="outline"
              className="text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const initials = agent.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            const isToggling = togglingAgentId === agent.id
            const isDeleting = deletingAgentId === agent.id

            return (
              <Card
                key={agent.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  {/* Agent Header */}
                  <div className="flex items-start gap-3">
                    {/* Avatar with status dot */}
                    <div className="relative shrink-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                          AVATAR_COLORS[agent.provider] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {initials}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                          STATUS_COLORS[agent.status]
                        }`}
                      />
                    </div>

                    {/* Name & Description */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium truncate">
                          {agent.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={`text-xs shrink-0 ${
                            STATUS_BADGE_CLASSES[agent.status]
                          }`}
                        >
                          {STATUS_LABELS[agent.status]}
                        </Badge>
                      </div>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Provider & Task Count */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        PROVIDER_BADGE_CLASSES[agent.provider] ?? ''
                      }`}
                    >
                      <Cpu className="h-3 w-3 mr-1" />
                      {PROVIDER_LABELS[agent.provider] ?? agent.provider}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {agent._count?.tasks ?? 0} task{(agent._count?.tasks ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      Max {agent.maxConcurrent}
                    </span>
                  </div>

                  {/* Instructions Preview */}
                  {agent.instructions && (
                    <div className="mt-3 p-2.5 rounded-md bg-muted/50 border">
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {agent.instructions}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {agent.skills && agent.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {agent.skills.slice(0, 4).map((agentSkill) => (
                        <Badge
                          key={agentSkill.skillId}
                          variant="secondary"
                          className={`text-xs ${
                            agentSkill.skill?.category
                              ? SKILL_CATEGORY_COLORS[agentSkill.skill.category] ?? ''
                              : ''
                          }`}
                        >
                          {agentSkill.skill?.name ?? 'Unknown Skill'}
                        </Badge>
                      ))}
                      {agent.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.skills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => openEditDialog(agent)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleToggleStatus(agent)}
                      disabled={isToggling || agent.status === 'blocked' || agent.status === 'error'}
                    >
                      {isToggling ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : agent.status === 'working' ? (
                        <Pause className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <Play className="h-3.5 w-3.5 mr-1" />
                      )}
                      {agent.status === 'working' ? 'Pause' : 'Activate'}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm font-medium">
                            Delete &quot;{agent.name}&quot;?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs">
                            This action cannot be undone. The agent and all
                            associated tasks will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-sm">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="text-sm"
                            onClick={() => handleDelete(agent.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Agent Dialog */}
      <AgentFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        skills={skills}
        workspaceId={workspaceId ?? ''}
        onSuccess={fetchAgents}
      />

      {/* Edit Agent Dialog */}
      <AgentFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        agent={editingAgent}
        skills={skills}
        workspaceId={workspaceId ?? ''}
        onSuccess={fetchAgents}
      />
    </div>
  )
}
