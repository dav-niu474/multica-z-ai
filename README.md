<p align="center">
  <h1 align="center">🤖 Multica Z-AI</h1>
  <p align="center">
    <a href="#overview"><strong>English</strong></a> &bull;
    <a href="#概述"><strong>中文</strong></a>
  </p>
  <p align="center">
    <strong>Team Collaboration Multi-Agent Platform</strong><br/>
    <strong>团队协作多智能体平台</strong>
  </p>
  <p align="center">
    A modern, full-featured workspace for orchestrating AI agents, managing tasks, and enabling seamless human-AI collaboration.<br/>
    一个现代化的多智能体协作工作空间，用于编排 AI Agent、管理任务，实现人与 AI 的无缝协作。
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

---

<a id="overview"></a>
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

<a id="architecture"></a>
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

| Model | Description | 描述 |
|-------|-------------|------|
| `Workspace` | Top-level container for teams | 团队顶层容器 |
| `User` | User accounts with email & avatar | 用户账号 |
| `Member` | Workspace membership with roles (owner/admin/member) | 工作空间成员角色 |
| `Agent` | AI agent configurations with provider, instructions, status | AI Agent 配置 |
| `Skill` | Reusable skill cards with category & content | 可复用技能卡片 |
| `AgentSkill` | Many-to-many agent ↔ skill link | Agent 与技能关联 |
| `Project` | Project containers with status & priority | 项目容器 |
| `Issue` | Task/issue tracking with full lifecycle | 任务/Issue 跟踪 |
| `Comment` | Issue comments from members & agents | Issue 评论 |
| `AgentTask` | Agent execution records with token usage | Agent 执行记录 |
| `ChatSession` | Conversation threads with agents | Agent 对话会话 |
| `ChatMessage` | Individual messages in chat sessions | 聊天消息 |
| `ActivityLog` | Audit trail for workspace events | 工作空间活动日志 |

---

<a id="tech-stack"></a>
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

<a id="getting-started"></a>
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

Copy `.env.example` to `.env.local` in the project root:

```bash
cp .env.example .env.local
```

```env
# Database (SQLite)
DATABASE_URL="file:./db/custom.db"

# NextAuth (optional)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

---

<a id="project-structure"></a>
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
├── .env.example               # Environment variable template
└── package.json
```

---

<a id="api-reference"></a>
## API Reference

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents / 列出所有 Agent |
| POST | `/api/agents` | Create a new agent / 创建 Agent |
| GET | `/api/agents/[id]` | Get agent details / 获取 Agent 详情 |
| PUT | `/api/agents/[id]` | Update agent / 更新 Agent |
| DELETE | `/api/agents/[id]` | Delete agent / 删除 Agent |
| POST | `/api/agents/[id]/toggle-status` | Toggle agent status / 切换 Agent 状态 |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects with issue counts / 列出项目及 Issue 统计 |
| POST | `/api/projects` | Create a project / 创建项目 |
| PUT | `/api/projects/[id]` | Update project / 更新项目 |
| DELETE | `/api/projects/[id]` | Delete project / 删除项目 |

### Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/issues` | List issues (filterable) / 列出 Issue（可筛选） |
| POST | `/api/issues` | Create an issue / 创建 Issue |
| PUT | `/api/issues/[id]` | Update issue / 更新 Issue |
| DELETE | `/api/issues/[id]` | Delete issue / 删除 Issue |

### Skills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | List skills with agent links / 列出技能及关联 Agent |
| POST | `/api/skills` | Create a skill / 创建技能 |
| PUT | `/api/skills/[id]` | Update skill / 更新技能 |
| DELETE | `/api/skills/[id]` | Delete skill / 删除技能 |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat` | List chat sessions / 列出会话 |
| POST | `/api/chat` | Create a chat session / 创建会话 |
| GET | `/api/chat/[id]/messages` | Get messages / 获取消息 |
| POST | `/api/chat/[id]/messages` | Send a message / 发送消息 |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get workspace analytics / 获取工作空间分析数据 |

---

## License

MIT

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/dav-niu474">dav-niu474</a>
</p>

---
---

<a id="概述"></a>
# 概述

**Multica Z-AI** 是一款功能全面的多智能体协作平台，灵感来源于 [multica-ai/multica](https://github.com/multica-ai/multica) 和 [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)。它提供了一个统一的工作空间，团队可以在此创建、配置和编排 AI Agent——每个 Agent 都配备专业技能——通过直观的 Issue 跟踪和实时聊天界面协作完成复杂项目。

## 功能特性

### 仪表盘
- **实时数据分析** — Agent 状态概览、Issue 分布、任务进度和项目健康度
- **活动动态流** — 工作空间实时事件流，包括 Agent 操作和 Issue 更新
- **项目进度跟踪** — 活跃项目的可视化进度条

### Agent 管理
- **多供应商支持** — 配置 Claude、OpenAI、Gemini、Codex 或自定义供应商
- **自定义指令** — 为每个 Agent 设置系统提示词，定义行为和能力
- **技能分配** — 将可复用技能卡片附加到 Agent（工程、测试、审查、安全等）
- **状态监控** — 实时 Agent 状态跟踪（空闲、工作中、阻塞、错误、离线）
- **环境配置** — 每个 Agent 独立的环境变量和命令行参数
- **MCP 服务器配置** — Model Context Protocol 集成，支持高级工具调用

### 项目工作区
- **项目生命周期管理** — 跟踪项目从计划、进行中、暂停到完成的全过程
- **优先级系统** — 无、低、中、高、紧急五个优先级
- **Issue 聚合** — 每个项目聚合其关联的 Issue 及状态分布

### 技能市场
- **分类技能** — 工程、测试、审查、部署、安全、性能、Git、文档、自定义
- **富文本内容** — 基于 Markdown 的技能定义，包含完整描述
- **Agent-技能关联** — Agent 与技能之间的多对多关系
- **导入与创建** — 手动创建或从外部来源导入技能

### Issue 跟踪
- **看板式状态工作流** — 待办 → 执行中 → 评审中 → 已完成 / 已取消
- **优先级排序** — 可视化优先级徽章，支持拖放
- **Agent 与成员分配** — Issue 可分配给人类成员或 AI Agent
- **活动日志** — Issue 生命周期事件的完整审计跟踪
- **评论系统** — 支持成员和 Agent 的评论讨论
- **标签系统** — 基于 JSON 的标签，灵活分类

### 实时聊天
- **Agent 对话** — 与单个 AI Agent 的直接消息界面
- **消息历史** — 持久化聊天会话，完整消息记录
- **会话管理** — 创建、归档和管理多个对话线程
- **Markdown 渲染** — 支持语法高亮的富文本消息

### 基础设施
- **响应式设计** — 移动优先布局，完整桌面端优化
- **明暗主题** — 通过 next-themes 实现系统感知的主题切换
- **实时更新** — Socket.io 驱动的实时数据同步
- **REST API** — 所有资源的完整 CRUD API

---

<a id="系统架构"></a>
## 系统架构

```
┌──────────────────────────────────────────────────────────────┐
│                       客户端层 (Client Layer)                │
│  Next.js 16 App Router  ·  React 19  ·  Tailwind CSS 4      │
│  shadcn/ui 组件  ·  Zustand 状态管理  ·  TanStack Query      │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    API 层 (Route Handlers)                    │
│  /api/agents  ·  /api/projects  ·  /api/issues              │
│  /api/skills  ·  /api/chat  ·  /api/dashboard               │
│  /api/workspaces  ·  /api/seed                               │
└──────────┬───────────────────────────────────┬───────────────┘
           │                                   │
┌──────────▼──────────┐            ┌────────────▼─────────────┐
│   Prisma ORM        │            │   Socket.io 服务          │
│   SQLite 数据库      │            │   (Mini Service :3003)   │
│   12 个数据模型       │            │   实时事件推送            │
└─────────────────────┘            └──────────────────────────┘
```

---

<a id="快速开始"></a>
## 快速开始

### 前置要求

- [Bun](https://bun.sh/) v1.0+
- [Node.js](https://nodejs.org/) 18+（可选，推荐 Bun）

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/dav-niu474/multica-z-ai.git
cd multica-z-ai

# 安装依赖
bun install

# 初始化数据库
bun run db:push

# （可选）填充演示数据
# 启动开发服务器后访问 http://localhost:3000/api/seed

# 启动开发服务器
bun run dev
```

应用将在 `http://localhost:3000` 启动。

### 环境变量

将 `.env.example` 复制为 `.env.local`：

```bash
cp .env.example .env.local
```

```env
# 数据库 (SQLite)
DATABASE_URL="file:./db/custom.db"

# NextAuth (可选)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

---

## 许可证

MIT

---

<p align="center">
  由 <a href="https://github.com/dav-niu474">dav-niu474</a> 用 ❤️ 构建
</p>
