'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Card,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Radio,
  Search,
  MoreHorizontal,
  ArchiveRestore,
  Archive,
  Eye,
  EyeOff,
  Shield,
  Wrench,
  Zap,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import type { Agent, AgentStatus, Skill, AgentSkill } from '@/types'
import AgentFormDialog from '@/components/agents/agent-form-dialog'
import { useWorkspace } from '@/hooks/use-workspace'
import { useRealtime } from '@/lib/realtime-context'
import { formatDistanceToNow } from 'date-fns'

// ==================== Constants ====================

const AGENT_STATUS_CONFIG: Record<AgentStatus, {
  label: string
  dotColor: string
  badgeClass: string
  textColor: string
  bgColor: string
}> = {
  idle: {
    label: 'Idle',
    dotColor: 'bg-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  working: {
    label: 'Working',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  blocked: {
    label: 'Blocked',
    dotColor: 'bg-orange-500',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
  error: {
    label: 'Error',
    dotColor: 'bg-red-500',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  offline: {
    label: 'Offline',
    dotColor: 'bg-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800/30',
  },
}

const PROVIDER_CONFIG: Record<string, { label: string; badgeClass: string; avatarBg: string }> = {
  claude: { label: 'Claude Code', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', avatarBg: 'bg-violet-500' },
  codex: { label: 'Codex', badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300', avatarBg: 'bg-teal-500' },
  openai: { label: 'OpenAI', badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300', avatarBg: 'bg-teal-500' },
  gemini: { label: 'Gemini', badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300', avatarBg: 'bg-cyan-500' },
  custom: { label: 'Custom', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', avatarBg: 'bg-orange-500' },
  nvidia: { label: 'NVIDIA NIM', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', avatarBg: 'bg-emerald-500' },
  glm: { label: 'GLM', badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300', avatarBg: 'bg-sky-500' },
  volcano: { label: 'Volcano', badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', avatarBg: 'bg-rose-500' },
  anthropic: { label: 'Anthropic', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', avatarBg: 'bg-amber-500' },
}

const SKILL_CATEGORY_COLORS: Record<string, string> = {
  engineering: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  testing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  review: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  deployment: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  custom: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  security: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  performance: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  git: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  documentation: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
}

const TASK_STATUS_COLORS: Record<string, string> = {
  queued: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  dispatched: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  running: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

type FilterTab = 'all' | 'active' | 'archived'

// ==================== Agent Card ====================

interface AgentCardProps {
  agent: Agent
  onClick: () => void
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
  onArchive: () => void
  isToggling: boolean
  isDeleting: boolean
}

function AgentCard({ agent, onClick, onEdit, onToggleStatus, onDelete, onArchive, isToggling, isDeleting }: AgentCardProps) {
  const { t } = useTranslation()
  const statusConfig = AGENT_STATUS_CONFIG[agent.status]
  const providerConfig = PROVIDER_CONFIG[agent.provider]
  const initials = agent.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const taskCount = agent._count?.tasks ?? 0
  const skillCount = agent.skills?.length ?? 0

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 group border hover:border-primary/20"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-medium text-white ${
              providerConfig?.avatarBg ?? 'bg-muted text-muted-foreground'
            }`}>
              {initials}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusConfig.dotColor}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{agent.name}</h3>
              {agent.visibility === 'private' && (
                <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
              {agent.description?.slice(0, 50) || t.agents.noDescription}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              {t.common.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
              disabled={isToggling || agent.status === 'blocked' || agent.status === 'error'}
            >
              {isToggling ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : agent.status === 'working' ? (
                <Pause className="h-3.5 w-3.5 mr-2" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-2" />
              )}
              {agent.status === 'working' ? t.agents.pause : t.agents.activate}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
              {agent.isArchived ? (
                <>
                  <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
                  {t.agents.restore}
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5 mr-2" />
                  {t.agents.archive}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-2" />
              )}
              {t.common.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status + Model + Skills badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className={`text-[11px] h-5 ${statusConfig.badgeClass}`}>
          {statusConfig.label}
        </Badge>
        {providerConfig && (
          <Badge variant="secondary" className={`text-[11px] h-5 ${providerConfig.badgeClass}`}>
            <Cpu className="h-2.5 w-2.5 mr-1" />
            {providerConfig.label}
          </Badge>
        )}
        <Badge variant="outline" className="text-[11px] h-5">
          {skillCount} skill{skillCount !== 1 ? 's' : ''}
        </Badge>
        {taskCount > 0 && (
          <Badge variant="outline" className="text-[11px] h-5">
            <Zap className="h-2.5 w-2.5 mr-0.5" />
            {taskCount} task{taskCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </Card>
  )
}

// ==================== Agent Detail Sheet ====================

interface AgentDetailSheetProps {
  agent: Agent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
  onArchive: () => void
  isToggling: boolean
  isDeleting: boolean
}

function AgentDetailSheet({ agent, open, onOpenChange, onEdit, onToggleStatus, onDelete, onArchive, isToggling, isDeleting }: AgentDetailSheetProps) {
  const { t } = useTranslation()

  if (!agent) return null

  const statusConfig = AGENT_STATUS_CONFIG[agent.status]
  const providerConfig = PROVIDER_CONFIG[agent.provider]
  const initials = agent.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-medium text-white ${
                providerConfig?.avatarBg ?? 'bg-muted text-muted-foreground'
              }`}>
                {initials}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${statusConfig.dotColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg">{agent.name}</SheetTitle>
              <SheetDescription className="text-xs">
                {agent.description || t.agents.noDescription}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Status & Visibility */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className={`text-xs ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </Badge>
            {agent.visibility === 'private' ? (
              <Badge variant="outline" className="text-xs gap-1">
                <EyeOff className="h-3 w-3" />
                {t.agents.visibilityPrivate}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs gap-1">
                <Eye className="h-3 w-3" />
                {t.agents.visibilityWorkspace}
              </Badge>
            )}
            {providerConfig && (
              <Badge variant="outline" className="text-xs gap-1">
                <Cpu className="h-3 w-3" />
                {providerConfig.label}
              </Badge>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-xs font-medium">{t.agents.agentInstructions}</h4>
            </div>
            {agent.instructions ? (
              <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                {agent.instructions}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t.agents.noInstructions}</p>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t.agents.agentMaxConcurrent}</p>
              <p className="text-sm font-medium">{agent.maxConcurrentTasks}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t.agents.agentTasks}</p>
              <p className="text-sm font-medium">{agent._count?.tasks ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t.agents.agentCreated}</p>
              <p className="text-xs font-medium">{formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t.agents.agentUpdated}</p>
              <p className="text-xs font-medium">{formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true })}</p>
            </div>
          </div>

          <Separator />

          {/* Skills */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-xs font-medium">{t.agents.agentSkills}</h4>
              <Badge variant="outline" className="text-[10px]">{agent.skills?.length ?? 0}</Badge>
            </div>
            {agent.skills && agent.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {agent.skills.map((as: AgentSkill) => (
                  <Badge
                    key={as.skillId}
                    variant="secondary"
                    className={`text-xs ${
                      as.skill?.category ? (SKILL_CATEGORY_COLORS[as.skill.category] ?? '') : ''
                    }`}
                  >
                    {as.skill?.name ?? 'Unknown'}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t.agents.noSkills}</p>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => { onOpenChange(false); onEdit(); }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {t.common.edit}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={onToggleStatus}
              disabled={isToggling || agent.status === 'blocked' || agent.status === 'error'}
            >
              {isToggling ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : agent.status === 'working' ? (
                <Pause className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1.5" />
              )}
              {agent.status === 'working' ? t.agents.pause : t.agents.activate}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onArchive}
            >
              {agent.isArchived ? (
                <ArchiveRestore className="h-3.5 w-3.5" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm">
                    {t.agents.deleteConfirm.replace('{name}', agent.name)}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    {t.agents.deleteConfirmDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs">{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction className="text-xs" onClick={onDelete}>
                    {t.common.delete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ==================== Filter Tabs ====================

function FilterTabs({ active, onChange }: { active: FilterTab; onChange: (tab: FilterTab) => void }) {
  const { t } = useTranslation()
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t.agents.filterAll },
    { key: 'active', label: t.agents.filterActive },
    { key: 'archived', label: t.agents.filterArchived },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            active === tab.key
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ==================== Main Agents View ====================

export default function AgentsView() {
  const { t } = useTranslation()
  const { workspaceId, loading: wsLoading, error: wsError } = useWorkspace()
  const { onEvent } = useRealtime()
  const [agents, setAgents] = useState<Agent[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pulseKey, setPulseKey] = useState(0)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Detail sheet state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)

  // Action loading states
  const [togglingAgentId, setTogglingAgentId] = useState<string | null>(null)
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    if (!workspaceId) return
    try {
      // Fetch both active and archived for filtering
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
      // Skills are not critical
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

  // Listen for realtime agent status changes
  useEffect(() => {
    const unsub = onEvent('agent:status-changed', (data: unknown) => {
      const payload = data as { agentId: string; status: AgentStatus }
      if (payload?.agentId && payload?.status) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === payload.agentId ? { ...a, status: payload.status } : a
          )
        )
        setPulseKey((k) => k + 1)
      }
    })
    return unsub
  }, [onEvent])

  // Filtered agents
  const filteredAgents = useMemo(() => {
    let filtered = agents

    // Apply filter tab
    if (filterTab === 'active') {
      filtered = filtered.filter((a) => !a.isArchived)
    } else if (filterTab === 'archived') {
      filtered = filtered.filter((a) => a.isArchived)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          a.provider.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [agents, filterTab, searchQuery])

  // Count agents for stats
  const agentStats = useMemo(() => ({
    total: agents.length,
    active: agents.filter((a) => !a.isArchived).length,
    working: agents.filter((a) => a.status === 'working' && !a.isArchived).length,
    idle: agents.filter((a) => a.status === 'idle' && !a.isArchived).length,
  }), [agents])

  async function handleToggleStatus(agent: Agent) {
    try {
      setTogglingAgentId(agent.id)
      const res = await fetch(`/api/agents/${agent.id}/toggle-status`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to toggle status')
      const data = await res.json()
      toast.success(t.agents.nowIs(agent.name, data.newStatus))
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
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete agent')
      toast.success(t.agents.deleteSuccess)
      setDetailSheetOpen(false)
      setSelectedAgent(null)
      await fetchAgents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete agent')
    } finally {
      setDeletingAgentId(null)
    }
  }

  async function handleArchive(agent: Agent) {
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !agent.isArchived }),
      })
      if (!res.ok) throw new Error('Failed to update agent')
      toast.success(agent.isArchived ? t.agents.restore + ' ✓' : t.agents.archive + ' ✓')
      if (selectedAgent?.id === agent.id) {
        setDetailSheetOpen(false)
        setSelectedAgent(null)
      }
      await fetchAgents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive agent')
    }
  }

  function openEditDialog(agent: Agent) {
    setEditingAgent(agent)
    setEditDialogOpen(true)
  }

  function openDetailSheet(agent: Agent) {
    setSelectedAgent(agent)
    setDetailSheetOpen(true)
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
    <div className="space-y-5">
      {/* Live update pulse */}
      {pulseKey > 0 && (
        <div
          key={pulseKey}
          className="flex items-center gap-1.5 text-xs text-primary animate-in fade-in duration-300"
        >
          <Radio className="h-3 w-3 animate-pulse" />
          <span>{t.agents.liveUpdated}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">{t.agents.title}</h1>
          <p className="text-sm text-muted-foreground">{t.agents.subtitle}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="text-sm">
          <Plus className="h-4 w-4 mr-1.5" />
          {t.agents.createAgent}
        </Button>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.agents.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <FilterTabs active={filterTab} onChange={setFilterTab} />
      </div>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex gap-1.5 mt-3">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-sm font-medium mb-1">
              {searchQuery ? t.agents.noMatchingAgents : t.agents.noAgentsYet}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {searchQuery ? t.agents.tryAdjustingSearch : t.agents.createFirstAgent}
            </p>
            {!searchQuery && (
              <Button onClick={() => setCreateDialogOpen(true)} size="sm" variant="outline" className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t.agents.createAgent}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => openDetailSheet(agent)}
              onEdit={() => openEditDialog(agent)}
              onToggleStatus={() => handleToggleStatus(agent)}
              onDelete={() => handleDelete(agent.id)}
              onArchive={() => handleArchive(agent)}
              isToggling={togglingAgentId === agent.id}
              isDeleting={deletingAgentId === agent.id}
            />
          ))}
        </div>
      )}

      {/* Agent Detail Sheet */}
      <AgentDetailSheet
        agent={selectedAgent}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={() => selectedAgent && openEditDialog(selectedAgent)}
        onToggleStatus={() => selectedAgent && handleToggleStatus(selectedAgent)}
        onDelete={() => selectedAgent && handleDelete(selectedAgent.id)}
        onArchive={() => selectedAgent && handleArchive(selectedAgent)}
        isToggling={selectedAgent ? togglingAgentId === selectedAgent.id : false}
        isDeleting={selectedAgent ? deletingAgentId === selectedAgent.id : false}
      />

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
