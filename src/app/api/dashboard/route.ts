import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { resolveWorkspaceId } from '@/lib/auth-utils'

// GET /api/dashboard?workspaceId=xxx - Comprehensive dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const workspaceId = await resolveWorkspaceId(request)
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 401 })
    }

    const [
      workspace,
      agents,
      allIssues,
      projects,
      recentActivity,
      taskStats,
      activeTasks,
      skillCount,
      memberCount,
      chatSessionCount,
    ] = await Promise.all([
      db().workspace.findUnique({
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

      db().agent.findMany({
        where: { workspaceId, isArchived: false },
        include: { _count: { select: { tasks: true } } },
      }),

      db().issue.findMany({
        where: { workspaceId },
        select: { id: true, status: true, priority: true, createdAt: true, updatedAt: true },
      }),

      db().project.findMany({
        where: { workspaceId },
        include: {
          _count: { select: { issues: true } },
          issues: { select: { status: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      db().activityLog.findMany({
        where: { workspaceId },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          issue: { select: { id: true, title: true } },
        },
      }),

      db().agentTask.groupBy({
        by: ['status'],
        where: { agent: { workspaceId } },
        _count: { status: true },
      }),

      db().agentTask.findMany({
        where: { status: 'running', agent: { workspaceId } },
        include: {
          agent: { select: { id: true, name: true, provider: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),

      db().skill.count({ where: { workspaceId } }),

      db().member.count({ where: { workspaceId } }),

      db().chatSession.count({
        where: { workspaceId, isArchived: false },
      }),
    ])

    // Issue status counts
    const issueStatusCounts: Record<string, number> = {
      backlog: 0, todo: 0, in_progress: 0, in_review: 0,
      done: 0, blocked: 0, cancelled: 0,
    }
    for (const issue of allIssues) {
      if (issueStatusCounts[issue.status] !== undefined) {
        issueStatusCounts[issue.status]++
      }
    }

    const openIssues = allIssues.filter(i => !['done', 'cancelled'].includes(i.status)).length
    const completedIssues = issueStatusCounts.done || 0

    // Issue priority counts
    const issuePriorityCounts: Record<string, number> = {
      none: 0, low: 0, medium: 0, high: 0, urgent: 0,
    }
    for (const issue of allIssues) {
      if (issuePriorityCounts[issue.priority] !== undefined) {
        issuePriorityCounts[issue.priority]++
      }
    }

    // Agent status counts
    const agentStatusCounts: Record<string, number> = {
      idle: 0, working: 0, blocked: 0, error: 0, offline: 0,
    }
    for (const agent of agents) {
      if (agentStatusCounts[agent.status] !== undefined) {
        agentStatusCounts[agent.status]++
      }
    }

    // Task status counts
    const taskStatusCounts: Record<string, number> = {}
    for (const ts of taskStats) {
      taskStatusCounts[ts.status] = ts._count.status
    }

    // Project progress
    const projectProgress = projects.map((project) => {
      const totalIssues = project._count.issues
      const doneIssues = project.issues.filter(i => i.status === 'done').length
      const progress = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0
      return {
        id: project.id,
        title: project.title,
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
        openIssues,
        completedIssues,
        totalAgents: agents.length,
        activeAgents: agentStatusCounts.working || 0,
        totalProjects: projects.length,
        totalSkills: skillCount,
        totalMembers: memberCount,
        totalChatSessions: chatSessionCount,
        issueStatusCounts,
        issuePriorityCounts,
        agentStatusCounts,
        taskStatusCounts,
      },
      agents,
      projects: projectProgress,
      recentActivity,
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
