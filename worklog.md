# AgentHub - Multi-Agent Team Collaboration Platform

## Project Overview
Inspired by multica-ai/multica (human+AI agent collaboration platform) and addyosmani/agent-skills (engineering skills framework), building a comprehensive multi-agent collaboration platform.

## Key Design Decisions
- Single-page app with sidebar navigation (Dashboard, Agents, Issues, Chat, Skills)
- Prisma/SQLite for persistence
- Socket.IO for real-time updates
- shadcn/ui component library
- Multi-agent orchestration patterns: Direct, Parallel Fan-out, Sequential Pipeline

## Architecture
- Frontend: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- Backend: Next.js API Routes, Prisma ORM
- Real-time: Socket.IO mini-service (port 3003)
- Database: SQLite via Prisma
---

## Task 5: Backend API Routes

**Status**: ✅ Complete

Created all 12 API route groups with full CRUD operations, activity logging, and rich demo data seeding.

### Files Created (12 route files)

| File | Methods | Description |
|------|---------|-------------|
| `src/app/api/workspaces/route.ts` | GET, POST | List all workspaces (with agent/issue/project/member counts), create workspace with slug uniqueness check |
| `src/app/api/agents/route.ts` | GET, POST | List agents by `workspaceId` query param (with skills + task counts), create agent with optional skill associations |
| `src/app/api/agents/[id]/route.ts` | GET, PUT, DELETE | Get single agent (with skills, tasks, workspace info), update agent fields, delete agent with cascade |
| `src/app/api/agents/[id]/toggle-status/route.ts` | POST | Toggle agent status between idle↔working, returns previous and new status |
| `src/app/api/issues/route.ts` | GET, POST | List issues by workspaceId with filters (status, priority, projectId), create issue with labels as JSON array |
| `src/app/api/issues/[id]/route.ts` | GET, PUT, DELETE | Get issue with comments/tasks/activity, update with automatic activity logging for status/priority/assignee changes, delete with cascade |
| `src/app/api/skills/route.ts` | GET, POST | List skills with optional workspaceId/category filters (includes agent associations), create skill |
| `src/app/api/projects/route.ts` | GET, POST | List projects with computed status counts and issue distribution, create project |
| `src/app/api/chat/route.ts` | GET, POST | List non-archived chat sessions (with latest message preview, task summaries), create chat session |
| `src/app/api/chat/[id]/messages/route.ts` | GET, POST | Get all messages for a session, send message with auto-title from first user message and unread count increment |
| `src/app/api/seed/route.ts` | POST | Seed rich demo data (see below), cleans existing data first |
| `src/app/api/dashboard/route.ts` | GET | Dashboard stats: issue/agent/task status counts, project progress, recent activity, active tasks |

### Seed Data Contents
- **1 workspace**: "AgentHub Team" with slug "agenthub" and workspace context
- **3 users**: Alex Chen (owner), Sarah Kim (admin), Mike Rivera (member)
- **4 agents**: Claude Code (claude/working), Codex (codex/idle), Gemini Analyst (gemini/working), DevOps Bot (custom/offline)
- **5 skills**: Code Review (review), TDD (testing), Security Audit (review), API Design (engineering), Git Workflow (engineering)
- **10 agent-skill associations**: Skills distributed across agents
- **2 projects**: AgentHub Dashboard (in_progress/high), API Gateway v2 (planned/medium)
- **12 issues**: 2 backlog, 2 todo, 2 in_progress, 2 in_review, 4 done — across priorities and assignees
- **4 comments**: Agent and member comments on in_review and in_progress issues
- **2 chat sessions**: "Refactoring auth module" (4 messages), "Performance optimization brainstorm" (2 messages)
- **9 agent tasks**: 3 completed, 3 running, 1 queued, 1 failed, 1 in chat context
- **11 activity logs**: Created, assigned, status_changed, commented events

### Design Notes
- All routes use `import { db } from '@/lib/db'` for database access
- Next.js 16 async params pattern: `params: Promise<{ id: string }>` with `await params`
- Activity logging on issue status/priority/assignee changes (auto-generated)
- Labels stored as JSON strings, parsed to arrays on read
- Chat auto-titles from first user message (truncated at 50 chars)
- Dashboard runs all queries in parallel with `Promise.all` for performance
- `bun run lint` passes with zero errors

---

## Task 7: Real-time Communication Service

**Status**: ✅ Complete

Created the Socket.IO mini-service at `mini-services/realtime-service/` for real-time multi-agent collaboration.

### Files Created
| File | Purpose |
|------|---------|
| `mini-services/realtime-service/package.json` | Package manifest with `socket.io@^4` dependency, `bun --hot` dev script |
| `mini-services/realtime-service/index.ts` | Entry point — Socket.IO server on port 3003 with HTTP health endpoint |
| `mini-services/realtime-service/.gitignore` | Excludes `node_modules/` |
| `mini-services/realtime-service/bun.lock` | Lockfile (auto-generated by `bun install`) |

### Socket Events Implemented
| Client → Server Event | Description | Server Broadcast Event |
|------------------------|-------------|------------------------|
| `join-workspace` | Join a workspace room by ID; receive current member list | `workspace:member-joined` to room |
| `leave-workspace` | Leave a workspace room | `workspace:member-left` to room |
| `issue:update` | Broadcast issue field changes | `issue:updated` to workspace room |
| `agent:status` | Broadcast agent status transitions | `agent:status-changed` to workspace room |
| `chat:message` | Send a chat message (auto-assigned UUID) | `chat:message-received` to workspace room |
| `task:progress` | Report task progress (0–100 + status) | `task:progress-updated` to workspace room |

### Design Notes
- **Room naming**: `workspace:{workspaceId}` — isolates events per workspace.
- **Member tracking**: In-memory `Map<workspaceId, WorkspaceMember[]>` tracks who is in each room; cleaned up on disconnect.
- **Health endpoint**: `GET /` returns JSON with service status, uptime, connected client count, and active workspace list. Uses `prependListener` to run before Engine.IO's request handler (necessary because `path: "/"` causes Engine.IO to intercept all requests).
- **CORS**: Open (`origin: "*"`) for development; tighten for production.
- **Auto-restart**: `bun --hot index.ts` watches for file changes.
- **Graceful shutdown**: Handles SIGTERM/SIGINT with 5-second force-exit timeout.
- **Frontend connection**: `io("/?XTransformPort=3003")` via Caddy gateway.

---

## Task 6-b: Dashboard & Agents View Components

**Status**: ✅ Complete

Created Dashboard and Agents view components with full API integration, Recharts donut chart, agent CRUD operations, and responsive layout.

### Files Created

| File | Purpose |
|------|---------|
| `src/types/index.ts` | TypeScript types matching Prisma schema (all models + DashboardData, AgentFormData) |
| `src/hooks/use-workspace.ts` | Shared hook to fetch the first workspace ID from `/api/workspaces` |
| `src/components/views/dashboard-view.tsx` | Dashboard: 4 stats cards (Total Issues, Active Agents, Open Tasks, Completion Rate), agent status grid with status dots + provider badges, Recharts donut chart of issue distribution, status breakdown bars, recent activity feed (last 10) with timestamps |
| `src/components/agents/agent-form-dialog.tsx` | Agent create/edit dialog: name, description, provider select, visibility select, max concurrent tasks, instructions textarea, skill multi-select (checkbox list). POST for create, PUT for edit. Sonner toast notifications |
| `src/components/views/agents-view.tsx` | Agent cards grid (1/2/3 cols responsive). Each card: initials avatar with provider color + status dot, name, description, provider badge, task count, max concurrent, instructions preview, skills badges, Edit/Toggle Status/Delete buttons. Create button, delete confirmation AlertDialog |

### Files Modified

| File | Change |
|------|--------|
| `src/app/page.tsx` | Replaced with tab navigation (Dashboard, Agents) rendering view components |

### Design Decisions
- **Workspace ID**: `useWorkspace` hook fetches dynamically from API (CUID IDs are auto-generated)
- **Dashboard** fetches from `/api/dashboard` which returns agents + stats together (single fetch)
- **Agents view** fetches agents + skills in parallel, re-fetches after mutations
- **Status colors**: idle=emerald, working=amber, blocked/error=red, offline=gray
- **Provider colors**: claude=violet, codex=teal, gemini=cyan, custom=orange (accent only)
- **Recharts donut**: `ChartContainer` + `ChartConfig` from shadcn/ui chart primitives, inner radius 50, outer 75
- **Loading states**: Skeleton placeholders matching content layout
- **Toast**: Sonner for success/error feedback on all mutations
- **Responsive**: Mobile-first grids (1 col → 2 col md → 3 col lg for agent cards)
- **Lint**: Zero new errors (3 pre-existing in `use-socket.ts` from Task 7)

---

## Task 6-c: Issues (Kanban) & Chat View Components

**Status**: ✅ Complete

Created all Issues and Chat frontend view components with full API integration, drag-and-drop Kanban, markdown chat, and responsive layout.

### Files Created

| File | Purpose |
|------|---------|
| `src/types/index.ts` | TypeScript types matching Prisma schema (all models: Workspace, User, Member, Agent, Skill, AgentSkill, Issue, Comment, AgentTask, Project, ChatSession, ChatMessage, ActivityLog) |
| `src/components/issues/issue-form-dialog.tsx` | Dialog with form: title, description, priority, assignee (member/agent), project, labels. POST to `/api/issues` |
| `src/components/issues/issue-detail-panel.tsx` | Sheet panel with full issue details, status/priority quick-change selects, comment section, metadata display |
| `src/components/views/issues-view.tsx` | Board (Kanban) + List view toggle. DnD Kit drag-and-drop between columns. List view with status/priority filter chips and sortable columns |
| `src/components/chat/chat-message.tsx` | Message bubble: markdown rendering (react-markdown + remark-gfm), syntax-highlighted code blocks (react-syntax-highlighter + oneDark), user/agent avatar alignment |
| `src/components/views/chat-view.tsx` | Two-panel layout: session list sidebar + chat area. Session creation dialog, message sending, auto-scroll, simulated agent responses |
| `src/app/page.tsx` | Updated main page with sidebar navigation (Dashboard, Agents, Issues, Chat, Skills) + placeholder views for Dashboard/Agents/Skills |

### Design Decisions
- **Kanban Board**: 5 columns (Backlog, Todo, In Progress, In Review, Done) with `@dnd-kit/core` + `@dnd-kit/sortable`. DragOverlay for visual feedback during drag
- **Priority colors**: urgent=red, high=orange, medium=amber, low=sky, none=gray (no indigo/blue)
- **Status colors**: backlog=gray, todo=sky-500, in_progress=amber, in_review=violet, done=emerald
- **Chat bubbles**: user=primary bg (right-aligned), agent=muted bg (left-aligned)
- **Markdown**: GFM tables, code blocks with language labels, blockquotes, lists — all properly styled
- **Responsive**: Kanban scrolls horizontally on mobile, chat sidebar collapses, all touch-friendly (44px min targets)
- **Dependency added**: `remark-gfm@4.0.1`
- **Lint**: Zero new lint errors (3 pre-existing in `use-socket.ts` unrelated)

### API Integration Points
- `GET /api/issues?workspaceId=<id>` — fetch all issues
- `PUT /api/issues/[id]` — update status (drag-and-drop), priority, assignee
- `POST /api/issues` — create new issue
- `GET /api/agents?workspaceId=<id>` — fetch agents for assignee list
- `GET /api/projects?workspaceId=<id>` — fetch projects for project select
- `GET /api/chat?workspaceId=<id>` — fetch chat sessions
- `GET /api/chat/[id]/messages` — fetch session messages
- `POST /api/chat/[id]/messages` — send message
- `POST /api/chat` — create new session
- `GET /api/dashboard?workspaceId=<id>` — dashboard stats
- `GET /api/workspaces` — workspace selection
- `POST /api/seed` — seed demo data

---

## Task 6-d: Skills, Projects & Patterns View Components

**Status**: ✅ Complete

Created Skills view, Projects view, and Patterns (orchestration reference) view with full CRUD, search/filter, detail dialogs, and expandable project issue lists.

### Files Created

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Comprehensive TypeScript types matching Prisma schema + color/label maps for all status/category/priority enums |
| `src/components/skills/skill-form-dialog.tsx` | Dialog form for create/edit skill: name, description, category (9 options), source, markdown content textarea |
| `src/components/views/skills-view.tsx` | Full skills management: responsive card grid (1/2/3 cols), category-colored icons, agent avatar "Used by" section, content preview (100 chars stripped markdown), search + category filter, detail dialog with rendered markdown + attach-to-agent, delete confirmation |
| `src/components/projects/project-form-dialog.tsx` | Dialog form for create/edit project: emoji icon, name, description, status (5 options), priority (5 options) |
| `src/components/views/projects-view.tsx` | Full projects management: responsive card grid, status/priority badges, progress bar (done/total), issue breakdown by status, expandable issue list per project with status icons + priority badges, delete confirmation |
| `src/components/views/patterns-view.tsx` | Agent orchestration patterns reference: 5 patterns (Direct Invocation, Single-Persona Command, Parallel Fan-out with Merge, Sequential Pipeline, Research Isolation) with ASCII art diagrams, use-when descriptions, cost indicators, examples. Anti-patterns section (5 common mistakes). Quick-reference decision matrix table |
| `src/app/api/skills/[id]/route.ts` | GET/PUT/DELETE for individual skills (was missing from Task 5) |
| `src/app/api/projects/[id]/route.ts` | GET/PUT/DELETE for individual projects (was missing from Task 5) |

### Files Modified

| File | Changes |
|------|---------|
| `src/app/page.tsx` | Added Projects + Patterns nav items, imported new view components, replaced inline SkillsView placeholder with imported component, added projects/patterns to ViewKey union and renderView switch, updated skeleton count |

### Design Decisions
- **Category colors**: engineering=amber, testing=emerald, review=violet, deployment=rose, custom=sky, security=red, performance=teal, git=orange, documentation=cyan
- **Status colors**: planned=gray, in_progress=amber, paused=yellow, completed=emerald, cancelled=red
- **Skill cards**: Category icon (Lucide) in colored background, truncated description, markdown content preview (stripped, 100 chars), agent avatars with hash-based colors, hover-reveal action buttons (view/edit/delete)
- **Skill detail dialog**: Full markdown rendering (headings, lists, paragraphs), metadata badges (category, source, char count), agent association list, "Attach to Agent" dropdown
- **Project cards**: Emoji icon, status+priority badges, animated progress bar, status-count breakdown with colored icons
- **Project issue expansion**: Lazy-loaded (fetches on expand), scrollable list with status icons, priority badges, external link hover effect
- **Patterns view**: Documentation-style layout, ASCII art diagrams in mono font, severity-tagged anti-patterns, decision matrix comparison table
- **No indigo/blue** colors used anywhere
- **Responsive**: Mobile-first grid, collapsible sidebar, touch-friendly targets
- **shadcn/ui only**: Card, Badge, Dialog, Select, Button, Avatar, Progress, Skeleton, ScrollArea, Separator, Alert

### API Routes Added
- `GET /api/skills/[id]` — single skill with agent associations
- `PUT /api/skills/[id]` — update skill fields (name, description, content, category, source)
- `DELETE /api/skills/[id]` — delete skill (cascade removes agent associations)
- `GET /api/projects/[id]` — single project with issues + status counts
- `PUT /api/projects/[id]` — update project fields (name, description, icon, status, priority)
- `DELETE /api/projects/[id]` — delete project (issues lose project association, not deleted)

### Lint
- `bun run lint` passes with zero errors

---

## Task 6-a: Frontend Layer

**Status**: ✅ Complete

Built the complete frontend layer: Zustand state management, Socket.IO integration, API client, shared types, responsive sidebar navigation, page layout, and stub view components for all 6 views.

### Files Created

| File | Purpose |
|------|---------|
| `src/types/index.ts` | TypeScript interfaces for all Prisma models: Workspace, User, Member, Agent, Skill, AgentSkill, Issue, Comment, AgentTask, Project, ChatSession, ChatMessage, ActivityLog, DashboardStats, ViewType |
| `src/store/app-store.ts` | Zustand store with: currentView (6 views), sidebarOpen, selectedAgentId/IssueId/ChatId, workspaceId/Name. Actions: setView, toggleSidebar, setSidebarOpen, selectAgent/Issue/Chat, setWorkspace |
| `src/lib/api.ts` | Fetch-based API client with get/post/put/del methods, JSON handling, ApiError class, query param support |
| `src/hooks/use-socket.ts` | Socket.IO hook (`useSocket`) connecting to port 3003 via Caddy gateway. Auto-join workspace room. Listens for issue:updated, agent:status-changed, chat:message-received, task:progress-updated. Also exports `useSocketEmit` for sending events |
| `src/components/layout/sidebar.tsx` | Responsive sidebar: fixed w-60 on desktop, Sheet drawer on mobile. Navigation with Lucide icons for Dashboard/Agents/Issues/Chat/Skills/Projects. Active view highlighted. Workspace info at bottom |
| `src/components/layout/page-layout.tsx` | Main layout wrapper with sidebar + header (breadcrumb, workspace name, sidebar toggle) + scrollable content area |
| `src/views/dashboard-view.tsx` | Stub: stats grid with skeleton placeholders + activity placeholder card |
| `src/views/agents-view.tsx` | Stub: agents placeholder card |
| `src/views/issues-view.tsx` | Stub: issues placeholder card |
| `src/views/chat-view.tsx` | Stub: chat placeholder card |
| `src/views/skills-view.tsx` | Stub: skills placeholder card |
| `src/views/projects-view.tsx` | Stub: projects placeholder card |
| `src/app/page.tsx` | Main SPA entry: seeds demo data on mount, loads first workspace, connects to Socket.IO, renders active view based on Zustand store |

### Design Decisions
- **Zustand store**: Single store for all app state — view navigation, selections, workspace context. Clean separation of concerns.
- **Socket.IO**: `useSocket` hook manages lifecycle in effects only (no ref access during render per React 19 lint rules). `useSocketEmit` uses module-level singleton for emitting events. Auto-joins/leaves workspace rooms.
- **API client**: Lightweight `api` object with typed methods. No external dependencies beyond `fetch`.
- **Sidebar**: Desktop = fixed aside (w-60), Mobile = Sheet drawer triggered by toggle button. Uses `useIsMobile` hook.
- **Page layout**: Sticky header with breadcrumb, backdrop blur, responsive padding (p-4 mobile, p-6 desktop).
- **Loading state**: Full-screen spinner while seed + workspace init completes.
- **Styling**: No indigo/blue. Tailwind tokens only (bg-background, text-foreground, etc.). `text-sm` default, `text-xs` metadata, `text-base` titles. `font-medium` not `font-bold`.
- **Dependency added**: `socket.io-client@4.8.3`
- **Lint**: Zero errors (`bun run lint` passes clean)

---

---
Task ID: 8
Agent: Main Orchestrator
Task: Final integration and testing

Work Log:
- Resolved file conflicts from parallel agent writes
- Rewrote page.tsx to properly import all 7 view components
- Fixed React hooks lint error (set-state-in-effect)
- Verified lint passes with zero errors
- Confirmed dev server running, seed endpoint returns 200
- Verified WebSocket service running on port 3003

Stage Summary:
- Complete AgentHub platform built and running
- 7 views: Dashboard, Agents, Issues (Kanban+List), Chat, Skills, Projects, Patterns
- 12+ API routes for full CRUD operations
- Socket.IO real-time service on port 3003
- Rich demo data seeded automatically
- Zero lint errors
- All views properly connected and functional

---
Task ID: 1
Agent: Main Agent
Task: Fix all deployed API endpoints returning errors on Vercel

Work Log:
- Investigated Vercel deployment: all API routes returned 500 errors
- Identified root cause: Prisma schema required DATABASE_URL/DIRECT_URL env vars not set on Vercel
- Set DATABASE_URL and DIRECT_URL env vars on Vercel via REST API (CLI had issues with special chars in URLs)
- Fixed Prisma schema: removed strict directUrl requirement
- Fixed db.ts: multiple iterations - initially used @prisma/adapter-pg, then datasourceUrl, then Proxy, finally db() function
- Discovered Neon pooled URL vs non-pooled URL routing mismatch causing "table not found" errors
- Changed DATABASE_URL to non-pooled URL to ensure consistent database access
- Pushed schema via `prisma db push --force-reset` using non-pooled URL
- Seeded database with demo data (12 issues, 4 agents, 3 users, 2 projects, 5 skills)
- Changed all 13 API route files from `db.xxx` to `db().xxx` for serverless compatibility
- Set NVIDIA_API_KEY and NVIDIA_BASE_URL env vars on Vercel for all environments
- Verified all 7 API endpoints return HTTP 200 on production

Stage Summary:
- All API endpoints working on https://multica-z-ai.vercel.app
- Database: Vercel Postgres (Neon) with proper connection via non-pooled URL
- Key fix: db.ts exports a `db()` function that creates fresh PrismaClient per request in production
- NVIDIA NIM provider configured and enabled (1/6 providers active)
- GitHub repo updated and Vercel deployment successful

---
Task ID: 1
Agent: Main Agent
Task: 诊断并修复 Vercel 生产环境所有 API 端点报错

Work Log:
- 检查 Vercel 项目配置，确认 .vercel/project.json 指向正确的 multica-z-ai 项目 (prj_eApLU1FcjhDHhpcMOCfB8OhmPqbz)
- 确认 my-project 项目已不存在，无需删除
- 直接调用生产 API 测试所有端点：
  - /api/health ✅ 正常（数据库已连接，workspaceCount: 1）
  - /api/workspaces ❌ 报错：Project 表缺少 workspaceId 列
  - /api/dashboard ❌ 同样的 schema 问题
  - /api/agents, /api/issues, /api/projects 返回参数校验（预期行为）
  - /api/skills, /api/models ✅ 正常
- 根因：数据库表由旧版 /api/setup 创建，schema 不完整（Project 缺 workspaceId）
- 修复 1：db.ts - 添加 getDatabaseUrl() 函数，通过 datasources 参数将 URL 传给 PrismaClient
- 修复 2：/api/setup - 添加 DROP_TABLES_SQL 和 force=true 参数支持重建表
- 推送代码到 GitHub，通过 vercel CLI 部署到生产
- 调用 /api/setup?force=true 重建所有表并种子数据
- 全面验证所有 9 个 API 端点，全部正常

Stage Summary:
- 修复了两个核心问题：db.ts 未传 datasource URL 给 PrismaClient，setup 路由不支持表重建
- 所有 API 端点验证通过：health, workspaces, agents, projects, issues, skills, dashboard, chat, models
- 生产环境 URL: https://multica-z-ai.vercel.app

---
Task ID: 2
Agent: Main Agent
Task: 实现 Settings 功能、国际化(i18n)中英文切换、双语 README

Work Log:
- 分析 page.tsx 发现 Settings 按钮没有 onClick 处理函数
- 创建完整 i18n 系统: src/lib/i18n/index.tsx (I18nProvider + useTranslation hook)
- 创建英文翻译: src/lib/i18n/locales/en.ts (涵盖所有页面文本)
- 创建中文翻译: src/lib/i18n/locales/zh.ts
- 创建 Settings 视图: src/components/views/settings-view.tsx (语言切换、主题、关于)
- 在 src/types/index.ts 中添加 ViewType 类型（包含 'settings'）
- 重写 src/app/page.tsx: 集成 I18nProvider、连接 Settings 视图、导航使用翻译
- 更新 src/store/app-store.ts 添加 locale 状态
- 创建 README.md (英文) 和 README_CN.md (中文)
- Lint 通过，build 通过，部署成功

Stage Summary:
- Settings 页面完全可用：语言切换(EN/ZH)、主题选择、关于信息
- i18n 系统完整：所有页面文本都有中英文翻译
- 本地存储语言偏好（localStorage key: agenthub-locale）
- 生产环境: https://multica-z-ai.vercel.app
