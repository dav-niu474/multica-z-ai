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
  <strong>多智能体团队协作平台</strong><br/>
  一个现代化的全功能工作空间，用于编排 AI Agent、管理任务，实现人与 AI 的无缝协作。
</p>

<p align="center">
  <a href="https://multica-z-ai.vercel.app" target="_blank"><strong>🌐 在线演示</strong></a> &bull;
  <a href="README.md"><strong>English</strong></a>
</p>

---

> **AgentHub** 灵感来源于 [multica-ai/multica](https://github.com/multica-ai/multica)（人机智能体协作）和 [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)（工程技能框架）。它提供了一个统一的工作空间，团队可以在此创建、配置和编排 AI Agent——每个 Agent 都配备专业技能——通过直观的 Issue 跟踪和实时聊天界面协作完成复杂项目。

---

## 📑 目录

- [系统架构](#-系统架构)
- [当前状态与开发路线图](#-当前状态与开发路线图)
- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [API 文档](#-api-文档)
- [数据模型](#-数据模型)
- [许可证](#-许可证)

---

## 🏛 系统架构

AgentHub 采用分层、面向服务的架构设计：

```
┌─────────────────────────────────────────────────────────────┐
│                       Web 协作界面                           │
│  Issue Board │ Agent Directory │ Autopilot Config │ 偏好面板 │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket / REST API
┌─────────────────────────▼───────────────────────────────────┐
│                    平台调度核心 (Orchestrator)                │
│  - 任务状态机 - 事件总线 (Event Bus) - Agent 注册与发现       │
│  - Session Manager - Skill 检索 - MemoryAgent 偏好查询       │
└───────┬─────────────────┬─────────────────┬─────────────────┘
        │                 │                 │
 ┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐
 │ 本地 Daemon │  │ 本地 Daemon   │  │ 本地 Daemon │
 │ (用户 A)    │  │ (用户 B)      │  │ (服务器集群)│
 │ - CLI 探测  │  │ - CLI 探测    │  │ - 无头运行   │
 │ - Agent 进程│  │ - Agent 进程  │  │ - 沙箱隔离   │
 │ - 工作目录  │  │ - 工作目录    │  │ - 资源限制   │
 └─────────────┘  └───────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │ 上报能力、拉取任务、推送结果
┌─────────────────────────▼───────────────────────────────────┐
│                     基础服务层                                │
│  数据库 (PostgreSQL + pgvector) │ 消息队列 (BullMQ/Redis)   │
│  对象存储 │ 密钥管理 │ 监控日志                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 当前状态与开发路线图

### 实现完成度

| 层级 | 完成度 | 状态 |
|------|--------|------|
| **Web 协作界面** | 80% | ✅ 大部分视图已完成，Autopilot Config 待建 |
| **REST API（CRUD）** | 90% | ✅ 19 个端点，全覆盖 |
| **实时基础设施** | 20% | ⚠️ Socket.IO 服务已搭建但未接入视图 |
| **认证与安全** | 0% | ❌ NextAuth 已安装但未配置 |
| **平台调度核心** | 0% | ❌ 无状态机、事件总线或注册机制 |
| **本地 Daemon 与 Agent 执行** | 0% | ❌ Agent 仅是数据库记录，无进程管理 |
| **基础服务层** | 15% | ✅ 仅有 PostgreSQL，缺 pgvector/队列/存储/监控 |

### 开发路线图

#### 🔵 Phase 1 — 基础连接（当前阶段）

> 目标：让平台具备安全性、实时性和 AI 对话能力

| # | 任务 | 描述 | 状态 |
|---|------|------|------|
| 1.1 | **认证系统** | 配置 NextAuth.js v4 GitHub 登录；添加 `middleware.ts` 保护 API 路由；登录页面；RBAC 权限控制 (owner/admin/member) | 🔄 进行中 |
| 1.2 | **实时接入** | 将 Socket.IO 接入所有视图（Dashboard、Agents、Issues、Chat）；API 路由变更时发送事件；重连 UI 指示器 | 🔄 进行中 |
| 1.3 | **AI 聊天补全** | 替换 Chat 视图中的模拟响应为真实 `POST /api/chat/complete` 流式调用；输入指示器；Token 用量显示 | 🔄 进行中 |
| 1.4 | **Autopilot 配置页** | 新建设置页面：AI 模型供应商配置、默认模型、系统提示词、编排参数 | ⬜ 待开发 |

#### 🟢 Phase 2 — Agent 执行引擎

> 目标：将 Agent 从数据库记录转变为可执行进程

| # | 任务 | 描述 | 状态 |
|---|------|------|------|
| 2.1 | **任务状态机** | 实现 `queued → dispatched → running → completed/failed` 状态转换；状态守卫和钩子 | ⬜ 待开发 |
| 2.2 | **任务调度器** | 基于 Agent 技能/容量自动创建 issue → task；优先级队列，`maxConcurrent` 并发控制 | ⬜ 待开发 |
| 2.3 | **Agent 健康监控** | 定期健康检查；失败自动标记离线；心跳机制 | ⬜ 待开发 |
| 2.4 | **Agent 执行运行时** | Agent 任务沙箱（使用 Agent 指令 + 上下文调用 LLM API）；捕获输出和 Token 用量 | ⬜ 待开发 |

#### 🟡 Phase 3 — 编排与事件

> 目标：实现多 Agent 协作模式

| # | 任务 | 描述 | 状态 |
|---|------|------|------|
| 3.1 | **事件总线** | 内部发布/订阅系统；事件：`task.created`、`task.completed`、`agent.status-changed`、`issue.updated` | ⬜ 待开发 |
| 3.2 | **任务队列** | Redis/BullMQ 异步任务处理；指数退避重试；死信队列 | ⬜ 待开发 |
| 3.3 | **编排模式实现** | 实际模式执行器：直接调用、流水线、扇出、路由器、监督者；可按项目选择 | ⬜ 待开发 |
| 3.4 | **Agent 间通信** | Agent 可请求其他 Agent 协助；共享上下文传递；协作完成任务 | ⬜ 待开发 |

#### 🟠 Phase 4 — 本地 Daemon 与 CLI

> 目标：在用户机器上执行 Agent

| # | 任务 | 描述 | 状态 |
|---|------|------|------|
| 4.1 | **Agent Daemon** | 管理Agent生命周期的后台进程；启动时自动注册到平台；任务轮询和结果推送 | ⬜ 待开发 |
| 4.2 | **CLI 工具** | `agenthub` CLI：安装 daemon、列出 agent、本地执行任务、检查状态、配置供应商 | ⬜ 待开发 |
| 4.3 | **工作目录管理** | 每任务隔离工作目录；Git 集成管理代码变更；产物收集 | ⬜ 待开发 |
| 4.4 | **沙箱与资源限制** | CPU/内存/网络隔离；超时强制终止；输出大小限制 | ⬜ 待开发 |

#### 🔴 Phase 5 — 基础设施加固

> 目标：生产级可靠性和可观测性

| # | 任务 | 描述 | 状态 |
|---|------|------|------|
| 5.1 | **pgvector 集成** | 技能、Issue、Agent 匹配的语义搜索；向量生成和存储 | ⬜ 待开发 |
| 5.2 | **对象存储** | 头像、Issue 附件、Agent 输出产物的文件上传；S3 兼容 API | ⬜ 待开发 |
| 5.3 | **密钥管理** | API 密钥和凭证的加密存储；按工作空间的供应商密钥管理 | ⬜ 待开发 |
| 5.4 | **监控与可观测性** | 结构化日志 (pino)；请求追踪；APM 集成 (Sentry)；仪表盘指标 | ⬜ 待开发 |
| 5.5 | **多工作空间路由** | 工作空间切换 UI；所有数据操作限定在当前工作空间范围内 | ⬜ 待开发 |

---

## ✨ 功能特性

### 📊 仪表盘
- 实时数据分析 — Agent 状态概览、Issue 分布、任务进度
- 活动动态流 — 工作空间实时事件
- 项目进度跟踪 — 活跃项目的可视化进度

### 🤖 Agent 管理
- **多供应商支持** — Claude、OpenAI、Gemini、NVIDIA NIM、GLM (智谱AI)、火山引擎 (豆包)、自定义供应商
- **自定义指令** — 为每个 Agent 设置系统提示词
- **技能分配** — 将可复用技能卡片附加到 Agent
- **状态监控** — 实时 Agent 状态跟踪
- **环境配置** — 每个 Agent 独立的环境变量

### 📋 Issue 跟踪
- **看板式工作流** — 待办 → 执行中 → 评审中 → 已完成 / 已取消
- **优先级排序** — 可视化优先级徽章，支持拖放
- **灵活分配** — 可分配给人类成员或 AI Agent
- **活动日志** — 完整审计跟踪
- **评论系统** — 成员和 Agent 的讨论

### 🛠 技能与工具
- **技能/工具分离** — 技能（能力）与工具（可执行程序）清晰区分，独立 Tab 展示
- **分类管理** — 工程、测试、审查、部署、安全、性能、Git、文档、自定义
- **富文本内容** — Markdown 格式的技能定义
- **Agent 关联** — 多对多关系

### 📁 项目
- **生命周期管理** — 计划中 → 进行中 → 暂停 → 已完成
- **优先级系统** — 无、低、中、高、紧急
- **Issue 聚合** — 每个项目聚合 Issue 统计

### 💬 聊天
- 与 AI Agent 的直接对话
- 持久化会话与完整消息记录
- 会话管理

### 🎨 UI 与基础设施
- 响应式设计（移动优先）
- 明暗主题切换
- 完整国际化（English / 中文）
- Agent 编排模式参考指南

---

## 🏗 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 16 (App Router) |
| **语言** | TypeScript 5 |
| **UI 库** | React 19 |
| **样式** | Tailwind CSS 4 + tailwindcss-animate |
| **组件库** | shadcn/ui (New York 风格) + Lucide Icons |
| **数据库** | PostgreSQL (Prisma ORM 6, Vercel Neon) |
| **状态管理** | Zustand (客户端) + TanStack Query (服务端) |
| **实时通信** | Socket.io |
| **认证** | NextAuth.js v4 |
| **表单** | React Hook Form + Zod 4 |
| **动画** | Framer Motion 12 |
| **主题** | next-themes |
| **拖放** | @dnd-kit |
| **图表** | Recharts 2 |
| **Markdown** | react-markdown + remark-gfm |
| **运行时** | Bun |

---

## 🚀 快速开始

### 前置要求

- [Bun](https://bun.sh/) v1.0+ 或 [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) 数据库

### 安装

```bash
git clone https://github.com/dav-niu474/multica-z-ai.git
cd multica-z-ai
bun install
```

### 环境变量

```bash
cp .env.example .env.local
```

```env
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"

# AI 供应商 API 密钥（按需配置）
NVIDIA_API_KEY=""
GLM_API_KEY=""
VOLCANO_API_KEY=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""
```

### 数据库配置

```bash
bun run db:generate
bun run db:push
```

首次访问时，应用会自动通过 `POST /api/setup` 初始化表结构并填充演示数据。

### 启动开发服务器

```bash
bun run dev
```

应用将在 **http://localhost:3000** 启动。

---

## 📂 项目结构

```
multica-z-ai/
├── prisma/schema.prisma            # 数据库 Schema (13 个模型)
├── src/
│   ├── app/
│   │   ├── page.tsx                # 主应用页面
│   │   └── api/                    # API 路由 (19+ 端点)
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 组件库
│   │   └── views/                  # 页面视图组件
│   ├── hooks/                      # 自定义 Hooks (useSocket 等)
│   ├── lib/
│   │   ├── i18n/                   # 国际化 (en/zh)
│   │   ├── model-providers/        # 多供应商 AI 抽象层
│   │   └── db.ts                   # Prisma 客户端
│   └── types/                      # TypeScript 类型定义
├── mini-services/realtime-service/ # Socket.io 实时服务 (端口 3003)
└── Caddyfile                       # 反向代理配置
```

---

## 📡 API 文档

### 认证

| 方法 | 端点 | 描述 |
|------|------|------|
| `GET` | `/api/auth/[...nextauth]` | NextAuth 认证端点 |
| `GET` | `/api/auth/session` | 获取当前会话 |

### Agent / 项目 / Issue / 技能 / 聊天

完整的 CRUD 端点，详见 [English README](README.md#-api-reference)。

---

## 🗃 数据模型

| 模型 | 描述 |
|------|------|
| `Workspace` | 团队顶层容器 |
| `User` | 用户账号 |
| `Member` | 工作空间成员角色 (owner/admin/member) |
| `Agent` | AI Agent 配置 |
| `Skill` | 技能/工具卡片（类型区分） |
| `AgentSkill` | Agent ↔ 技能多对多关联 |
| `Project` | 项目容器 |
| `Issue` | Issue 跟踪（完整生命周期） |
| `Comment` | Issue 评论 |
| `AgentTask` | Agent 执行记录 |
| `ChatSession` | 对话会话 |
| `ChatMessage` | 聊天消息 |
| `ActivityLog` | 活动审计日志 |

---

## 📄 许可证

本项目基于 **MIT 许可证** 开源。

---

<p align="center">
  由 <a href="https://github.com/dav-niu474">dav-niu474</a> 用 ❤️ 构建
</p>
