import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /api/seed - Full demo data reset
export async function POST() {
  try {
    // Clean existing data (delete in reverse dependency order)
    await db().activityLog.deleteMany()
    await db().chatMessage.deleteMany()
    await db().agentTask.deleteMany()
    await db().agentSkill.deleteMany()
    await db().issueToLabel.deleteMany()
    await db().issueSubscriber.deleteMany()
    await db().issueDependency.deleteMany()
    await db().comment.deleteMany()
    await db().issue.deleteMany()
    await db().chatSession.deleteMany()
    await db().projectResource.deleteMany()
    await db().project.deleteMany()
    await db().autopilotRun.deleteMany()
    await db().autopilotTrigger.deleteMany()
    await db().autopilot.deleteMany()
    await db().agentRuntime.deleteMany()
    await db().skillFile.deleteMany()
    await db().skill.deleteMany()
    await db().agent.deleteMany()
    await db().inboxItem.deleteMany()
    await db().pinnedItem.deleteMany()
    await db().invitation.deleteMany()
    await db().member.deleteMany()
    await db().user.deleteMany()
    await db().workspace.deleteMany()

    const now = new Date()
    const day = (n: number) => new Date(now.getTime() - n * 86400000)

    // ============ USERS ============
    const user1 = await db().user.create({ data: { email: 'alex@agenthub.dev', name: 'Alex Chen' } })
    const user2 = await db().user.create({ data: { email: 'sarah@agenthub.dev', name: 'Sarah Kim' } })
    const user3 = await db().user.create({ data: { email: 'mike@agenthub.dev', name: 'Mike Rivera' } })

    // ============ WORKSPACE ============
    const workspace = await db().workspace.create({
      data: {
        name: 'AgentHub Team',
        slug: 'agenthub',
        description: 'A collaborative workspace for multi-agent software development. Orchestrating AI agents to build better software, faster.',
        context: 'Follow the workspace conventions: write clean, tested code; use conventional commits; always review PRs before merging.',
        icon: '🤖',
        issuePrefix: 'AH',
      },
    })

    // ============ MEMBERS ============
    await db().member.createMany({
      data: [
        { role: 'owner', userId: user1.id, workspaceId: workspace.id },
        { role: 'admin', userId: user2.id, workspaceId: workspace.id },
        { role: 'member', userId: user3.id, workspaceId: workspace.id },
      ],
    })

    // ============ AGENTS ============
    const agentClaude = await db().agent.create({
      data: {
        name: 'Claude Code',
        description: 'Senior full-stack engineer specialized in TypeScript, React, and system design.',
        provider: 'claude',
        instructions: 'You are Claude Code, a senior software engineer. Write clean, well-tested TypeScript code.',
        status: 'working',
        maxConcurrentTasks: 3,
        visibility: 'workspace',
        workspaceId: workspace.id,
      },
    })
    const agentCodex = await db().agent.create({
      data: {
        name: 'Codex',
        description: 'Backend specialist focused on APIs, databases, and infrastructure.',
        provider: 'codex',
        instructions: 'You are Codex, a backend infrastructure specialist.',
        status: 'idle',
        maxConcurrentTasks: 5,
        visibility: 'workspace',
        workspaceId: workspace.id,
      },
    })
    const agentGemini = await db().agent.create({
      data: {
        name: 'Gemini Analyst',
        description: 'Data analyst and QA specialist.',
        provider: 'gemini',
        instructions: 'You are Gemini Analyst, a QA and analysis specialist.',
        status: 'working',
        maxConcurrentTasks: 2,
        visibility: 'workspace',
        workspaceId: workspace.id,
      },
    })
    const agentCustom = await db().agent.create({
      data: {
        name: 'DevOps Bot',
        description: 'CI/CD and DevOps automation agent.',
        provider: 'custom',
        instructions: 'You are DevOps Bot, responsible for CI/CD pipelines.',
        status: 'offline',
        maxConcurrentTasks: 1,
        visibility: 'workspace',
        workspaceId: workspace.id,
      },
    })

    // ============ SKILLS ============
    const skillCodeReview = await db().skill.create({
      data: { name: 'Code Review', description: 'Thorough code review checklist.', content: '# Code Review\n\n- Correctness\n- Readability\n- Performance\n- Security', category: 'review', source: 'manual', workspaceId: workspace.id },
    })
    const skillTDD = await db().skill.create({
      data: { name: 'Test-Driven Development', description: 'TDD workflow.', content: '# TDD\n\n1. Red: Write failing test\n2. Green: Make it pass\n3. Refactor', category: 'testing', source: 'manual', workspaceId: workspace.id },
    })
    const skillSecurity = await db().skill.create({
      data: { name: 'Security Audit', description: 'Security vulnerability scanning.', content: '# Security\n\n- XSS prevention\n- SQL Injection\n- CSRF\n- Input validation', category: 'security', source: 'manual', workspaceId: workspace.id },
    })
    const skillApiDesign = await db().skill.create({
      data: { name: 'API Design', description: 'RESTful API design patterns.', content: '# API Design\n\n- RESTful conventions\n- HTTP methods\n- Error format', category: 'engineering', source: 'manual', type: 'tool', workspaceId: workspace.id },
    })
    const skillGitWorkflow = await db().skill.create({
      data: { name: 'Git Workflow', description: 'Git conventions and PR workflows.', content: '# Git Workflow\n\n- Conventional commits\n- Feature branches\n- PR review', category: 'git', source: 'manual', type: 'tool', workspaceId: workspace.id },
    })

    // ============ AGENT-SKILL ============
    await db().agentSkill.createMany({
      data: [
        { agentId: agentClaude.id, skillId: skillCodeReview.id },
        { agentId: agentClaude.id, skillId: skillTDD.id },
        { agentId: agentClaude.id, skillId: skillGitWorkflow.id },
        { agentId: agentCodex.id, skillId: skillApiDesign.id },
        { agentId: agentCodex.id, skillId: skillGitWorkflow.id },
        { agentId: agentGemini.id, skillId: skillCodeReview.id },
        { agentId: agentGemini.id, skillId: skillSecurity.id },
        { agentId: agentGemini.id, skillId: skillTDD.id },
        { agentId: agentCustom.id, skillId: skillGitWorkflow.id },
        { agentId: agentCustom.id, skillId: skillSecurity.id },
      ],
    })

    // ============ PROJECTS ============
    const projectFrontend = await db().project.create({
      data: { title: 'AgentHub Dashboard', description: 'Main dashboard UI with real-time agent monitoring.', icon: '📊', status: 'in_progress', priority: 'high', workspaceId: workspace.id },
    })
    const projectBackend = await db().project.create({
      data: { title: 'API Gateway v2', description: 'Next-generation API gateway.', icon: '🔀', status: 'planned', priority: 'medium', workspaceId: workspace.id },
    })

    // ============ LABELS ============
    const labelFrontend = await db().issueLabel.create({ data: { name: 'frontend', color: '#3b82f6', workspaceId: workspace.id } })
    const labelBackend = await db().issueLabel.create({ data: { name: 'backend', color: '#10b981', workspaceId: workspace.id } })
    const labelTesting = await db().issueLabel.create({ data: { name: 'testing', color: '#f59e0b', workspaceId: workspace.id } })
    const labelDevops = await db().issueLabel.create({ data: { name: 'devops', color: '#ef4444', workspaceId: workspace.id } })
    const labelSecurity = await db().issueLabel.create({ data: { name: 'security', color: '#8b5cf6', workspaceId: workspace.id } })

    // ============ ISSUES ============
    const issues = await Promise.all([
      db().issue.create({ data: { identifier: 'AH-1', title: 'Implement dark mode theme toggle', description: 'Add a dark mode toggle that persists user preference.', status: 'backlog', priority: 'low', workspaceId: workspace.id, projectId: projectFrontend.id, createdAt: day(14) } }),
      db().issue.create({ data: { identifier: 'AH-2', title: 'Add keyboard shortcuts for common actions', description: 'Implement keyboard shortcuts: Cmd+K for search.', status: 'backlog', priority: 'none', workspaceId: workspace.id, projectId: projectFrontend.id, createdAt: day(12) } }),
      db().issue.create({ data: { identifier: 'AH-3', title: 'Set up rate limiting middleware', description: 'Implement sliding window rate limiting.', status: 'todo', priority: 'high', assigneeType: 'agent', assigneeId: agentCodex.id, workspaceId: workspace.id, projectId: projectBackend.id, dueDate: day(-7), createdAt: day(10) } }),
      db().issue.create({ data: { identifier: 'AH-4', title: 'Design agent collaboration protocol', description: 'Define communication protocol between agents.', status: 'todo', priority: 'urgent', workspaceId: workspace.id, projectId: projectBackend.id, dueDate: day(-3), createdAt: day(8) } }),
      db().issue.create({ data: { identifier: 'AH-5', title: 'Build real-time agent status panel', description: 'Create a live-updating panel showing agent statuses.', status: 'in_progress', priority: 'high', assigneeType: 'agent', assigneeId: agentClaude.id, workspaceId: workspace.id, projectId: projectFrontend.id, dueDate: day(-2), createdAt: day(7) } }),
      db().issue.create({ data: { identifier: 'AH-6', title: 'Implement WebSocket event broadcasting', description: 'Set up Socket.IO event system.', status: 'in_progress', priority: 'high', assigneeType: 'agent', assigneeId: agentCodex.id, workspaceId: workspace.id, projectId: projectFrontend.id, createdAt: day(5) } }),
      db().issue.create({ data: { identifier: 'AH-7', title: 'Add comprehensive error boundary components', description: 'Create React error boundaries.', status: 'in_review', priority: 'medium', assigneeType: 'agent', assigneeId: agentClaude.id, workspaceId: workspace.id, projectId: projectFrontend.id, createdAt: day(9) } }),
      db().issue.create({ data: { identifier: 'AH-8', title: 'Write API endpoint integration tests', description: 'Add integration tests for all API endpoints.', status: 'in_review', priority: 'medium', assigneeType: 'agent', assigneeId: agentGemini.id, workspaceId: workspace.id, createdAt: day(6) } }),
      db().issue.create({ data: { identifier: 'AH-9', title: 'Initialize Prisma schema with all models', description: 'Define the complete database schema.', status: 'done', priority: 'urgent', assigneeType: 'agent', assigneeId: agentCodex.id, workspaceId: workspace.id, projectId: projectBackend.id, closedAt: day(18), createdAt: day(20) } }),
      db().issue.create({ data: { identifier: 'AH-10', title: 'Set up project scaffolding with Next.js 16', description: 'Initialize Next.js 16 project.', status: 'done', priority: 'urgent', assigneeType: 'agent', assigneeId: agentClaude.id, workspaceId: workspace.id, projectId: projectFrontend.id, closedAt: day(19), createdAt: day(21) } }),
      db().issue.create({ data: { identifier: 'AH-11', title: 'Create sidebar navigation component', description: 'Build responsive sidebar with navigation links.', status: 'done', priority: 'medium', assigneeType: 'agent', assigneeId: agentClaude.id, workspaceId: workspace.id, projectId: projectFrontend.id, closedAt: day(12), createdAt: day(15) } }),
      db().issue.create({ data: { identifier: 'AH-12', title: 'Configure Docker multi-stage build', description: 'Set up Dockerfile with multi-stage build.', status: 'done', priority: 'medium', assigneeType: 'agent', assigneeId: agentCustom.id, workspaceId: workspace.id, projectId: projectBackend.id, closedAt: day(8), createdAt: day(18) } }),
    ])

    // ============ ISSUE-LABEL ============
    await db().issueToLabel.createMany({
      data: [
        { issueId: issues[0].id, labelId: labelFrontend.id },
        { issueId: issues[2].id, labelId: labelBackend.id },
        { issueId: issues[3].id, labelId: labelBackend.id },
        { issueId: issues[4].id, labelId: labelFrontend.id },
        { issueId: issues[5].id, labelId: labelBackend.id },
        { issueId: issues[7].id, labelId: labelTesting.id },
        { issueId: issues[8].id, labelId: labelBackend.id },
        { issueId: issues[11].id, labelId: labelDevops.id },
      ],
    })

    // ============ COMMENTS ============
    await db().comment.createMany({
      data: [
        { content: 'The error boundary should catch async errors too. Consider using a custom hook.', authorType: 'agent', authorId: agentClaude.id, authorName: 'Claude Code', issueId: issues[6].id, workspaceId: workspace.id, createdAt: day(4) },
        { content: "Good point! I'll add an useAsyncError hook. Should we also log errors to an external service?", authorType: 'member', authorId: user3.id, authorName: 'Mike Rivera', issueId: issues[6].id, workspaceId: workspace.id, createdAt: day(3) },
        { content: 'Integration tests are passing for all CRUD endpoints. Need to add rate limiting tests once the middleware is implemented.', authorType: 'agent', authorId: agentGemini.id, authorName: 'Gemini Analyst', issueId: issues[7].id, workspaceId: workspace.id, createdAt: day(2) },
        { content: 'The real-time panel needs to handle reconnection gracefully. What about showing a "Reconnecting..." overlay when the WebSocket drops?', authorType: 'member', authorId: user2.id, authorName: 'Sarah Kim', issueId: issues[4].id, workspaceId: workspace.id, createdAt: day(1) },
      ],
    })

    // ============ CHAT SESSIONS ============
    const chat1 = await db().chatSession.create({ data: { title: 'Refactoring auth module', workspaceId: workspace.id, agentId: agentClaude.id } })
    const chat2 = await db().chatSession.create({ data: { title: 'Performance optimization brainstorm', workspaceId: workspace.id, agentId: agentGemini.id, unreadCount: 1 } })

    await db().chatMessage.createMany({
      data: [
        { role: 'user', content: 'Can you refactor the authentication module to use JWT refresh tokens?', sessionId: chat1.id, createdAt: day(3) },
        { role: 'assistant', content: "I'll refactor the auth module. Here's my plan:\n\n1. Implement JWT access/refresh token pair generation\n2. Add refresh token rotation\n3. Create middleware for automatic token refresh\n4. Update the login/logout flows", sessionId: chat1.id, createdAt: day(3) },
        { role: 'user', content: 'Sounds good. Make sure to handle token expiry gracefully with proper error messages.', sessionId: chat1.id, createdAt: day(2) },
        { role: 'assistant', content: "Done! I've implemented the refresh token flow. Key changes:\n\n- Access tokens expire in 15min, refresh tokens in 7 days\n- Automatic silent refresh within 5min of expiry\n- Clear error messages for 401 responses\n- Refresh token rotation on each use", sessionId: chat1.id, createdAt: day(2) },
        { role: 'user', content: 'The dashboard is loading slowly. Can you analyze potential bottlenecks?', sessionId: chat2.id, createdAt: day(1) },
        { role: 'assistant', content: "I've analyzed the dashboard and found several performance issues:\n\n1. **Database queries**: 5 separate queries - should use JOIN\n2. **Component rendering**: Agent cards re-render on every parent state change\n3. **Bundle size**: Chart library not tree-shaking correctly\n4. **API calls**: Dashboard fetches all data separately\n\nEstimated improvement: 3-5x faster initial load.", sessionId: chat2.id, createdAt: day(1) },
      ],
    })

    // ============ AGENT TASKS ============
    await db().agentTask.createMany({
      data: [
        { status: 'completed', output: 'Successfully implemented the real-time agent status panel with WebSocket integration.', tokensUsed: 4520, startedAt: day(4), completedAt: day(3), agentId: agentClaude.id, issueId: issues[4].id },
        { status: 'running', tokensUsed: 1800, startedAt: day(1), agentId: agentClaude.id, issueId: issues[4].id },
        { status: 'completed', output: 'WebSocket event system implemented. Events: agent:status, task:update, issue:update.', tokensUsed: 3200, startedAt: day(3), completedAt: day(2), agentId: agentCodex.id, issueId: issues[5].id },
        { status: 'running', output: 'Running integration tests... 42/50 passed so far.', tokensUsed: 5600, startedAt: day(2), agentId: agentGemini.id, issueId: issues[7].id },
        { status: 'queued', agentId: agentCodex.id, issueId: issues[2].id },
        { status: 'failed', output: 'Docker build failed: Error installing native dependencies.', tokensUsed: 2100, startedAt: day(10), completedAt: day(10), agentId: agentCustom.id, issueId: issues[11].id },
        { status: 'completed', output: 'Docker multi-stage build configured. Image size: 180MB.', tokensUsed: 3400, startedAt: day(9), completedAt: day(8), agentId: agentCustom.id, issueId: issues[11].id },
        { status: 'completed', output: 'Auth module refactored with JWT refresh tokens. All tests passing.', tokensUsed: 6200, startedAt: day(3), completedAt: day(2), agentId: agentClaude.id, chatSessionId: chat1.id },
        { status: 'running', output: 'Analyzing dashboard performance bottlenecks...', tokensUsed: 2800, startedAt: day(1), agentId: agentGemini.id, chatSessionId: chat2.id },
      ],
    })

    // ============ ACTIVITY LOGS ============
    await db().activityLog.createMany({
      data: [
        { action: 'created', entityType: 'issue', entityId: issues[0].id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', issueId: issues[0].id, workspaceId: workspace.id, createdAt: day(14) },
        { action: 'assigned', entityType: 'issue', entityId: issues[2].id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', details: { assignee: 'Codex' }, issueId: issues[2].id, workspaceId: workspace.id, createdAt: day(9) },
        { action: 'status_changed', entityType: 'issue', entityId: issues[4].id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', details: { from: 'todo', to: 'in_progress' }, issueId: issues[4].id, workspaceId: workspace.id, createdAt: day(7) },
        { action: 'commented', entityType: 'issue', entityId: issues[4].id, actorType: 'member', actorId: user2.id, actorName: 'Sarah Kim', issueId: issues[4].id, workspaceId: workspace.id, createdAt: day(1) },
        { action: 'status_changed', entityType: 'issue', entityId: issues[8].id, actorType: 'agent', actorId: agentCodex.id, actorName: 'Codex', details: { from: 'in_progress', to: 'done' }, issueId: issues[8].id, workspaceId: workspace.id, createdAt: day(18) },
        { action: 'status_changed', entityType: 'issue', entityId: issues[9].id, actorType: 'agent', actorId: agentClaude.id, actorName: 'Claude Code', details: { from: 'in_progress', to: 'done' }, issueId: issues[9].id, workspaceId: workspace.id, createdAt: day(19) },
        { action: 'status_changed', entityType: 'issue', entityId: issues[10].id, actorType: 'agent', actorId: agentClaude.id, actorName: 'Claude Code', details: { from: 'in_review', to: 'done' }, issueId: issues[10].id, workspaceId: workspace.id, createdAt: day(12) },
        { action: 'created', entityType: 'project', entityId: projectFrontend.id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', workspaceId: workspace.id, createdAt: day(21) },
        { action: 'created', entityType: 'project', entityId: projectBackend.id, actorType: 'member', actorId: user1.id, actorName: 'Alex Chen', workspaceId: workspace.id, createdAt: day(16) },
        { action: 'commented', entityType: 'issue', entityId: issues[6].id, actorType: 'agent', actorId: agentClaude.id, actorName: 'Claude Code', issueId: issues[6].id, workspaceId: workspace.id, createdAt: day(4) },
      ],
    })

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      stats: {
        workspaces: 1,
        users: 3,
        agents: 4,
        skills: 5,
        issues: issues.length,
        projects: 2,
        labels: 5,
        chatSessions: 2,
        comments: 4,
        activityLogs: 10,
      },
    })
  } catch (error) {
    console.error('Error seeding data:', error)
    return NextResponse.json(
      { error: 'Failed to seed demo data', details: String(error) },
      { status: 500 }
    )
  }
}
