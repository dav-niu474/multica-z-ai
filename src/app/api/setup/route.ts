import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/setup - Ensure database is set up and seed demo data
export async function POST(_request: NextRequest) {
  try {
    // Verify database is accessible
    const workspaceCount = await db().workspace.count()

    // If no workspaces exist, seed demo data
    if (workspaceCount === 0) {
      const now = new Date()
      const day = (n: number) => new Date(now.getTime() - n * 86400000)

      // Users
      const user1 = await db().user.create({
        data: { email: 'alex@agenthub.dev', name: 'Alex Chen' },
      })
      const user2 = await db().user.create({
        data: { email: 'sarah@agenthub.dev', name: 'Sarah Kim' },
      })
      const user3 = await db().user.create({
        data: { email: 'mike@agenthub.dev', name: 'Mike Rivera' },
      })

      // Workspace
      const workspace = await db().workspace.create({
        data: {
          name: 'AgentHub Team',
          slug: 'agenthub',
          description: 'A collaborative workspace for multi-agent software development.',
          context: 'Follow the workspace conventions: write clean, tested code; use conventional commits.',
          icon: '🤖',
          issuePrefix: 'AH',
        },
      })

      // Members
      await db().member.createMany({
        data: [
          { role: 'owner', userId: user1.id, workspaceId: workspace.id },
          { role: 'admin', userId: user2.id, workspaceId: workspace.id },
          { role: 'member', userId: user3.id, workspaceId: workspace.id },
        ],
      })

      // Agents
      const [a1, a2, a3, a4] = await Promise.all([
        db().agent.create({ data: { name: 'Claude Code', description: 'Senior full-stack engineer.', provider: 'claude', status: 'working', workspaceId: workspace.id } }),
        db().agent.create({ data: { name: 'Codex', description: 'Backend specialist.', provider: 'codex', status: 'idle', maxConcurrentTasks: 5, workspaceId: workspace.id } }),
        db().agent.create({ data: { name: 'Gemini Analyst', description: 'QA specialist.', provider: 'gemini', status: 'working', maxConcurrentTasks: 2, workspaceId: workspace.id } }),
        db().agent.create({ data: { name: 'DevOps Bot', description: 'CI/CD automation.', provider: 'custom', status: 'offline', maxConcurrentTasks: 1, workspaceId: workspace.id } }),
      ])

      // Skills
      const [s1, s2, s3, s4, s5] = await Promise.all([
        db().skill.create({ data: { name: 'Code Review', type: 'skill', category: 'review', content: '# Code Review\n\n- Correctness\n- Readability\n- Performance\n- Security', workspaceId: workspace.id } }),
        db().skill.create({ data: { name: 'TDD', type: 'skill', category: 'testing', content: '# TDD\n\n1. Red: Write failing test\n2. Green: Make it pass\n3. Refactor', workspaceId: workspace.id } }),
        db().skill.create({ data: { name: 'Security Audit', type: 'skill', category: 'security', content: '# Security\n\n- XSS prevention\n- SQL Injection\n- CSRF\n- Input validation', workspaceId: workspace.id } }),
        db().skill.create({ data: { name: 'API Design', type: 'tool', category: 'engineering', content: '# API Design\n\n- RESTful conventions\n- HTTP methods\n- Error format', workspaceId: workspace.id } }),
        db().skill.create({ data: { name: 'Git Workflow', type: 'tool', category: 'git', content: '# Git Workflow\n\n- Conventional commits\n- Feature branches\n- PR review', workspaceId: workspace.id } }),
      ])

      // Agent-Skill associations
      await db().agentSkill.createMany({
        data: [
          { agentId: a1.id, skillId: s1.id }, { agentId: a1.id, skillId: s2.id }, { agentId: a1.id, skillId: s5.id },
          { agentId: a2.id, skillId: s4.id }, { agentId: a2.id, skillId: s5.id },
          { agentId: a3.id, skillId: s1.id }, { agentId: a3.id, skillId: s3.id }, { agentId: a3.id, skillId: s2.id },
          { agentId: a4.id, skillId: s5.id }, { agentId: a4.id, skillId: s3.id },
        ],
      })

      // Projects
      const [p1, p2] = await Promise.all([
        db().project.create({ data: { title: 'AgentHub Dashboard', icon: '📊', status: 'in_progress', priority: 'high', workspaceId: workspace.id } }),
        db().project.create({ data: { title: 'API Gateway v2', icon: '🔀', status: 'planned', priority: 'medium', workspaceId: workspace.id } }),
      ])

      // Labels
      const [l1, l2, l3, l4] = await Promise.all([
        db().issueLabel.create({ data: { name: 'frontend', color: '#3b82f6', workspaceId: workspace.id } }),
        db().issueLabel.create({ data: { name: 'backend', color: '#10b981', workspaceId: workspace.id } }),
        db().issueLabel.create({ data: { name: 'testing', color: '#f59e0b', workspaceId: workspace.id } }),
        db().issueLabel.create({ data: { name: 'devops', color: '#ef4444', workspaceId: workspace.id } }),
      ])

      // Issues
      const issues = await Promise.all([
        db().issue.create({ data: { identifier: 'AH-1', title: 'Implement dark mode toggle', status: 'backlog', priority: 'low', workspaceId: workspace.id, projectId: p1.id, createdAt: day(14) } }),
        db().issue.create({ data: { identifier: 'AH-2', title: 'Add keyboard shortcuts', status: 'backlog', priority: 'none', workspaceId: workspace.id, projectId: p1.id, createdAt: day(12) } }),
        db().issue.create({ data: { identifier: 'AH-3', title: 'Set up rate limiting', status: 'todo', priority: 'high', assigneeType: 'agent', assigneeId: a2.id, workspaceId: workspace.id, projectId: p2.id, dueDate: day(-7), createdAt: day(10) } }),
        db().issue.create({ data: { identifier: 'AH-4', title: 'Design agent collaboration protocol', status: 'todo', priority: 'urgent', workspaceId: workspace.id, projectId: p2.id, dueDate: day(-3), createdAt: day(8) } }),
        db().issue.create({ data: { identifier: 'AH-5', title: 'Build real-time agent status panel', status: 'in_progress', priority: 'high', assigneeType: 'agent', assigneeId: a1.id, workspaceId: workspace.id, projectId: p1.id, dueDate: day(-2), createdAt: day(7) } }),
        db().issue.create({ data: { identifier: 'AH-6', title: 'WebSocket event broadcasting', status: 'in_progress', priority: 'high', assigneeType: 'agent', assigneeId: a2.id, workspaceId: workspace.id, projectId: p1.id, createdAt: day(5) } }),
        db().issue.create({ data: { identifier: 'AH-7', title: 'Add error boundary components', status: 'in_review', priority: 'medium', assigneeType: 'agent', assigneeId: a1.id, workspaceId: workspace.id, projectId: p1.id, createdAt: day(9) } }),
        db().issue.create({ data: { identifier: 'AH-8', title: 'Write API integration tests', status: 'in_review', priority: 'medium', assigneeType: 'agent', assigneeId: a3.id, workspaceId: workspace.id, createdAt: day(6) } }),
        db().issue.create({ data: { identifier: 'AH-9', title: 'Initialize Prisma schema', status: 'done', priority: 'urgent', assigneeType: 'agent', assigneeId: a2.id, workspaceId: workspace.id, projectId: p2.id, closedAt: day(18), createdAt: day(20) } }),
        db().issue.create({ data: { identifier: 'AH-10', title: 'Set up Next.js 16 project', status: 'done', priority: 'urgent', assigneeType: 'agent', assigneeId: a1.id, workspaceId: workspace.id, projectId: p1.id, closedAt: day(19), createdAt: day(21) } }),
        db().issue.create({ data: { identifier: 'AH-11', title: 'Create sidebar navigation', status: 'done', priority: 'medium', assigneeType: 'agent', assigneeId: a1.id, workspaceId: workspace.id, projectId: p1.id, closedAt: day(12), createdAt: day(15) } }),
        db().issue.create({ data: { identifier: 'AH-12', title: 'Configure Docker build', status: 'done', priority: 'medium', assigneeType: 'agent', assigneeId: a4.id, workspaceId: workspace.id, projectId: p2.id, closedAt: day(8), createdAt: day(18) } }),
      ])

      // Issue-Label associations
      await db().issueToLabel.createMany({
        data: [
          { issueId: issues[0].id, labelId: l1.id },
          { issueId: issues[2].id, labelId: l2.id },
          { issueId: issues[4].id, labelId: l1.id },
          { issueId: issues[5].id, labelId: l2.id },
          { issueId: issues[7].id, labelId: l3.id },
          { issueId: issues[8].id, labelId: l2.id },
          { issueId: issues[11].id, labelId: l4.id },
        ],
      })

      // Comments
      await db().comment.createMany({
        data: [
          { content: 'The error boundary should catch async errors too.', authorType: 'agent', authorId: a1.id, authorName: 'Claude Code', issueId: issues[6].id, workspaceId: workspace.id, createdAt: day(4) },
          { content: "Good point! I'll add a useAsyncError hook.", authorType: 'member', authorId: user3.id, authorName: 'Mike Rivera', issueId: issues[6].id, workspaceId: workspace.id, createdAt: day(3) },
          { content: 'Integration tests passing for all CRUD endpoints.', authorType: 'agent', authorId: a3.id, authorName: 'Gemini Analyst', issueId: issues[7].id, workspaceId: workspace.id, createdAt: day(2) },
          { content: 'The real-time panel needs reconnection handling.', authorType: 'member', authorId: user2.id, authorName: 'Sarah Kim', issueId: issues[4].id, workspaceId: workspace.id, createdAt: day(1) },
        ],
      })

      // Chat Sessions + Messages
      const [chat1, chat2] = await Promise.all([
        db().chatSession.create({ data: { title: 'Refactoring auth module', workspaceId: workspace.id, agentId: a1.id } }),
        db().chatSession.create({ data: { title: 'Performance optimization', workspaceId: workspace.id, agentId: a3.id, unreadCount: 1 } }),
      ])

      await db().chatMessage.createMany({
        data: [
          { role: 'user', content: 'Can you refactor the auth module to use JWT?', sessionId: chat1.id, createdAt: day(3) },
          { role: 'assistant', content: 'I will implement JWT access/refresh token pairs with rotation.', sessionId: chat1.id, createdAt: day(3) },
          { role: 'user', content: 'Handle token expiry gracefully.', sessionId: chat1.id, createdAt: day(2) },
          { role: 'assistant', content: 'Done! JWT refresh tokens implemented.', sessionId: chat1.id, createdAt: day(2) },
          { role: 'user', content: 'Dashboard loading slowly. Analyze bottlenecks?', sessionId: chat2.id, createdAt: day(1) },
          { role: 'assistant', content: 'Found: 5 separate DB queries, component re-renders, bad tree-shaking.', sessionId: chat2.id, createdAt: day(1) },
        ],
      })

      // Agent Tasks
      await db().agentTask.createMany({
        data: [
          { status: 'completed', output: 'Real-time panel with WebSocket done.', tokensUsed: 4520, startedAt: day(4), completedAt: day(3), agentId: a1.id, issueId: issues[4].id },
          { status: 'running', tokensUsed: 1800, startedAt: day(1), agentId: a1.id, issueId: issues[4].id },
          { status: 'completed', output: 'WebSocket events implemented.', tokensUsed: 3200, startedAt: day(3), completedAt: day(2), agentId: a2.id, issueId: issues[5].id },
          { status: 'running', output: 'Running tests... 42/50 passed.', tokensUsed: 5600, startedAt: day(2), agentId: a3.id, issueId: issues[7].id },
          { status: 'queued', agentId: a2.id, issueId: issues[2].id },
          { status: 'failed', output: 'Docker build failed.', tokensUsed: 2100, startedAt: day(10), completedAt: day(10), agentId: a4.id, issueId: issues[11].id },
          { status: 'completed', output: 'Docker build: 180MB.', tokensUsed: 3400, startedAt: day(9), completedAt: day(8), agentId: a4.id, issueId: issues[11].id },
          { status: 'completed', output: 'Auth JWT done.', tokensUsed: 6200, startedAt: day(3), completedAt: day(2), agentId: a1.id, chatSessionId: chat1.id },
          { status: 'running', output: 'Analyzing performance...', tokensUsed: 2800, startedAt: day(1), agentId: a3.id, chatSessionId: chat2.id },
        ],
      })

      // Activity Logs
      await db().activityLog.createMany({
        data: [
          { action: 'created', entityType: 'issue', entityId: issues[0].id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', issueId: issues[0].id, workspaceId: workspace.id, createdAt: day(14) },
          { action: 'assigned', entityType: 'issue', entityId: issues[2].id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', details: { assignee: 'Codex' }, issueId: issues[2].id, workspaceId: workspace.id, createdAt: day(9) },
          { action: 'status_changed', entityType: 'issue', entityId: issues[4].id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', details: { from: 'todo', to: 'in_progress' }, issueId: issues[4].id, workspaceId: workspace.id, createdAt: day(7) },
          { action: 'commented', entityType: 'issue', entityId: issues[4].id, actorType: 'member', actorId: user2.id, actorName: 'Sarah Kim', issueId: issues[4].id, workspaceId: workspace.id, createdAt: day(1) },
          { action: 'status_changed', entityType: 'issue', entityId: issues[8].id, actorType: 'agent', actorId: a2.id, actorName: 'Codex', details: { from: 'in_progress', to: 'done' }, issueId: issues[8].id, workspaceId: workspace.id, createdAt: day(18) },
          { action: 'status_changed', entityType: 'issue', entityId: issues[9].id, actorType: 'agent', actorId: a1.id, actorName: 'Claude Code', details: { from: 'in_progress', to: 'done' }, issueId: issues[9].id, workspaceId: workspace.id, createdAt: day(19) },
          { action: 'created', entityType: 'project', entityId: p1.id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', workspaceId: workspace.id, createdAt: day(21) },
          { action: 'created', entityType: 'project', entityId: p2.id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', workspaceId: workspace.id, createdAt: day(16) },
        ],
      })

      return NextResponse.json({
        success: true,
        message: 'Database setup completed with demo data',
        stats: {
          workspaces: 1,
          users: 3,
          agents: 4,
          skills: 5,
          issues: issues.length,
          projects: 2,
          labels: 4,
          chatSessions: 2,
          comments: 4,
          activityLogs: 8,
          seeded: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database already set up',
      stats: { seeded: false },
    })
  } catch (error) {
    console.error('Error setting up database:', error)
    return NextResponse.json(
      { error: 'Failed to setup database', details: String(error) },
      { status: 500 }
    )
  }
}
