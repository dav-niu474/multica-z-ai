import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/dashboard?workspaceId=xxx - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId query parameter is required' },
        { status: 400 }
      )
    }

    // Run all queries in parallel for performance
    const [
      workspace,
      agents,
      allIssues,
      projects,
      recentActivity,
      taskStats,
      activeTasks,
    ] = await Promise.all([
      // Workspace info
      db.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          _count: {
            select: {
              members: true,
              agents: true,
              issues: true,
              projects: true,
              chatSessions: true,
              skills: true,
            },
          },
        },
      }),

      // Agents with status counts
      db.agent.findMany({
        where: { workspaceId },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      }),

      // All issues for status breakdown
      db.issue.findMany({
        where: { workspaceId },
        select: {
          id: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Projects with issue counts
      db.project.findMany({
        where: { workspaceId },
        include: {
          _count: {
            select: { issues: true },
          },
          issues: {
            select: { status: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // Recent activity (last 20)
      db.activityLog.findMany({
        where: { workspaceId: undefined }, // Activity logs are not directly linked to workspace, use issue relation
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
              workspaceId: true,
            },
          },
        },
      }),

      // Agent task status distribution
      db.agentTask.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),

      // Currently running tasks
      db.agentTask.findMany({
        where: { status: 'running' },
        include: {
          agent: {
            select: { id: true, name: true, avatar: true, provider: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
    ])

    // Filter activity to this workspace
    const workspaceActivity = recentActivity.filter(
      (a) => a.issue?.workspaceId === workspaceId
    )

    // Compute issue status counts
    const issueStatusCounts: Record<string, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
      cancelled: 0,
    }
    for (const issue of allIssues) {
      if (issueStatusCounts[issue.status] !== undefined) {
        issueStatusCounts[issue.status]++
      }
    }

    // Compute issue priority counts
    const issuePriorityCounts: Record<string, number> = {
      none: 0,
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    }
    for (const issue of allIssues) {
      if (issuePriorityCounts[issue.priority] !== undefined) {
        issuePriorityCounts[issue.priority]++
      }
    }

    // Compute agent status counts
    const agentStatusCounts: Record<string, number> = {
      idle: 0,
      working: 0,
      blocked: 0,
      error: 0,
      offline: 0,
    }
    for (const agent of agents) {
      if (agentStatusCounts[agent.status] !== undefined) {
        agentStatusCounts[agent.status]++
      }
    }

    // Compute task status counts from groupBy result
    const taskStatusCounts: Record<string, number> = {}
    for (const ts of taskStats) {
      taskStatusCounts[ts.status] = ts._count.status
    }

    // Compute project progress
    const projectProgress = projects.map((project) => {
      const totalIssues = project._count.issues
      const doneIssues = project.issues.filter(
        (i) => i.status === 'done'
      ).length
      const progress =
        totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0
      return {
        id: project.id,
        name: project.name,
        icon: project.icon,
        status: project.status,
        totalIssues,
        doneIssues,
        progress,
      }
    })

    return NextResponse.json({
      workspace,
      overview: {
        totalIssues: allIssues.length,
        issueStatusCounts,
        issuePriorityCounts,
        agentStatusCounts,
        taskStatusCounts,
      },
      agents,
      projects: projectProgress,
      recentActivity: workspaceActivity,
      activeTasks,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
