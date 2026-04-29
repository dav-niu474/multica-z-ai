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
- [Agent Orchestration Patterns](#-agent-orchestration-patterns)
- [Multi-Provider AI Support](#-multi-provider-ai-support)
- [Data Models](#-data-models)
- [Screenshots](#-screenshots)
- [License](#-license)

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

### 🛠 Skills
- **Categorized skills** — Engineering, Testing, Review, Deployment, Security, Performance, Git, Documentation, Custom
- **Rich content** — Markdown-based skill definitions with full descriptions
- **Agent–skill linking** — Many-to-many relationship between agents and skills

### 📁 Projects
- **Lifecycle management** — Planned → In Progress → Paused → Completed
- **Priority system** — None, Low, Medium, High, Urgent
- **Issue aggregation** — Per-project issue counts and status breakdowns

### 💬 Real-time Chat
- Direct messaging with individual AI agents
- Persistent chat sessions with full message history
- Session management (create, archive, multiple threads)
- Markdown rendering with syntax highlighting

### 🌐 Multi-Provider AI
Supports 6+ AI providers with unified chat completion API:
- **NVIDIA NIM** — Llama 3.1, Mixtral, Nemotron, Qwen
- **GLM (智谱AI)** — GLM-4-Plus, GLM-4-Long, GLM-4V-Plus, GLM-4-AllTools
- **火山引擎 (豆包)** — Doubao Pro/Lite models
- **OpenAI** — GPT-4o, GPT-4o Mini
- **Anthropic Claude** — Claude Sonnet 4, Claude 3.5 Sonnet
- **Google Gemini** — Gemini 2.5 Pro
- **Custom** — Any OpenAI-compatible API endpoint

### 🎨 UI & Infrastructure
- Responsive design (mobile-first, full desktop optimization)
- Light/Dark theme with system-aware switching via next-themes
- Real-time updates via Socket.io
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
| **Real-time** | Socket.io Client |
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

# NextAuth (optional)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

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

# (Optional) Seed with demo data after starting dev server
# Visit http://localhost:3000/api/seed
```

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
│   │       │   └── [id]/
│   │       │       └── toggle-status/
│   │       ├── projects/         # Project CRUD
│   │       │   └── [id]/
│   │       ├── issues/           # Issue CRUD
│   │       │   └── [id]/
│   │       ├── skills/           # Skill CRUD
│   │       │   └── [id]/
│   │       ├── chat/             # Chat sessions & messages
│   │       │   ├── [id]/
│   │       │   │   └── messages/
│   │       │   └── complete/
│   │       ├── dashboard/        # Analytics endpoint
│   │       ├── workspaces/       # Workspace management
│   │       ├── models/           # Available AI models
│   │       ├── health/           # Health check
│   │       ├── setup/            # Initial setup
│   │       └── seed/             # Demo data seeding
│   ├── components/
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── views/                # Page-level view components
│   │   ├── layout/               # Sidebar & page layout
│   │   ├── agents/               # Agent form dialog
│   │   ├── projects/             # Project form dialog
│   │   ├── skills/               # Skill form dialog
│   │   ├── issues/               # Issue form & detail panel
│   │   └── chat/                 # Chat message component
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities, API client, DB client, model providers
│   ├── store/                    # Zustand state management
│   ├── types/                    # TypeScript type definitions
│   └── views/                    # View wrappers
├── mini-services/
│   └── realtime-service/         # Socket.io real-time service
├── examples/                     # Example code
│   └── websocket/
├── .env.example                  # Environment variable template
└── package.json
```

---

## 📡 API Reference

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents` | List all agents |
| `POST` | `/api/agents` | Create a new agent |
| `GET` | `/api/agents/[id]` | Get agent details |
| `PUT` | `/api/agents/[id]` | Update an agent |
| `DELETE` | `/api/agents/[id]` | Delete an agent |
| `POST` | `/api/agents/[id]/toggle-status` | Toggle agent online/offline status |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List projects with issue counts |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects/[id]` | Get project details |
| `PUT` | `/api/projects/[id]` | Update a project |
| `DELETE` | `/api/projects/[id]` | Delete a project |

### Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/issues` | List issues (filterable) |
| `POST` | `/api/issues` | Create an issue |
| `GET` | `/api/issues/[id]` | Get issue details |
| `PUT` | `/api/issues/[id]` | Update an issue |
| `DELETE` | `/api/issues/[id]` | Delete an issue |

### Skills

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/skills` | List skills with agent links |
| `POST` | `/api/skills` | Create a skill |
| `GET` | `/api/skills/[id]` | Get skill details |
| `PUT` | `/api/skills/[id]` | Update a skill |
| `DELETE` | `/api/skills/[id]` | Delete a skill |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chat` | List chat sessions |
| `POST` | `/api/chat` | Create a chat session |
| `GET` | `/api/chat/[id]/messages` | Get messages for a session |
| `POST` | `/api/chat/[id]/messages` | Send a message |
| `POST` | `/api/chat/complete` | AI chat completion |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Workspace analytics & stats |
| `GET` | `/api/workspaces` | List workspaces |
| `POST` | `/api/workspaces` | Create a workspace |
| `GET` | `/api/models` | List available AI models |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/setup` | Initial workspace setup |
| `POST` | `/api/seed` | Seed demo data |

---

## 🔄 Agent Orchestration Patterns

AgentHub includes a built-in reference guide for common agent orchestration patterns:

| Pattern | Description |
|---------|-------------|
| **Direct Invocation** | Single agent handles a task end-to-end |
| **Pipeline** | Sequential chain of agents, each processing the output of the previous |
| **Fan-out** | Parallel dispatch to multiple agents, results aggregated |
| **Router** | A classifier agent routes tasks to specialized agents |
| **Supervisor** | A supervisor agent delegates, monitors, and coordinates sub-agents |
| **Mixture of Agents** | Layered architecture with proposer and aggregator roles |

These patterns help teams design effective multi-agent workflows for different complexity levels.

---

## 🤖 Multi-Provider AI Support

AgentHub provides a unified `chatCompletion` and `streamChatCompletion` API that works across all supported providers. Configure API keys in environment variables to enable providers dynamically.

```typescript
import { chatCompletion, streamChatCompletion } from '@/lib/model-providers'

// Non-streaming completion
const response = await chatCompletion({
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  messages: [{ role: 'user', content: 'Hello!' }],
})

// Streaming completion
for await (const chunk of streamChatCompletion({
  provider: 'glm',
  model: 'glm-4-plus',
  messages: [{ role: 'user', content: '你好！' }],
})) {
  process.stdout.write(chunk)
}
```

---

## 🗃 Data Models

The platform defines **13 models** in the Prisma schema:

| Model | Description |
|-------|-------------|
| `Workspace` | Top-level container for teams |
| `User` | User accounts with email & avatar |
| `Member` | Workspace membership with roles (owner/admin/member) |
| `Agent` | AI agent configurations with provider, instructions, status |
| `Skill` | Reusable skill cards with category & content |
| `AgentSkill` | Many-to-many agent ↔ skill relationship |
| `Project` | Project containers with status & priority |
| `Issue` | Task/issue tracking with full lifecycle |
| `Comment` | Issue comments from members & agents |
| `AgentTask` | Agent execution records with token usage |
| `ChatSession` | Conversation threads with agents |
| `ChatMessage` | Individual messages in chat sessions |
| `ActivityLog` | Audit trail for workspace events |

---

## 📸 Screenshots

> Screenshots coming soon. In the meantime, visit the [live demo](https://multica-z-ai.vercel.app) to explore the platform.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/dav-niu474">dav-niu474</a>
</p>
