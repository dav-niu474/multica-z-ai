'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'
import type { DashboardData, Agent, AgentStatus } from '@/types'
import { useWorkspace } from '@/hooks/use-workspace'

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
}

const ISSUE_STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

const issueChartConfig = {
  backlog: { label: 'Backlog', color: 'hsl(var(--muted))' },
  todo: { label: 'To Do', color: 'hsl(var(--muted-foreground))' },
  in_progress: { label: 'In Progress', color: 'hsl(38 92% 50%)' },
  in_review: { label: 'In Review', color: 'hsl(268 83% 57%)' },
  done: { label: 'Done', color: 'hsl(142 71% 45%)' },
} satisfies ChartConfig

export default function DashboardView() {
  const { workspaceId, loading: wsLoading, error: wsError } = useWorkspace()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceId) return

    async function fetchData() {
      try {
        setLoading(true)
        const [dashRes] = await Promise.all([
          fetch(`/api/dashboard?workspaceId=${workspaceId}`),
        ])

        if (!dashRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const dashJson = await dashRes.json()
        setDashboardData(dashJson)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [workspaceId])

  const displayError = wsError || error
  const isLoading = wsLoading || loading

  if (displayError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Failed to load dashboard</span>
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
  const doneIssues = overview?.issueStatusCounts?.done ?? 0
  const completionRate = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0
  const activeAgents = allAgents.filter((a) => a.status === 'working').length
  const openTasks = overview?.taskStatusCounts?.running ?? 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-base font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your workspace activity
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
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
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs">Total Issues</span>
                </div>
                <div className="text-2xl font-medium tabular-nums">{totalIssues}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {doneIssues} completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Bot className="h-4 w-4" />
                  <span className="text-xs">Active Agents</span>
                </div>
                <div className="text-2xl font-medium tabular-nums">
                  {activeAgents}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{allAgents.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently working
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs">Open Tasks</span>
                </div>
                <div className="text-2xl font-medium tabular-nums">{openTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Running now
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Completion Rate</span>
                </div>
                <div className="text-2xl font-medium tabular-nums">
                  {completionRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Issues resolved
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent Status Grid - spans 2 cols on lg */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Agent Status
            </CardTitle>
            <CardDescription className="text-xs">
              {allAgents.length} agents in workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : allAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No agents configured yet
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {/* Avatar from initials */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                            PROVIDER_COLORS[agent.provider]?.split(' ')[0] ??
                            'bg-muted text-muted-foreground'
                          } ${
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
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                            STATUS_COLORS[agent.status]
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {agent.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-xs capitalize ${STATUS_TEXT_COLORS[agent.status]}`}
                          >
                            {agent.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · {agent._count?.tasks ?? 0} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${PROVIDER_COLORS[agent.provider] ?? ''}`}
                    >
                      {agent.provider}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issue Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Issue Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              {totalIssues} issues total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : issueChartData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No issues yet
              </div>
            ) : (
              <div className="space-y-4">
                <ChartContainer config={issueChartConfig} className="mx-auto h-[180px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={issueChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={75}
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

                {/* Status breakdown bar */}
                <div className="space-y-2">
                  {issueChartData.map((entry) => (
                    <div key={entry.status} className="flex items-center gap-2">
                      <div
                        className="h-2.5 rounded-full"
                        style={{
                          backgroundColor: entry.fill,
                          width: `${Math.max((entry.value / totalIssues) * 100, 4)}%`,
                          maxWidth: '100%',
                        }}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap min-w-0">
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-xs">
            Latest workspace events
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
              No recent activity
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1">
              {recentActivity.slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-2.5 border-b last:border-0"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    {activity.actorType === 'agent' ? (
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <CircleDot className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {activity.actorType === 'system'
                          ? 'System'
                          : activity.actorType === 'agent'
                            ? 'Agent'
                            : 'Member'}
                      </span>{' '}
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
                      <Badge variant="outline" className="text-xs ml-1 px-1.5 py-0">
                        {activity.entityType}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
