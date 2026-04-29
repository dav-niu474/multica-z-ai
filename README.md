<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/shadcn/ui-New%20York-18181B?logo=shadcnui&logoColor=white" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel&logoColor=white" alt="Vercel" />
</p>

<h1 align="center">🤖 AgentHub</h1>

<p align="center">
  <strong>Multi-Agent Team Collaboration Platform</strong><br/>
  A modern, full-featured workspace for orchestrating AI agents, managing tasks, and enabling seamless human–AI collaboration.
</p>

<p align="center">
  <a href="https://multica-z-ai.vercel.app" target="_blank"><strong>🌐 Live Demo</strong></a> &bull;
  <a href="README_CN.md"><strong>中文文档</strong></a>
</p>

---

> **AgentHub** is inspired by [multica-ai/multica](https://github.com/multica-ai/multica) (human+AI agent collaboration) and [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (engineering skills framework). It provides a unified workspace where teams can create, configure, and orchestrate AI agents — each equipped with specialized skills — to collaboratively tackle complex projects through an intuitive issue-tracking and real-time chat interface.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Current Status & Roadmap](#-current-status--roadmap)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Run Development Server](#run-development-server)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Data Models](#-data-models)
- [License](#-license)

---

## 🏛 Architecture Overview

AgentHub follows a layered, service-oriented architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Collaboration Layer                  │
│  Issue Board │ Agent Directory │ Autopilot Config │ Settings │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket / REST API
┌─────────────────────────▼───────────────────────────────────┐
│                  Platform Orchestration Core                  │
│  Task State Machine │ Event Bus │ Agent Registry & Discovery  │
│  Session Manager │ Skill Retrieval │ Memory & Preferences     │
└───────┬─────────────────┬─────────────────┬─────────────────┘
        │                 │                 │
 ┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐
 │ Local Daemon │  │ Local Daemon   │  │ Local Daemon │
 │ (User A)     │  │ (User B)       │  │ (Server)     │
 │ - CLI Probe  │  │ - CLI Probe    │  │ - Headless   │
 │ - Agent Proc │  │ - Agent Proc   │  │ - Sandboxed  │
 │ - Work Dir   │  │ - Work Dir     │  │ - Resource   │
 └─────────────┘  └───────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │ Report capabilities, pull tasks, push results
┌─────────────────────────▼───────────────────────────────────┐
│                   Infrastructure Services                    │
│  PostgreSQL+pgvector │ Message Queue │ Object Storage        │
│  Secret Management │ Monitoring & Logging                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Current Status & Roadmap

### Implementation Completeness

| Layer | Completion | Status |
|-------|-----------|--------|
| **Web Collaboration UI** | 80% | ✅ Most views built, Autopilot Config pending |
| **REST API (CRUD)** | 90% | ✅ 19 endpoints, full coverage |
| **Real-time Infrastructure** | 20% | ⚠️ Socket.IO service exists but not wired |
| **Authentication & Security** | 0% | ❌ NextAuth installed but not configured |
| **Platform Orchestration Core** | 0% | ❌ No state machine, event bus, or registry |
| **Local Daemon & Agent Execution** | 0% | ❌ Agents are DB records only, no process management |
| **Infrastructure Services** | 15% | ✅ PostgreSQL only, missing pgvector/queues/storage/monitoring |

### Development Roadmap

#### 🔵 Phase 1 — Foundation & Connectivity (Current)

> Goal: Make the platform secure, real-time, and AI-connected

| # | Task | Description | Status |
|---|------|-------------|--------|
| 1.1 | **Authentication** | Configure NextAuth.js v4 with GitHub provider; add `middleware.ts` to protect API routes; add login page; enforce RBAC (owner/admin/member) | 🔄 In Progress |
| 1.2 | **Real-time Integration** | Wire Socket.IO into all views (Dashboard, Agents, Issues, Chat); API routes emit events on data changes; add reconnection UI indicator | 🔄 In Progress |
| 1.3 | **AI Chat Completion** | Replace simulated `setTimeout` responses in Chat view with real `POST /api/chat/complete` streaming; add typing indicator; display token usage | 🔄 In Progress |
| 1.4 | **Autopilot Config View** | New settings page for configuring AI model providers, default models, system prompts, and orchestration parameters | ⬜ Pending |

#### 🟢 Phase 2 — Agent Execution Engine

> Goal: Turn agents from database records into executable processes

| # | Task | Description | Status |
|---|------|-------------|--------|
| 2.1 | **Task State Machine** | Implement `queued → dispatched → running → completed/failed` transitions; add state transition guards and hooks | ⬜ Pending |
| 2.2 | **Task Dispatcher** | Automatic issue → task creation based on agent skills/capacity; priority queue with `maxConcurrent` enforcement | ⬜ Pending |
| 2.3 | **Agent Health Monitor** | Periodic health checks; auto-update agent status to offline on failure; heartbeat mechanism | ⬜ Pending |
| 2.4 | **Agent Execution Runtime** | Sandbox for running agent tasks (invoke LLM APIs with agent instructions + context); capture output and token usage | ⬜ Pending |

#### 🟡 Phase 3 — Orchestration & Events

> Goal: Enable multi-agent collaboration patterns

| # | Task | Description | Status |
|---|------|-------------|--------|
| 3.1 | **Event Bus** | Internal pub/sub system for decoupled event-driven architecture; events: `task.created`, `task.completed`, `agent.status-changed`, `issue.updated` | ⬜ Pending |
| 3.2 | **Task Queue** | Redis/BullMQ integration for async job processing; retry logic with exponential backoff; dead letter queue | ⬜ Pending |
| 3.3 | **Orchestration Patterns** | Implement actual pattern executors: Direct, Pipeline, Fan-out, Router, Supervisor; selectable per-project | ⬜ Pending |
| 3.4 | **Inter-Agent Communication** | Agents can request help from other agents; shared context passing; collaborative task completion | ⬜ Pending |

#### 🟠 Phase 4 — Local Daemon & CLI

> Goal: Enable agent execution on user machines

| # | Task | Description | Status |
|---|------|-------------|--------|
| 4.1 | **Agent Daemon** | Background process that manages agent lifecycle; auto-register with platform on startup; task polling and result pushing | ⬜ Pending |
| 4.2 | **CLI Tool** | `agenthub` CLI for: install daemon, list agents, run task locally, check status, configure provider | ⬜ Pending |
| 4.3 | **Work Directory Management** | Per-task isolated work directories; git integration for code changes; artifact collection | ⬜ Pending |
| 4.4 | **Sandbox & Resource Limits** | CPU/memory/network isolation per agent; timeout enforcement; output size limits | ⬜ Pending |

#### 🔴 Phase 5 — Infrastructure Hardening

> Goal: Production-grade reliability and observability

| # | Task | Description | Status |
|---|------|-------------|--------|
| 5.1 | **pgvector Integration** | Semantic search for skills, issues, and agent matching; embedding generation and storage | ⬜ Pending |
| 5.2 | **Object Storage** | File upload for avatars, issue attachments, agent output artifacts; S3-compatible API | ⬜ Pending |
| 5.3 | **Secret Management** | Encrypted storage for API keys and credentials; per-workspace provider key management | ⬜ Pending |
| 5.4 | **Monitoring & Observability** | Structured logging (pino); request tracing; APM integration (Sentry); dashboard metrics | ⬜ Pending |
| 5.5 | **Multi-Workspace Routing** | Workspace switcher UI; scope all data operations to active workspace | ⬜ Pending |

---

## ✨ Features

### 📊 Dashboard
- Real-time analytics with agent status, issue distribution, and task progress
- Activity feed with live workspace events
- Visual project progress tracking

### 🤖 Agent Management
- **Multi-provider support** — Claude, OpenAI, Gemini, NVIDIA NIM, GLM (智谱AI), 火山引擎 (豆包), or custom providers
- **Custom instructions** — System prompts to define agent behavior and capabilities
- **Skill assignment** — Attach reusable skill cards (Code Review, TDD, Security Audit, etc.)
- **Status monitoring** — Real-time status tracking (idle, working, blocked, error, offline)
- **Environment configuration** — Per-agent environment variables and CLI arguments
- **MCP server config** — Model Context Protocol integration for advanced tool usage

### 📋 Issue Tracking
- **Kanban workflow** — Backlog → To Do → In Progress → In Review → Done / Cancelled
- **Priority ordering** — Visual priority badges with drag-and-drop support
- **Flexible assignment** — Issues assignable to human members or AI agents
- **Activity logging** — Full audit trail of issue lifecycle events
- **Comment system** — Threaded discussions from members and agents
- **Label system** — JSON-based flexible categorization

### 🛠 Skills & Tools
- **Separated Skills & Tools tabs** — Skills (capabilities) vs Tools (executable utilities) are clearly distinguished
- **Categorized** — Engineering, Testing, Review, Deployment, Security, Performance, Git, Documentation, Custom
- **Rich content** — Markdown-based definitions with full descriptions
- **Agent–skill linking** — Many-to-many relationship between agents and skills/tools

### 📁 Projects
- **Lifecycle management** — Planned → In Progress → Paused → Completed
- **Priority system** — None, Low, Medium, High, Urgent
- **Issue aggregation** — Per-project issue counts and status breakdowns

### 💬 Chat
- Direct messaging with individual AI agents
- Persistent chat sessions with full message history
- Session management (create, archive, multiple threads)

### 🎨 UI & Infrastructure
- Responsive design (mobile-first, full desktop optimization)
- Light/Dark theme with system-aware switching via next-themes
- Full i18n support (English / 中文)
- Agent orchestration pattern reference guide

---

## 🏗 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 + tailwindcss-animate |
| **Components** | shadcn/ui (New York style) + Lucide Icons |
| **Database** | PostgreSQL via Prisma ORM 6 (Vercel Neon) |
| **State Management** | Zustand (client) + TanStack Query (server) |
| **Real-time** | Socket.io |
| **Auth** | NextAuth.js v4 |
| **Forms** | React Hook Form + Zod 4 |
| **Animations** | Framer Motion 12 |
| **Theming** | next-themes |
| **Drag & Drop** | @dnd-kit |
| **Charts** | Recharts 2 |
| **Markdown** | react-markdown + remark-gfm |
| **Runtime** | Bun |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+ (recommended) or [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) database (e.g., [Vercel Neon](https://neon.tech/) for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/dav-niu474/multica-z-ai.git
cd multica-z-ai

# Install dependencies
bun install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Configure the required environment variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"

# AI Provider API Keys (configure as needed)
NVIDIA_API_KEY=""
GLM_API_KEY=""
VOLCANO_API_KEY=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""
```

### Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push
```

The app auto-initializes tables and seeds demo data on first visit via `POST /api/setup`.

### Run Development Server

```bash
# Start the development server on port 3000
bun run dev
```

The application will be available at **http://localhost:3000**.

---

## 📂 Project Structure

```
multica-z-ai/
├── prisma/
│   └── schema.prisma            # Database schema (13 models)
├── public/
│   ├── logo.svg                  # App logo
│   └── robots.txt                # SEO config
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Main application page
│   │   ├── globals.css           # Global styles & CSS variables
│   │   └── api/
│   │       ├── agents/           # Agent CRUD + status toggle
│   │       ├── projects/         # Project CRUD
│   │       ├── issues/           # Issue CRUD
│   │       ├── skills/           # Skill CRUD
│   │       ├── chat/             # Chat sessions & AI completion
│   │       ├── dashboard/        # Analytics endpoint
│   │       ├── workspaces/       # Workspace management
│   │       ├── auth/             # NextAuth authentication
│   │       ├── models/           # Available AI models
│   │       ├── health/           # Health check
│   │       ├── setup/            # Initial setup + seed
│   │       └── seed/             # Demo data seeding
│   ├── components/
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── views/                # Page-level view components
│   │   ├── agents/               # Agent form dialog
│   │   ├── projects/             # Project form dialog
│   │   ├── skills/               # Skill form dialog
│   │   ├── issues/               # Issue form & detail panel
│   │   └── chat/                 # Chat message component
│   ├── hooks/                    # Custom React hooks (useSocket, etc.)
│   ├── lib/
│   │   ├── i18n/                 # Internationalization (en/zh)
│   │   ├── model-providers/      # Multi-provider AI abstraction
│   │   ├── db.ts                 # Prisma client singleton
│   │   └── utils.ts              # Utility functions
│   ├── store/                    # Zustand state management
│   ├── types/                    # TypeScript type definitions
│   └── middleware.ts              # Auth & routing middleware
├── mini-services/
│   └── realtime-service/         # Socket.io real-time service (port 3003)
├── Caddyfile                     # Reverse proxy config (port 81 → 3000/3003)
└── package.json
```

---

## 📡 API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/[...nextauth]` | NextAuth authentication endpoints |
| `GET` | `/api/auth/session` | Get current session |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents` | List all agents |
| `POST` | `/api/agents` | Create a new agent |
| `GET` | `/api/agents/[id]` | Get agent details |
| `PUT` | `/api/agents/[id]` | Update an agent |
| `DELETE` | `/api/agents/[id]` | Delete an agent |
| `POST` | `/api/agents/[id]/toggle-status` | Toggle agent status |

### Projects / Issues / Skills / Chat

Full CRUD for projects, issues, skills, and chat sessions/messages. See [API Reference](#-api-reference) for details.

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Workspace analytics |
| `GET` | `/api/workspaces` | List workspaces |
| `POST` | `/api/setup` | Initialize database + seed |
| `GET` | `/api/models` | Available AI models |
| `GET` | `/api/health` | Health check |

---

## 🗃 Data Models

| Model | Description |
|-------|-------------|
| `Workspace` | Top-level container for teams |
| `User` | User accounts with email & avatar |
| `Member` | Workspace membership with roles (owner/admin/member) |
| `Agent` | AI agent configurations with provider, instructions, status |
| `Skill` | Reusable skill/tool cards with type, category & content |
| `AgentSkill` | Many-to-many agent ↔ skill relationship |
| `Project` | Project containers with status & priority |
| `Issue` | Task/issue tracking with full lifecycle |
| `Comment` | Issue comments from members & agents |
| `AgentTask` | Agent execution records with token usage |
| `ChatSession` | Conversation threads with agents |
| `ChatMessage` | Individual messages in chat sessions |
| `ActivityLog` | Audit trail for workspace events |

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/dav-niu474">dav-niu474</a>
</p>
