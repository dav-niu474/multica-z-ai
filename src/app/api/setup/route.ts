import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

// SQL statements to create all tables (idempotent - uses IF NOT EXISTS)
const CREATE_TABLES_SQL = [
  'CREATE SCHEMA IF NOT EXISTS "public"',
  `CREATE TABLE IF NOT EXISTS "Workspace" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "description" TEXT,
    "context" TEXT, "icon" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Workspace_slug_key') THEN
      CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_email_key') THEN
      CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "Member" (
    "id" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'member', "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Member_userId_workspaceId_key') THEN
      CREATE UNIQUE INDEX "Member_userId_workspaceId_key" ON "Member"("userId", "workspaceId");
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "Agent" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "avatar" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'claude', "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idle', "maxConcurrent" INTEGER NOT NULL DEFAULT 3,
    "visibility" TEXT NOT NULL DEFAULT 'workspace', "customEnv" TEXT, "customArgs" TEXT,
    "mcpConfig" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "workspaceId" TEXT NOT NULL,
    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "Skill" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'skill', "category" TEXT, "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "workspaceId" TEXT NOT NULL,
    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "AgentSkill" (
    "id" TEXT NOT NULL, "agentId" TEXT NOT NULL, "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentSkill_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'AgentSkill_agentId_skillId_key') THEN
      CREATE UNIQUE INDEX "AgentSkill_agentId_skillId_key" ON "AgentSkill"("agentId", "skillId");
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned', "priority" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "workspaceId" TEXT NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "Issue" (
    "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'backlog', "priority" TEXT NOT NULL DEFAULT 'none',
    "order" INTEGER NOT NULL DEFAULT 0, "assigneeType" TEXT, "assigneeId" TEXT,
    "creatorType" TEXT NOT NULL DEFAULT 'member', "creatorId" TEXT, "projectId" TEXT,
    "dueDate" TIMESTAMP(3), "labels" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "workspaceId" TEXT NOT NULL,
    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL, "content" TEXT NOT NULL,
    "authorType" TEXT NOT NULL DEFAULT 'member', "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "issueId" TEXT NOT NULL,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "AgentTask" (
    "id" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'queued', "output" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0, "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "agentId" TEXT NOT NULL, "issueId" TEXT,
    "chatSessionId" TEXT, CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ChatSession" (
    "id" TEXT NOT NULL, "title" TEXT, "agentId" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0, "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "workspaceId" TEXT NOT NULL,
    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL, "role" TEXT NOT NULL, "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL, CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL, "actorType" TEXT, "actorId" TEXT, "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "issueId" TEXT,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
  )`,
]

// Foreign key constraints (idempotent - uses DO $$ blocks)
const ADD_FK_SQL = [
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Member_userId_fkey') THEN
      ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Member_workspaceId_fkey') THEN
      ALTER TABLE "Member" ADD CONSTRAINT "Member_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Agent_workspaceId_fkey') THEN
      ALTER TABLE "Agent" ADD CONSTRAINT "Agent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Skill_workspaceId_fkey') THEN
      ALTER TABLE "Skill" ADD CONSTRAINT "Skill_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentSkill_agentId_fkey') THEN
      ALTER TABLE "AgentSkill" ADD CONSTRAINT "AgentSkill_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentSkill_skillId_fkey') THEN
      ALTER TABLE "AgentSkill" ADD CONSTRAINT "AgentSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Issue_workspaceId_fkey') THEN
      ALTER TABLE "Issue" ADD CONSTRAINT "Issue_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Issue_projectId_fkey') THEN
      ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comment_issueId_fkey') THEN
      ALTER TABLE "Comment" ADD CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentTask_agentId_fkey') THEN
      ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentTask_issueId_fkey') THEN
      ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentTask_chatSessionId_fkey') THEN
      ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Project_workspaceId_fkey') THEN
      ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChatSession_workspaceId_fkey') THEN
      ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChatMessage_sessionId_fkey') THEN
      ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLog_issueId_fkey') THEN
      ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`,
]

function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.multicaZai_POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.multicaZai_POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.multicaZai_POSTGRES_URL ||
    process.env.POSTGRES_URL

  if (!url) {
    throw new Error('DATABASE_URL is not set. Please configure it in Vercel dashboard or .env file.')
  }

  return url
}

// Create a fresh PrismaClient
function createFreshClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })
}

async function seedDemoData(d: PrismaClient) {
  const now = new Date()
  const day = (n: number) => new Date(now.getTime() - n * 86400000)

  // Only seed if workspace doesn't exist
  const existingWorkspace = await d.workspace.findFirst()
  if (existingWorkspace) {
    return { workspaces: 1, users: 0, agents: 0, skills: 0, issues: 0, projects: 0, chatSessions: 0, seeded: false }
  }

  await d.user.createMany({
    data: [
      { email: 'alex@agenthub.dev', name: 'Alex Chen' },
      { email: 'sarah@agenthub.dev', name: 'Sarah Kim' },
      { email: 'mike@agenthub.dev', name: 'Mike Rivera' },
    ],
  })
  const users = await d.user.findMany({ orderBy: { createdAt: 'asc' } })

  const workspace = await d.workspace.create({
    data: { name: 'AgentHub Team', slug: 'agenthub', description: 'A collaborative workspace for multi-agent software development.', context: 'Follow the workspace conventions: write clean, tested code; use conventional commits.', icon: '🤖' },
  })

  await d.member.createMany({
    data: [
      { role: 'owner', userId: users[0].id, workspaceId: workspace.id },
      { role: 'admin', userId: users[1].id, workspaceId: workspace.id },
      { role: 'member', userId: users[2].id, workspaceId: workspace.id },
    ],
  })

  const [a1, a2, a3, a4] = await Promise.all([
    d.agent.create({ data: { name: 'Claude Code', description: 'Senior full-stack engineer.', provider: 'claude', status: 'working', workspaceId: workspace.id } }),
    d.agent.create({ data: { name: 'Codex', description: 'Backend specialist.', provider: 'codex', status: 'idle', maxConcurrent: 5, workspaceId: workspace.id } }),
    d.agent.create({ data: { name: 'Gemini Analyst', description: 'QA specialist.', provider: 'gemini', status: 'working', maxConcurrent: 2, workspaceId: workspace.id } }),
    d.agent.create({ data: { name: 'DevOps Bot', description: 'CI/CD automation.', provider: 'custom', status: 'offline', maxConcurrent: 1, workspaceId: workspace.id } }),
  ])

  const [s1, s2, s3, s4, s5] = await Promise.all([
    d.skill.create({ data: { name: 'Code Review', type: 'skill', category: 'review', content: '# Code Review\n\n- Correctness\n- Readability\n- Performance\n- Security', workspaceId: workspace.id } }),
    d.skill.create({ data: { name: 'TDD', type: 'skill', category: 'testing', content: '# TDD\n\n1. Red: Write failing test\n2. Green: Make it pass\n3. Refactor', workspaceId: workspace.id } }),
    d.skill.create({ data: { name: 'Security Audit', type: 'skill', category: 'security', content: '# Security\n\n- XSS prevention\n- SQL Injection\n- CSRF\n- Input validation', workspaceId: workspace.id } }),
    d.skill.create({ data: { name: 'API Design', type: 'tool', category: 'engineering', content: '# API Design Tool\n\n- RESTful conventions\n- HTTP methods\n- Error format\n- OpenAPI spec generation', workspaceId: workspace.id } }),
    d.skill.create({ data: { name: 'Git Workflow', type: 'tool', category: 'git', content: '# Git Workflow Tool\n\n- Conventional commits\n- Feature branches\n- PR review\n- Auto-merge rules', workspaceId: workspace.id } }),
  ])

  await d.agentSkill.createMany({
    data: [
      { agentId: a1.id, skillId: s1.id }, { agentId: a1.id, skillId: s2.id }, { agentId: a1.id, skillId: s5.id },
      { agentId: a2.id, skillId: s4.id }, { agentId: a2.id, skillId: s5.id },
      { agentId: a3.id, skillId: s1.id }, { agentId: a3.id, skillId: s3.id }, { agentId: a3.id, skillId: s2.id },
      { agentId: a4.id, skillId: s5.id }, { agentId: a4.id, skillId: s3.id },
    ],
  })

  const [p1, p2] = await Promise.all([
    d.project.create({ data: { name: 'AgentHub Dashboard', icon: '📊', status: 'in_progress', priority: 'high', workspaceId: workspace.id } }),
    d.project.create({ data: { name: 'API Gateway v2', icon: '🔀', status: 'planned', priority: 'medium', workspaceId: workspace.id } }),
  ])

  await d.issue.createMany({
    data: [
      { title: 'Implement dark mode toggle', status: 'backlog', priority: 'low', creatorId: users[0].id, workspaceId: workspace.id, projectId: p1.id, createdAt: day(14) },
      { title: 'Add keyboard shortcuts', status: 'backlog', creatorId: users[1].id, workspaceId: workspace.id, projectId: p1.id, createdAt: day(12) },
      { title: 'Set up rate limiting', status: 'todo', priority: 'high', assigneeType: 'agent', assigneeId: a2.id, creatorId: users[0].id, workspaceId: workspace.id, projectId: p2.id, createdAt: day(10) },
      { title: 'Design agent collaboration protocol', status: 'todo', priority: 'urgent', creatorId: users[0].id, workspaceId: workspace.id, projectId: p2.id, createdAt: day(8) },
      { title: 'Build real-time agent status panel', status: 'in_progress', priority: 'high', assigneeType: 'agent', assigneeId: a1.id, creatorId: users[0].id, workspaceId: workspace.id, projectId: p1.id, createdAt: day(7) },
      { title: 'WebSocket event broadcasting', status: 'in_progress', priority: 'high', assigneeType: 'agent', assigneeId: a2.id, creatorId: users[1].id, workspaceId: workspace.id, projectId: p1.id, createdAt: day(5) },
      { title: 'Add error boundary components', status: 'in_review', priority: 'medium', assigneeType: 'agent', assigneeId: a1.id, creatorId: users[2].id, workspaceId: workspace.id, projectId: p1.id, createdAt: day(9) },
      { title: 'Write API integration tests', status: 'in_review', priority: 'medium', assigneeType: 'agent', assigneeId: a3.id, creatorId: a1.id, workspaceId: workspace.id, createdAt: day(6) },
      { title: 'Initialize Prisma schema', status: 'done', priority: 'urgent', assigneeType: 'agent', assigneeId: a2.id, creatorId: users[0].id, workspaceId: workspace.id, projectId: p2.id, createdAt: day(20) },
      { title: 'Set up Next.js 16 project', status: 'done', priority: 'urgent', assigneeType: 'agent', assigneeId: a1.id, creatorId: users[0].id, workspaceId: workspace.id, projectId: p1.id, createdAt: day(21) },
      { title: 'Create sidebar navigation', status: 'done', priority: 'medium', assigneeType: 'agent', assigneeId: a1.id, creatorId: users[1].id, workspaceId: workspace.id, projectId: p1.id, createdAt: day(15) },
      { title: 'Configure Docker build', status: 'done', priority: 'medium', assigneeType: 'agent', assigneeId: a4.id, creatorId: users[0].id, workspaceId: workspace.id, projectId: p2.id, createdAt: day(18) },
    ],
  })

  const chat1 = await d.chatSession.create({ data: { title: 'Refactoring auth module', workspaceId: workspace.id, agentId: a1.id } })
  const chat2 = await d.chatSession.create({ data: { title: 'Performance optimization', workspaceId: workspace.id, agentId: a3.id, unreadCount: 1 } })
  await d.chatMessage.createMany({
    data: [
      { role: 'user', content: 'Can you refactor the auth module to use JWT?', sessionId: chat1.id },
      { role: 'agent', content: 'I will implement JWT access/refresh token pairs with rotation.', sessionId: chat1.id },
      { role: 'user', content: 'Handle token expiry gracefully.', sessionId: chat1.id },
      { role: 'agent', content: 'Done! JWT refresh tokens implemented. Access: 15min, Refresh: 7 days.', sessionId: chat1.id },
      { role: 'user', content: 'Dashboard loading slowly. Analyze bottlenecks?', sessionId: chat2.id },
      { role: 'agent', content: 'Found: 5 separate DB queries, component re-renders, bad tree-shaking. 3-5x improvement possible.', sessionId: chat2.id },
    ],
  })

  const issueRealtime = (await d.issue.findFirst({ where: { title: { contains: 'real-time' } } }))!
  const issueWebsocket = (await d.issue.findFirst({ where: { title: { contains: 'WebSocket' } } }))!
  const issueTests = (await d.issue.findFirst({ where: { title: { contains: 'integration tests' } } }))!
  const issueRateLimit = (await d.issue.findFirst({ where: { title: { contains: 'rate limiting' } } }))!
  const issueDocker = (await d.issue.findFirst({ where: { title: { contains: 'Docker' } } }))!

  await d.agentTask.createMany({
    data: [
      { status: 'completed', output: 'Real-time panel with WebSocket done.', tokensUsed: 4520, startedAt: day(4), completedAt: day(3), agentId: a1.id, issueId: issueRealtime.id },
      { status: 'running', tokensUsed: 1800, startedAt: day(1), agentId: a1.id, issueId: issueRealtime.id },
      { status: 'completed', output: 'WebSocket events implemented.', tokensUsed: 3200, startedAt: day(3), completedAt: day(2), agentId: a2.id, issueId: issueWebsocket.id },
      { status: 'running', output: 'Running tests... 42/50 passed.', tokensUsed: 5600, startedAt: day(2), agentId: a3.id, issueId: issueTests.id },
      { status: 'queued', agentId: a2.id, issueId: issueRateLimit.id },
      { status: 'failed', output: 'Docker build failed.', tokensUsed: 2100, startedAt: day(10), completedAt: day(10), agentId: a4.id, issueId: issueDocker.id },
      { status: 'completed', output: 'Docker build: 180MB.', tokensUsed: 3400, startedAt: day(9), completedAt: day(8), agentId: a4.id, issueId: issueDocker.id },
      { status: 'completed', output: 'Auth JWT done.', tokensUsed: 6200, startedAt: day(3), completedAt: day(2), agentId: a1.id, chatSessionId: chat1.id },
      { status: 'running', output: 'Analyzing performance...', tokensUsed: 2800, startedAt: day(1), agentId: a3.id, chatSessionId: chat2.id },
    ],
  })

  return { workspaces: 1, users: 3, agents: 4, skills: 5, issues: 12, projects: 2, chatSessions: 2, seeded: true }
}

// POST /api/setup - Ensure database tables exist and seed demo data (idempotent)
export async function POST(request: NextRequest) {
  let client: PrismaClient | null = null

  try {
    client = createFreshClient()

    // Step 1: Create all tables with correct schema (IF NOT EXISTS - idempotent)
    for (const sql of CREATE_TABLES_SQL) {
      await client.$executeRawUnsafe(sql)
    }

    // Step 2: Add foreign key constraints (idempotent)
    for (const fkSql of ADD_FK_SQL) {
      try {
        await client.$executeRawUnsafe(fkSql)
      } catch {
        // FK might already exist, ignore
      }
    }

    // Disconnect and create fresh client for seeding
    await client.$disconnect()
    client = null

    // Step 3: Seed demo data (only if workspace doesn't exist)
    const seedClient = createFreshClient()
    const stats = await seedDemoData(seedClient)
    await seedClient.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      stats,
    })
  } catch (error) {
    console.error('Error setting up database:', error)

    if (client) {
      try { await client.$disconnect() } catch { /* ignore */ }
    }

    return NextResponse.json(
      { error: 'Failed to setup database', details: String(error) },
      { status: 500 }
    )
  }
}
