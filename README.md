<p align="center">
  <h1 align="center">Multica Z-AI</h1>
  <p align="center">
    <strong>Team Collaboration Multi-Agent Platform</strong>
  </p>
  <p align="center">
    A modern, full-featured workspace for orchestrating AI agents, managing tasks, and enabling seamless human-AI collaboration — built with Next.js 16, TypeScript, and cutting-edge UI technologies.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/shadcn/ui-New%20York-18181B?logo=shadcnui&logoColor=white" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
</p>

<p align="center">
  <a href="#features">Features</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#project-structure">Project Structure</a> &bull;
  <a href="#api-reference">API Reference</a>
</p>

---

## Overview

**Multica Z-AI** is a comprehensive multi-agent collaboration platform inspired by [multica-ai/multica](https://github.com/multica-ai/multica) and [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills). It provides a unified workspace where teams can create, configure, and orchestrate AI agents — each equipped with specialized skills — to collaboratively tackle complex projects through an intuitive issue-tracking and real-time chat interface.

## Features

### Dashboard
- **Real-time analytics** — Overview of agent status, issue distribution, task progress, and project health
- **Activity feed** — Live stream of workspace events including agent actions and issue updates
- **Project progress tracking** — Visual progress bars for active projects

### Agent Management
- **Multi-provider support** — Configure agents with Claude, OpenAI, Gemini, Codex, or custom providers
- **Custom instructions** — Set system prompts for each agent to define behavior and capabilities
- **Skill assignment** — Attach reusable skill cards to agents (engineering, testing, review, security, etc.)
- **Status monitoring** — Real-time agent status tracking (idle, working, blocked, error, offline)
- **Environment configuration** — Custom environment variables and CLI arguments per agent
- **MCP server config** — Model Context Protocol integration for advanced tool usage

### Project Workspace
- **Project lifecycle management** — Track projects through planned, in-progress, paused, and completed states
- **Priority system** — None, low, medium, high, and urgent priority levels
- **Issue aggregation** — Each project aggregates its related issues with status breakdowns

### Skills Marketplace
- **Categorized skills** — Engineering, Testing, Review, Deployment, Security, Performance, Git, Documentation, Custom
- **Rich content** — Markdown-based skill definitions with full descriptions
- **Agent-skill linking** — Many-to-many relationship between agents and skills
- **Import & create** — Skills can be created manually or imported from external sources

### Issue Tracking
- **Kanban-style status workflow** — Backlog → To Do → In Progress → In Review → Done / Cancelled
- **Priority-based ordering** — Visual priority badges with drag-and-drop support
- **Agent & member assignment** — Issues can be assigned to both human members and AI agents
- **Activity logging** — Full audit trail of issue lifecycle events
- **Comment system** — Threaded discussions with support for both member and agent authors
- **Label system** — JSON-based label tagging for flexible categorization

### Real-time Chat
- **Agent conversations** — Direct messaging interface with individual AI agents
- **Message history** — Persistent chat sessions with full message history
- **Session management** — Create, archive, and manage multiple conversation threads
- **Markdown rendering** — Rich message content with syntax highlighting

### Infrastructure
- **Responsive design** — Mobile-first layout with full desktop optimization
- **Light/Dark theme** — System-aware theme switching via next-themes
- **Real-time updates** — Socket.io powered live data synchronization
- **REST API** — Full CRUD API for all resources

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  Next.js 16 App Router  ·  React 19  ·  Tailwind CSS 4      │
│  shadcn/ui Components  ·  Zustand State  ·  TanStack Query  │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                      API Layer (Route Handlers)              │
│  /api/agents  ·  /api/projects  ·  /api/issues              │
│  /api/skills  ·  /api/chat  ·  /api/dashboard               │
│  /api/workspaces  ·  /api/seed                               │
└──────────┬───────────────────────────────────┬───────────────┘
           │                                   │
┌──────────▼──────────┐            ┌────────────▼─────────────┐
│   Prisma ORM        │            │   Socket.io Service      │
│   SQLite Database   │            │   (Mini Service :3003)   │
│   12 Models         │            │   Real-time Events       │
└─────────────────────┘            └──────────────────────────┘
```

### Data Model (12 Models)

| Model | Description |
|-------|-------------|
| `Workspace` | Top-level container for teams |
| `User` | User accounts with email & avatar |
| `Member` | Workspace membership with roles (owner/admin/member) |
| `Agent` | AI agent configurations with provider, instructions, status |
| `Skill` | Reusable skill cards with category & content |
| `AgentSkill` | Many-to-many agent ↔ skill link |
| `Project` | Project containers with status & priority |
| `Issue` | Task/issue tracking with full lifecycle |
| `Comment` | Issue comments from members & agents |
| `AgentTask` | Agent execution records with token usage |
| `ChatSession` | Conversation threads with agents |
| `ChatMessage` | Individual messages in chat sessions |
| `ActivityLog` | Audit trail for workspace events |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 + tailwindcss-animate |
| **Components** | shadcn/ui (New York style) + Lucide Icons |
| **Database** | SQLite via Prisma ORM 6 |
| **State** | Zustand (client) + TanStack Query (server) |
| **Real-time** | Socket.io Client |
| **Forms** | React Hook Form + Zod 4 |
| **Animations** | Framer Motion 12 |
| **Theming** | next-themes |
| **Drag & Drop** | @dnd-kit |
| **Charts** | Recharts 2 |
| **Markdown** | react-markdown + remark-gfm |
| **Runtime** | Bun |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Node.js](https://nodejs.org/) 18+ (optional, Bun preferred)

### Installation

```bash
# Clone the repository
git clone https://github.com/dav-niu474/multica-z-ai.git
cd multica-z-ai

# Install dependencies
bun install

# Set up database
bun run db:push

# (Optional) Seed with demo data
# Visit http://localhost:3000/api/seed after starting dev server

# Start development server
bun run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Database (SQLite)
DATABASE_URL="file:./db/custom.db"

# NextAuth (optional)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

---

## Project Structure

```
multica-z-ai/
├── prisma/
│   └── schema.prisma          # Database schema (12 models)
├── public/
│   ├── logo.svg               # App logo
│   └── robots.txt             # SEO config
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Main application page
│   │   ├── globals.css        # Global styles & CSS variables
│   │   └── api/
│   │       ├── agents/        # Agent CRUD + status toggle
│   │       ├── projects/      # Project CRUD
│   │       ├── issues/        # Issue CRUD
│   │       ├── skills/        # Skill CRUD
│   │       ├── chat/          # Chat session & messages
│   │       ├── dashboard/     # Analytics endpoint
│   │       ├── workspaces/    # Workspace management
│   │       └── seed/          # Demo data seeding
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── views/             # Page-level view components
│   │   ├── layout/            # Sidebar & page layout
│   │   ├── agents/            # Agent form dialog
│   │   ├── projects/          # Project form dialog
│   │   ├── skills/            # Skill form dialog
│   │   ├── issues/            # Issue form & detail panel
│   │   └── chat/              # Chat message component
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities, API client, DB client
│   ├── store/                 # Zustand state management
│   ├── types/                 # TypeScript type definitions
│   └── views/                 # View wrappers
├── mini-services/
│   └── realtime-service/      # Socket.io real-time service
└── package.json
```

---

## API Reference

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| POST | `/api/agents` | Create a new agent |
| GET | `/api/agents/[id]` | Get agent details |
| PUT | `/api/agents/[id]` | Update agent |
| DELETE | `/api/agents/[id]` | Delete agent |
| POST | `/api/agents/[id]/toggle-status` | Toggle agent status |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects with issue counts |
| POST | `/api/projects` | Create a project |
| PUT | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |

### Issues
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/issues` | List issues (filterable) |
| POST | `/api/issues` | Create an issue |
| PUT | `/api/issues/[id]` | Update issue |
| DELETE | `/api/issues/[id]` | Delete issue |

### Skills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | List skills with agent links |
| POST | `/api/skills` | Create a skill |
| PUT | `/api/skills/[id]` | Update skill |
| DELETE | `/api/skills/[id]` | Delete skill |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat` | List chat sessions |
| POST | `/api/chat` | Create a chat session |
| GET | `/api/chat/[id]/messages` | Get messages |
| POST | `/api/chat/[id]/messages` | Send a message |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get workspace analytics |

---

## License

MIT

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/dav-niu474">dav-niu474</a>
</p>
