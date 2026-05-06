'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LayoutDashboard,
  Bot,
  CircleDot,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  Layers,
  Cpu,
  Zap,
  Plus,
  FolderKanban,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Circle,
} from 'lucide-react'
import type { DashboardData, Agent, AgentStatus, IssueStatus } from '@/types'
import { useWorkspace } from '@/hooks/use-workspace'
import { useRealtime } from '@/lib/realtime-context'
import { useTranslation } from '@/lib/i18n'

// ---- Color Maps ----
const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: 'bg-emerald-500',
  working: 'bg-amber-500',
  blocked: 'bg-red-500',
  error: 'bg-red-500',
  offline: 'bg-gray-400',
}

const STATUS_TEXT_COLORS: Record<AgentStatus, string> = {
  idle: 'text-emerald-600 dark:text-emerald-400',
  working: 'text-amber-600 dark:text-amber-400',
  blocked: 'text-red-600 dark:text-red-400',
  error: 'text-red-600 dark:text-red-400',
  offline: 'text-gray-500 dark:text-gray-400',
}

const PROVIDER_COLORS: Record<string, string> = {
  claude: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  codex: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  openai: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  gemini: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  custom: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
}

const ISSUE_CHART_COLORS: Record<string, string> = {
  backlog: 'hsl(var(--muted))',
  todo: 'hsl(var(--muted-foreground))',
  in_progress: 'hsl(38 92% 50%)',
  in_review: 'hsl(268 83% 57%)',
  done: 'hsl(142 71% 45%)',
  blocked: 'hsl(0 84% 60%)',
}

const ISSUE_STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
}

const issueChartConfig = {
  backlog: { label: 'Backlog', color: 'hsl(var(--muted))' },
  todo: { label: 'To Do', color: 'hsl(var(--muted-foreground))' },
  in_progress: { label: 'In Progress', color: 'hsl(38 92% 50%)' },
  in_review: { label: 'In Review', color: 'hsl(268 83% 57%)' },
  done: { label: 'Done', color: 'hsl(142 71% 45%)' },
  blocked: { label: 'Blocked', color: 'hsl(0 84% 60%)' },
} satisfies ChartConfig

// ---- Stat Card ----
function StatCard({
  title,
  value,
  icon,
  description,
  trend,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {trend === 'up' && (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </Card>
  )
}

// ---- Main Component ----
export default function DashboardView() {
  const { workspaceId, loading: wsLoading, error: wsError } = useWorkspace()
  const { onEvent } = useRealtime()
  const { t } = useTranslation()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pulseKey, setPulseKey] = useState(0)

  const fetchDashboard = useCallback(async () => {
    if (!workspaceId) return
    try {
      const dashRes = await fetch(`/api/dashboard?workspaceId=${workspaceId}`)
      if (!dashRes.ok) throw new Error('Failed to fetch data')
      const dashJson = await dashRes.json()
      setDashboardData(dashJson)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    async function fetchData() {
      try {
        setLoading(true)
        await fetchDashboard()
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [workspaceId, fetchDashboard])

  useEffect(() => {
    const unsubIssueUpdated = onEvent('issue:updated', () => {
      fetchDashboard()
      setPulseKey((k) => k + 1)
    })
    const unsubAgentStatus = onEvent('agent:status-changed', () => {
      fetchDashboard()
      setPulseKey((k) => k + 1)
    })
    return () => {
      unsubIssueUpdated()
      unsubAgentStatus()
    }
  }, [onEvent, fetchDashboard])

  const displayError = wsError || error
  const isLoading = wsLoading || loading

  if (displayError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{t.dashboard.failedToLoad}</span>
          </div>
          <p className="text-sm text-muted-foreground">{displayError}</p>
        </Card>
      </div>
    )
  }

  const overview = dashboardData?.overview
  const recentActivity = dashboardData?.recentActivity ?? []
  const allAgents = dashboardData?.agents ?? []

  // Issue chart data
  const issueChartData = overview
    ? Object.entries(overview.issueStatusCounts)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          name: ISSUE_STATUS_LABELS[status] ?? status,
          value: count,
          fill: ISSUE_CHART_COLORS[status] ?? 'hsl(var(--muted))',
          status,
        }))
    : []

  const totalIssues = overview?.totalIssues ?? 0
  const openIssues = overview?.openIssues ?? 0
  const inProgressIssues = overview?.inProgressIssues ?? 0
  const doneIssues = overview?.issueStatusCounts?.done ?? 0
  const blockedIssues = overview?.issueStatusCounts?.blocked ?? 0
  const completedThisWeek = dashboardData?.completedThisWeek ?? 0
  const activeAgents = allAgents.filter((a) => a.status === 'working').length
  const openTasks = overview?.taskStatusCounts?.running ?? 0
  const completionRate = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0

  // Agent status counts
  const idleAgents = allAgents.filter((a) => a.status === 'idle').length
  const workingAgents = allAgents.filter((a) => a.status === 'working').length
  const offlineAgents = allAgents.filter((a) => a.status === 'offline').length

  return (
    <div className="space-y-6">
      {/* Live update pulse */}
      {pulseKey > 0 && (
        <div
          key={pulseKey}
          className="flex items-center gap-1.5 text-xs text-primary animate-in fade-in duration-300"
        >
          <Radio className="h-3 w-3 animate-pulse" />
          <span>Live update</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium">{t.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="size-4 mr-1.5" />
            {t.dashboard.newIssue}
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="size-4 mr-1.5" />
            {t.dashboard.newAgent}
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="size-4 mr-1.5" />
            {t.dashboard.newProject}
          </Button>
        </div>
      </div>

      {/* Stats Cards Row — 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title={t.dashboard.totalIssues}
              value={totalIssues}
              icon={<Layers className="h-4 w-4" />}
              description={`${doneIssues} ${t.dashboard.completed}`}
              trend="up"
            />
            <StatCard
              title={t.dashboard.openIssues}
              value={openIssues}
              icon={<CircleDot className="h-4 w-4" />}
              description={`${blockedIssues} ${t.dashboard.blockedIssues}`}
            />
            <StatCard
              title={t.dashboard.inProgress}
              value={inProgressIssues}
              icon={<Cpu className="h-4 w-4" />}
              description={`${completionRate}% ${t.dashboard.completionRate}`}
            />
            <StatCard
              title={t.dashboard.activeAgents}
              value={`${activeAgents}/${allAgents.length}`}
              icon={<Bot className="h-4 w-4" />}
              description={t.dashboard.currentlyWorking}
            />
            <StatCard
              title={t.dashboard.doneThisWeek}
              value={completedThisWeek}
              icon={<CheckCircle2 className="h-4 w-4" />}
              description={`${openTasks} ${t.dashboard.openTasks}`}
              trend="up"
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Issue Status Distribution — spans 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              {t.dashboard.issueDistribution}
            </CardTitle>
            <CardDescription className="text-xs">
              {t.dashboard.issuesTotal(totalIssues)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-8">
                <Skeleton className="h-40 w-40 rounded-full" />
                <div className="flex-1 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ) : issueChartData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t.dashboard.noIssues}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <ChartContainer config={issueChartConfig} className="h-[200px] w-[200px] shrink-0">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={issueChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={85}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {issueChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>

                {/* Status breakdown bars */}
                <div className="flex-1 space-y-3 w-full">
                  {issueChartData.map((entry) => (
                    <div key={entry.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{entry.name}</span>
                        <span className="text-muted-foreground">{entry.value}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: entry.fill,
                            width: `${totalIssues > 0 ? (entry.value / totalIssues) * 100 : 0}%`,
                            minWidth: entry.value > 0 ? '4px' : '0',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Status Summary Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              {t.dashboard.agentStatus}
            </CardTitle>
            <CardDescription className="text-xs">
              {t.dashboard.agentsInWorkspace(allAgents.length)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : allAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t.dashboard.noAgentsConfigured}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Status summary cards */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{t.dashboard.idle}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {idleAgents}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{t.dashboard.working}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {workingAgents}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-3 w-3 rounded-full bg-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{t.dashboard.offline}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {offlineAgents}
                  </Badge>
                </div>

                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Agents
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {allAgents.slice(0, 6).map((agent) => (
                      <div key={agent.id} className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium text-white ${
                              agent.provider === 'claude'
                                ? 'bg-violet-500'
                                : agent.provider === 'codex'
                                  ? 'bg-teal-500'
                                  : agent.provider === 'gemini'
                                    ? 'bg-cyan-500'
                                    : 'bg-orange-500'
                            }`}
                          >
                            {agent.name
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                              STATUS_COLORS[agent.status]
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{agent.name}</p>
                          <p className={`text-[10px] capitalize ${STATUS_TEXT_COLORS[agent.status]}`}>
                            {agent.status}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] shrink-0 ${PROVIDER_COLORS[agent.provider] ?? ''}`}
                        >
                          {agent.provider}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t.dashboard.recentActivity}
          </CardTitle>
          <CardDescription className="text-xs">
            {t.dashboard.latestWorkspaceEvents}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t.dashboard.noRecentActivity}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-0">
                  {recentActivity.slice(0, 20).map((activity) => {
                    const actorLabel =
                      activity.actorType === 'system'
                        ? t.dashboard.system
                        : activity.actorType === 'agent'
                          ? t.dashboard.agent
                          : t.dashboard.member

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 py-3 relative"
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 z-10 border-2 border-background">
                          {activity.actorType === 'agent' ? (
                            <Bot className="h-4 w-4 text-muted-foreground" />
                          ) : activity.actorType === 'system' ? (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <CircleDot className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{actorLabel}</span>{' '}
                            <span className="text-muted-foreground capitalize">
                              {activity.action.replace(/_/g, ' ')}
                            </span>
                            {activity.issue && (
                              <span className="font-medium ml-1 truncate">
                                {activity.issue.title}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(activity.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                            <Badge variant="outline" className="text-[10px] ml-1 px-1.5 py-0">
                              {activity.entityType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
