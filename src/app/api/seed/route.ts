import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /api/seed - Seed demo data for AgentHub
export async function POST() {
  try {
    // Clean existing data (delete in reverse dependency order)
    await db.activityLog.deleteMany()
    await db.chatMessage.deleteMany()
    await db.agentTask.deleteMany()
    await db.agentSkill.deleteMany()
    await db.comment.deleteMany()
    await db.issue.deleteMany()
    await db.chatSession.deleteMany()
    await db.project.deleteMany()
    await db.skill.deleteMany()
    await db.agent.deleteMany()
    await db.member.deleteMany()
    await db.user.deleteMany()
    await db.workspace.deleteMany()

    // ============ USERS ============
    const user1 = await db.user.create({
      data: {
        email: 'alex@agenthub.dev',
        name: 'Alex Chen',
        avatar: null,
      },
    })
    const user2 = await db.user.create({
      data: {
        email: 'sarah@agenthub.dev',
        name: 'Sarah Kim',
        avatar: null,
      },
    })
    const user3 = await db.user.create({
      data: {
        email: 'mike@agenthub.dev',
        name: 'Mike Rivera',
        avatar: null,
      },
    })

    // ============ WORKSPACE ============
    const workspace = await db.workspace.create({
      data: {
        name: 'AgentHub Team',
        slug: 'agenthub',
        description:
          'A collaborative workspace for multi-agent software development. Orchestrating AI agents to build better software, faster.',
        context:
          'You are part of AgentHub Team, a multi-agent development environment. Follow the workspace conventions: write clean, tested code; use conventional commits; always review PRs before merging.',
        icon: '🤖',
      },
    })

    // ============ MEMBERS ============
    await db.member.create({
      data: {
        role: 'owner',
        userId: user1.id,
        workspaceId: workspace.id,
      },
    })
    await db.member.create({
      data: {
        role: 'admin',
        userId: user2.id,
        workspaceId: workspace.id,
      },
    })
    await db.member.create({
      data: {
        role: 'member',
        userId: user3.id,
        workspaceId: workspace.id,
      },
    })

    // ============ AGENTS ============
    const agentClaude = await db.agent.create({
      data: {
        name: 'Claude Code',
        description:
          'Senior full-stack engineer specialized in TypeScript, React, and system design. Excels at breaking down complex tasks into clean, maintainable code.',
        provider: 'claude',
        instructions:
          'You are Claude Code, a senior software engineer. Write clean, well-tested TypeScript code. Follow React best practices. Use functional patterns. Add JSDoc comments to complex functions.',
        status: 'working',
        maxConcurrent: 3,
        visibility: 'workspace',
        workspaceId: workspace.id,
      },
    })

    const agentCodex = await db.agent.create({
      data: {
        name: 'Codex',
        description:
          'Backend specialist focused on APIs, databases, and infrastructure. Strong expertise in PostgreSQL, Redis, and microservices architecture.',
        provider: 'codex',
        instructions:
          'You are Codex, a backend infrastructure specialist. Design robust APIs, optimize database queries, and ensure system reliability. Use Prisma ORM patterns.',
        status: 'idle',
        maxConcurrent: 5,
        visibility: 'workspace',
        workspaceId: workspace.id,
      },
    })

    const agentGemini = await db.agent.create({
      data: {
        name: 'Gemini Analyst',
        description:
          'Data analyst and QA specialist. Runs comprehensive test suites, performs code reviews, and generates detailed analysis reports.',
        provider: 'gemini',
        instructions:
          'You are Gemini Analyst, a QA and analysis specialist. Write comprehensive tests, perform thorough code reviews, identify edge cases, and provide detailed reports.',
        status: 'working',
        maxConcurrent: 2,
        visibility: 'workspace',
        workspaceId: workspace.id,
      },
    })

    const agentCustom = await db.agent.create({
      data: {
        name: 'DevOps Bot',
        description:
          'Custom CI/CD and DevOps automation agent. Handles deployment pipelines, Docker configurations, and cloud infrastructure management.',
        provider: 'custom',
        instructions:
          'You are DevOps Bot, responsible for CI/CD pipelines, Docker configs, and infrastructure automation. Always ensure deployments are safe and reversible.',
        status: 'offline',
        maxConcurrent: 1,
        visibility: 'workspace',
        workspaceId: workspace.id,
      },
    })

    // ============ SKILLS ============
    const skillCodeReview = await db.skill.create({
      data: {
        name: 'Code Review',
        description:
          'Thorough code review checklist covering code quality, performance, security, and maintainability.',
        content: `# Code Review Skill

## Checklist
- **Correctness**: Does the code do what it's supposed to?
- **Readability**: Is the code easy to understand?
- **Performance**: Are there any performance bottlenecks?
- **Security**: Are there any security vulnerabilities?
- **Testing**: Are there adequate tests?
- **Documentation**: Is the code well documented?

## Process
1. Read the diff carefully
2. Check for edge cases
3. Verify error handling
4. Review naming conventions
5. Look for code smells
6. Suggest improvements`,
        category: 'review',
        source: 'manual',
        workspaceId: workspace.id,
      },
    })

    const skillTDD = await db.skill.create({
      data: {
        name: 'Test-Driven Development',
        description:
          'TDD workflow: write failing test → implement minimum code → refactor → repeat.',
        content: `# TDD Skill

## Red-Green-Refactor Cycle
1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Clean up the code while keeping tests green

## Principles
- Write tests before implementation
- Each test should test ONE thing
- Use descriptive test names that explain expected behavior
- Mock external dependencies
- Aim for >80% code coverage`,
        category: 'testing',
        source: 'manual',
        workspaceId: workspace.id,
      },
    })

    const skillSecurity = await db.skill.create({
      data: {
        name: 'Security Audit',
        description:
          'Security vulnerability scanning and best practices enforcement for web applications.',
        content: `# Security Audit Skill

## Common Vulnerabilities to Check
- **XSS**: Cross-site scripting prevention
- **SQL Injection**: Parameterized queries
- **CSRF**: Token-based protection
- **Authentication**: Secure password handling
- **Authorization**: Proper access control
- **Data Exposure**: Sensitive data protection
- **Dependencies**: Known vulnerability scanning

## OWASP Top 10
Review code against the OWASP Top 10 security risks.`,
        category: 'review',
        source: 'manual',
        workspaceId: workspace.id,
      },
    })

    const skillApiDesign = await db.skill.create({
      data: {
        name: 'API Design',
        description:
          'RESTful API design patterns, versioning strategies, and documentation standards.',
        content: `# API Design Skill

## RESTful Conventions
- Use nouns for resources, not verbs
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Consistent error response format
- Pagination for list endpoints
- API versioning strategy

## Response Format
\`\`\`json
{
  "data": {},
  "error": null,
  "meta": { "page": 1, "total": 100 }
}
\`\`\`

## Best Practices
- Use OpenAPI/Swagger documentation
- Rate limiting
- Input validation
- CORS configuration`,
        category: 'engineering',
        source: 'manual',
        workspaceId: workspace.id,
      },
    })

    const skillGitWorkflow = await db.skill.create({
      data: {
        name: 'Git Workflow',
        description:
          'Git conventions, branching strategies, commit message formats, and PR workflows.',
        content: `# Git Workflow Skill

## Commit Messages (Conventional Commits)
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

## Branch Naming
- feature/description
- fix/description
- hotfix/description

## PR Process
1. Create feature branch from main
2. Make atomic commits
3. Push and create PR
4. Address review feedback
5. Squash and merge`,
        category: 'engineering',
        source: 'manual',
        workspaceId: workspace.id,
      },
    })

    // ============ AGENT-SKILL ASSOCIATIONS ============
    await db.agentSkill.create({ data: { agentId: agentClaude.id, skillId: skillCodeReview.id } })
    await db.agentSkill.create({ data: { agentId: agentClaude.id, skillId: skillTDD.id } })
    await db.agentSkill.create({ data: { agentId: agentClaude.id, skillId: skillGitWorkflow.id } })
    await db.agentSkill.create({ data: { agentId: agentCodex.id, skillId: skillApiDesign.id } })
    await db.agentSkill.create({ data: { agentId: agentCodex.id, skillId: skillGitWorkflow.id } })
    await db.agentSkill.create({ data: { agentId: agentGemini.id, skillId: skillCodeReview.id } })
    await db.agentSkill.create({ data: { agentId: agentGemini.id, skillId: skillSecurity.id } })
    await db.agentSkill.create({ data: { agentId: agentGemini.id, skillId: skillTDD.id } })
    await db.agentSkill.create({ data: { agentId: agentCustom.id, skillId: skillGitWorkflow.id } })
    await db.agentSkill.create({ data: { agentId: agentCustom.id, skillId: skillSecurity.id } })

    // ============ PROJECTS ============
    const projectFrontend = await db.project.create({
      data: {
        name: 'AgentHub Dashboard',
        description: 'Main dashboard UI with real-time agent monitoring, issue tracking, and team collaboration features.',
        icon: '📊',
        status: 'in_progress',
        priority: 'high',
        workspaceId: workspace.id,
      },
    })

    const projectBackend = await db.project.create({
      data: {
        name: 'API Gateway v2',
        description: 'Next-generation API gateway with rate limiting, caching, and intelligent request routing.',
        icon: '🔀',
        status: 'planned',
        priority: 'medium',
        workspaceId: workspace.id,
      },
    })

    // ============ ISSUES ============
    const now = new Date()
    const day = (d: number) => new Date(now.getTime() - d * 86400000)

    const issues = await Promise.all([
      // Backlog issues
      db.issue.create({
        data: {
          title: 'Implement dark mode theme toggle',
          description: 'Add a dark mode toggle that persists user preference in localStorage. Follow shadcn/ui theming conventions.',
          status: 'backlog',
          priority: 'low',
          order: 0,
          creatorType: 'member',
          creatorId: user1.id,
          workspaceId: workspace.id,
          projectId: projectFrontend.id,
          labels: JSON.stringify(['UI', 'enhancement']),
          createdAt: day(14),
        },
      }),
      db.issue.create({
        data: {
          title: 'Add keyboard shortcuts for common actions',
          description: 'Implement keyboard shortcuts: Cmd+K for search, Cmd+N for new issue, Cmd+Shift+A for new agent.',
          status: 'backlog',
          priority: 'none',
          order: 1,
          creatorType: 'member',
          creatorId: user2.id,
          workspaceId: workspace.id,
          projectId: projectFrontend.id,
          labels: JSON.stringify(['accessibility', 'UX']),
          createdAt: day(12),
        },
      }),

      // Todo issues
      db.issue.create({
        data: {
          title: 'Set up rate limiting middleware',
          description: 'Implement sliding window rate limiting with configurable thresholds per endpoint.',
          status: 'todo',
          priority: 'high',
          order: 0,
          assigneeType: 'agent',
          assigneeId: agentCodex.id,
          creatorType: 'member',
          creatorId: user1.id,
          workspaceId: workspace.id,
          projectId: projectBackend.id,
          labels: JSON.stringify(['backend', 'security']),
          dueDate: day(-7),
          createdAt: day(10),
        },
      }),
      db.issue.create({
        data: {
          title: 'Design agent collaboration protocol',
          description: 'Define the communication protocol between agents: message format, handoff rules, and conflict resolution.',
          status: 'todo',
          priority: 'urgent',
          order: 1,
          creatorType: 'member',
          creatorId: user1.id,
          workspaceId: workspace.id,
          projectId: projectBackend.id,
          labels: JSON.stringify(['architecture', 'core']),
          dueDate: day(-3),
          createdAt: day(8),
        },
      }),

      // In-progress issues
      db.issue.create({
        data: {
          title: 'Build real-time agent status panel',
          description: 'Create a live-updating panel showing agent statuses (idle/working/blocked/error) with task progress indicators.',
          status: 'in_progress',
          priority: 'high',
          order: 0,
          assigneeType: 'agent',
          assigneeId: agentClaude.id,
          creatorType: 'member',
          creatorId: user1.id,
          workspaceId: workspace.id,
          projectId: projectFrontend.id,
          labels: JSON.stringify(['frontend', 'real-time']),
          dueDate: day(-2),
          createdAt: day(7),
        },
      }),
      db.issue.create({
        data: {
          title: 'Implement WebSocket event broadcasting',
          description: 'Set up Socket.IO event system for broadcasting agent status changes, task updates, and issue notifications.',
          status: 'in_progress',
          priority: 'high',
          order: 1,
          assigneeType: 'agent',
          assigneeId: agentCodex.id,
          creatorType: 'member',
          creatorId: user2.id,
          workspaceId: workspace.id,
          projectId: projectFrontend.id,
          labels: JSON.stringify(['backend', 'real-time', 'infrastructure']),
          createdAt: day(5),
        },
      }),

      // In-review issues
      db.issue.create({
        data: {
          title: 'Add comprehensive error boundary components',
          description: 'Create React error boundaries for route-level and component-level error handling with user-friendly fallback UIs.',
          status: 'in_review',
          priority: 'medium',
          order: 0,
          assigneeType: 'agent',
          assigneeId: agentClaude.id,
          creatorType: 'member',
          creatorId: user3.id,
          workspaceId: workspace.id,
          projectId: projectFrontend.id,
          labels: JSON.stringify(['frontend', 'reliability']),
          createdAt: day(9),
        },
      }),
      db.issue.create({
        data: {
          title: 'Write API endpoint integration tests',
          description: 'Add integration tests for all API endpoints using the testing skill. Cover success cases, error cases, and edge cases.',
          status: 'in_review',
          priority: 'medium',
          order: 1,
          assigneeType: 'agent',
          assigneeId: agentGemini.id,
          creatorType: 'agent',
          creatorId: agentClaude.id,
          workspaceId: workspace.id,
          labels: JSON.stringify(['testing', 'quality']),
          createdAt: day(6),
        },
      }),

      // Done issues
      db.issue.create({
        data: {
          title: 'Initialize Prisma schema with all models',
          description: 'Define the complete database schema with Workspace, User, Agent, Issue, Skill, Chat, and ActivityLog models.',
          status: 'done',
          priority: 'urgent',
          order: 0,
          assigneeType: 'agent',
          assigneeId: agentCodex.id,
          creatorType: 'member',
          creatorId: user1.id,
          workspaceId: workspace.id,
          projectId: projectBackend.id,
          labels: JSON.stringify(['database', 'setup']),
          createdAt: day(20),
        },
      }),
      db.issue.create({
        data: {
          title: 'Set up project scaffolding with Next.js 16',
          description: 'Initialize Next.js 16 project with App Router, Tailwind CSS 4, shadcn/ui, and TypeScript strict mode.',
          status: 'done',
          priority: 'urgent',
          order: 1,
          assigneeType: 'agent',
          assigneeId: agentClaude.id,
          creatorType: 'member',
          creatorId: user1.id,
          workspaceId: workspace.id,
          projectId: projectFrontend.id,
          labels: JSON.stringify(['setup', 'tooling']),
          createdAt: day(21),
        },
      }),
      db.issue.create({
        data: {
          title: 'Create sidebar navigation component',
          description: 'Build responsive sidebar with navigation links: Dashboard, Agents, Issues, Chat, Skills. Include active state indicators.',
          status: 'done',
          priority: 'medium',
          order: 2,
          assigneeType: 'agent',
          assigneeId: agentClaude.id,
          creatorType: 'member',
          creatorId: user2.id,
          workspaceId: workspace.id,
          projectId: projectFrontend.id,
          labels: JSON.stringify(['frontend', 'navigation']),
          createdAt: day(15),
        },
      }),
      db.issue.create({
        data: {
          title: 'Configure Docker multi-stage build',
          description: 'Set up Dockerfile with multi-stage build for production: deps → build → runtime. Optimize layer caching.',
          status: 'done',
          priority: 'medium',
          order: 3,
          assigneeType: 'agent',
          assigneeId: agentCustom.id,
          creatorType: 'member',
          creatorId: user1.id,
          workspaceId: workspace.id,
          projectId: projectBackend.id,
          labels: JSON.stringify(['devops', 'docker']),
          createdAt: day(18),
        },
      }),
    ])

    // ============ COMMENTS ============
    await db.comment.create({
      data: {
        content:
          'The error boundary should catch async errors too. Consider using a custom hook with useEffect for async error handling.',
        authorType: 'agent',
        authorId: agentClaude.id,
        issueId: issues[6].id, // Error boundary issue (in_review)
        createdAt: day(4),
      },
    })
    await db.comment.create({
      data: {
        content:
          'Good point! I\'ll add an useAsyncError hook. Should we also log errors to an external service?',
        authorType: 'member',
        authorId: user3.id,
        issueId: issues[6].id,
        createdAt: day(3),
      },
    })
    await db.comment.create({
      data: {
        content:
          'Integration tests are passing for all CRUD endpoints. Need to add rate limiting tests once the middleware is implemented.',
        authorType: 'agent',
        authorId: agentGemini.id,
        issueId: issues[7].id, // Integration tests issue (in_review)
        createdAt: day(2),
      },
    })
    await db.comment.create({
      data: {
        content:
          'The real-time panel needs to handle reconnection gracefully. What about showing a "Reconnecting..." overlay when the WebSocket drops?',
        authorType: 'member',
        authorId: user2.id,
        issueId: issues[4].id, // Real-time panel (in_progress)
        createdAt: day(1),
      },
    })

    // ============ CHAT SESSIONS ============
    const chatSession1 = await db.chatSession.create({
      data: {
        title: 'Refactoring auth module',
        workspaceId: workspace.id,
        agentId: agentClaude.id,
        unreadCount: 0,
      },
    })

    await db.chatMessage.createMany({
      data: [
        {
          role: 'user',
          content: 'Can you refactor the authentication module to use JWT refresh tokens?',
          sessionId: chatSession1.id,
          createdAt: day(3),
        },
        {
          role: 'agent',
          content:
            'I\'ll refactor the auth module. Here\'s my plan:\n\n1. Implement JWT access/refresh token pair generation\n2. Add refresh token rotation for security\n3. Create middleware for automatic token refresh\n4. Update the login/logout flows\n\nThis approach follows OWASP best practices and gives us better session management.',
          sessionId: chatSession1.id,
          createdAt: day(3),
        },
        {
          role: 'user',
          content: 'Sounds good. Make sure to handle token expiry gracefully with proper error messages.',
          sessionId: chatSession1.id,
          createdAt: day(2),
        },
        {
          role: 'agent',
          content:
            'Done! I\'ve implemented the refresh token flow. Key changes:\n\n- Access tokens expire in 15min, refresh tokens in 7 days\n- Automatic silent refresh when access token is within 5min of expiry\n- Clear error messages for 401 responses\n- Refresh token rotation on each use for security\n\nThe PR is ready for review.',
          sessionId: chatSession1.id,
          createdAt: day(2),
        },
      ],
    })

    const chatSession2 = await db.chatSession.create({
      data: {
        title: 'Performance optimization brainstorm',
        workspaceId: workspace.id,
        agentId: agentGemini.id,
        unreadCount: 1,
      },
    })

    await db.chatMessage.createMany({
      data: [
        {
          role: 'user',
          content: 'The dashboard is loading slowly. Can you analyze potential bottlenecks?',
          sessionId: chatSession2.id,
          createdAt: day(1),
        },
        {
          role: 'agent',
          content:
            'I\'ve analyzed the dashboard and found several performance issues:\n\n1. **Database queries**: The issue list endpoint makes 5 separate queries - should use a single JOIN query\n2. **Component rendering**: The agent cards re-render on every parent state change - need React.memo\n3. **Bundle size**: Chart library is tree-shaking incorrectly - lazy load it\n4. **API calls**: Dashboard fetches all data separately - combine into one endpoint\n\nEstimated improvement: 3-5x faster initial load. Want me to implement these fixes?',
          sessionId: chatSession2.id,
          createdAt: day(1),
        },
      ],
    })

    // ============ AGENT TASKS ============
    await db.agentTask.create({
      data: {
        status: 'completed',
        output:
          'Successfully implemented the real-time agent status panel with WebSocket integration. The panel updates in real-time as agents change status.',
        tokensUsed: 4520,
        startedAt: day(4),
        completedAt: day(3),
        agentId: agentClaude.id,
        issueId: issues[4].id,
      },
    })
    await db.agentTask.create({
      data: {
        status: 'running',
        output: null,
        tokensUsed: 1800,
        startedAt: day(1),
        agentId: agentClaude.id,
        issueId: issues[4].id,
      },
    })
    await db.agentTask.create({
      data: {
        status: 'completed',
        output:
          'WebSocket event system is implemented. Events: agent:status, task:update, issue:update, chat:message. All events are broadcast to connected clients.',
        tokensUsed: 3200,
        startedAt: day(3),
        completedAt: day(2),
        agentId: agentCodex.id,
        issueId: issues[5].id,
      },
    })
    await db.agentTask.create({
      data: {
        status: 'running',
        output: 'Running integration tests... 42/50 passed so far.',
        tokensUsed: 5600,
        startedAt: day(2),
        agentId: agentGemini.id,
        issueId: issues[7].id,
      },
    })
    await db.agentTask.create({
      data: {
        status: 'queued',
        output: null,
        tokensUsed: 0,
        agentId: agentCodex.id,
        issueId: issues[2].id,
      },
    })
    await db.agentTask.create({
      data: {
        status: 'failed',
        output:
          'Docker build failed: Error installing native dependencies. Need to add build-essential to the builder stage.',
        tokensUsed: 2100,
        startedAt: day(10),
        completedAt: day(10),
        agentId: agentCustom.id,
        issueId: issues[11].id,
      },
    })
    await db.agentTask.create({
      data: {
        status: 'completed',
        output:
          'Docker multi-stage build configured successfully. Image size reduced from 1.2GB to 180MB.',
        tokensUsed: 3400,
        startedAt: day(9),
        completedAt: day(8),
        agentId: agentCustom.id,
        issueId: issues[11].id,
      },
    })
    await db.agentTask.create({
      data: {
        status: 'completed',
        output: 'Auth module refactored with JWT refresh tokens. All tests passing.',
        tokensUsed: 6200,
        startedAt: day(3),
        completedAt: day(2),
        agentId: agentClaude.id,
        chatSessionId: chatSession1.id,
      },
    })
    await db.agentTask.create({
      data: {
        status: 'running',
        output: 'Analyzing dashboard performance bottlenecks...',
        tokensUsed: 2800,
        startedAt: day(1),
        agentId: agentGemini.id,
        chatSessionId: chatSession2.id,
      },
    })

    // ============ ACTIVITY LOGS ============
    await db.activityLog.createMany({
      data: [
        {
          action: 'created',
          entityType: 'issue',
          entityId: issues[0].id,
          actorType: 'member',
          actorId: user1.id,
          issueId: issues[0].id,
          createdAt: day(14),
        },
        {
          action: 'assigned',
          entityType: 'issue',
          entityId: issues[2].id,
          actorType: 'member',
          actorId: user1.id,
          metadata: JSON.stringify({ assignee: 'Codex' }),
          issueId: issues[2].id,
          createdAt: day(9),
        },
        {
          action: 'status_changed',
          entityType: 'issue',
          entityId: issues[4].id,
          actorType: 'member',
          actorId: user1.id,
          metadata: JSON.stringify({ from: 'todo', to: 'in_progress' }),
          issueId: issues[4].id,
          createdAt: day(7),
        },
        {
          action: 'commented',
          entityType: 'issue',
          entityId: issues[4].id,
          actorType: 'member',
          actorId: user2.id,
          issueId: issues[4].id,
          createdAt: day(1),
        },
        {
          action: 'status_changed',
          entityType: 'issue',
          entityId: issues[8].id,
          actorType: 'agent',
          actorId: agentCodex.id,
          metadata: JSON.stringify({ from: 'in_progress', to: 'done' }),
          issueId: issues[8].id,
          createdAt: day(18),
        },
        {
          action: 'status_changed',
          entityType: 'issue',
          entityId: issues[9].id,
          actorType: 'agent',
          actorId: agentClaude.id,
          metadata: JSON.stringify({ from: 'in_progress', to: 'done' }),
          issueId: issues[9].id,
          createdAt: day(19),
        },
        {
          action: 'status_changed',
          entityType: 'issue',
          entityId: issues[10].id,
          actorType: 'agent',
          actorId: agentClaude.id,
          metadata: JSON.stringify({ from: 'in_review', to: 'done' }),
          issueId: issues[10].id,
          createdAt: day(12),
        },
        {
          action: 'created',
          entityType: 'project',
          entityId: projectFrontend.id,
          actorType: 'member',
          actorId: user1.id,
          createdAt: day(21),
        },
        {
          action: 'created',
          entityType: 'project',
          entityId: projectBackend.id,
          actorType: 'member',
          actorId: user1.id,
          createdAt: day(16),
        },
        {
          action: 'status_changed',
          entityType: 'issue',
          entityId: issues[6].id,
          actorType: 'member',
          actorId: user3.id,
          metadata: JSON.stringify({ from: 'in_progress', to: 'in_review' }),
          issueId: issues[6].id,
          createdAt: day(4),
        },
        {
          action: 'commented',
          entityType: 'issue',
          entityId: issues[6].id,
          actorType: 'agent',
          actorId: agentClaude.id,
          issueId: issues[6].id,
          createdAt: day(4),
        },
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
        chatSessions: 2,
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
