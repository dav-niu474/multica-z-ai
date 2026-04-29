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

- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
  - [前置要求](#前置要求)
  - [安装](#安装)
  - [环境变量](#环境变量)
  - [数据库配置](#数据库配置)
  - [启动开发服务器](#启动开发服务器)
- [项目结构](#-项目结构)
- [API 文档](#-api-文档)
- [Agent 编排模式](#-agent-编排模式)
- [多供应商 AI 支持](#-多供应商-ai-支持)
- [数据模型](#-数据模型)
- [截图](#-截图)
- [许可证](#-许可证)

---

## ✨ 功能特性

### 📊 仪表盘
- 实时数据分析 — Agent 状态概览、Issue 分布、任务进度和项目健康度
- 活动动态流 — 工作空间实时事件流，包括 Agent 操作和 Issue 更新
- 项目进度跟踪 — 活跃项目的可视化进度条

### 🤖 Agent 管理
- **多供应商支持** — Claude、OpenAI、Gemini、NVIDIA NIM、GLM (智谱AI)、火山引擎 (豆包) 或自定义供应商
- **自定义指令** — 为每个 Agent 设置系统提示词，定义行为和能力
- **技能分配** — 将可复用技能卡片附加到 Agent（Code Review、TDD、Security Audit 等）
- **状态监控** — 实时 Agent 状态跟踪（空闲、工作中、阻塞、错误、离线）
- **环境配置** — 每个 Agent 独立的环境变量和命令行参数
- **MCP 服务器配置** — Model Context Protocol 集成，支持高级工具调用

### 📋 Issue 跟踪
- **看板式工作流** — 待办 → 执行中 → 评审中 → 已完成 / 已取消
- **优先级排序** — 可视化优先级徽章，支持拖放
- **灵活分配** — Issue 可分配给人类成员或 AI Agent
- **活动日志** — Issue 生命周期事件的完整审计跟踪
- **评论系统** — 支持成员和 Agent 的评论讨论
- **标签系统** — 基于 JSON 的灵活分类

### 🛠 技能
- **分类技能** — 工程、测试、审查、部署、安全、性能、Git、文档、自定义
- **富文本内容** — 基于 Markdown 的技能定义，包含完整描述
- **Agent-技能关联** — Agent 与技能之间的多对多关系

### 📁 项目
- **生命周期管理** — 计划中 → 进行中 → 暂停 → 已完成
- **优先级系统** — 无、低、中、高、紧急五个优先级
- **Issue 聚合** — 每个项目聚合其关联的 Issue 及状态分布

### 💬 实时聊天
- 与单个 AI Agent 的直接消息界面
- 持久化聊天会话，完整消息记录
- 会话管理（创建、归档、多个对话线程）
- 支持语法高亮的 Markdown 渲染

### 🌐 多供应商 AI
支持 6+ AI 供应商，统一聊天补全 API：
- **NVIDIA NIM** — Llama 3.1、Mixtral、Nemotron、Qwen
- **GLM (智谱AI)** — GLM-4-Plus、GLM-4-Long、GLM-4V-Plus、GLM-4-AllTools
- **火山引擎 (豆包)** — 豆包 Pro/Lite 系列模型
- **OpenAI** — GPT-4o、GPT-4o Mini
- **Anthropic Claude** — Claude Sonnet 4、Claude 3.5 Sonnet
- **Google Gemini** — Gemini 2.5 Pro
- **Custom** — 任何兼容 OpenAI API 的端点

### 🎨 UI 与基础设施
- 响应式设计（移动优先，完整桌面端优化）
- 明暗主题切换，支持系统感知（next-themes）
- Socket.io 驱动的实时数据同步
- 完整的国际化支持（English / 中文）
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
| **数据库** | PostgreSQL，通过 Prisma ORM 6 (Vercel Neon) |
| **状态管理** | Zustand (客户端) + TanStack Query (服务端) |
| **实时通信** | Socket.io Client |
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

- [Bun](https://bun.sh/) v1.0+（推荐）或 [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) 数据库（推荐使用 [Vercel Neon](https://neon.tech/) 作为生产环境数据库）

### 安装

```bash
# 克隆仓库
git clone https://github.com/dav-niu474/multica-z-ai.git
cd multica-z-ai

# 安装依赖
bun install
```

### 环境变量

在项目根目录创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

配置必要的环境变量：

```env
# 数据库 (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth (可选)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# AI 供应商 API 密钥 (按需配置)
NVIDIA_API_KEY=""
GLM_API_KEY=""
VOLCANO_API_KEY=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""
```

### 数据库配置

```bash
# 生成 Prisma 客户端
bun run db:generate

# 推送数据库 Schema
bun run db:push

# (可选) 启动开发服务器后填充演示数据
# 访问 http://localhost:3000/api/seed
```

### 启动开发服务器

```bash
# 在 3000 端口启动开发服务器
bun run dev
```

应用将在 **http://localhost:3000** 启动。

---

## 📂 项目结构

```
multica-z-ai/
├── prisma/
│   └── schema.prisma            # 数据库 Schema (13 个模型)
├── public/
│   ├── logo.svg                  # 应用 Logo
│   └── robots.txt                # SEO 配置
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 根布局与 Provider
│   │   ├── page.tsx              # 主应用页面
│   │   ├── globals.css           # 全局样式与 CSS 变量
│   │   └── api/
│   │       ├── agents/           # Agent CRUD + 状态切换
│   │       │   └── [id]/
│   │       │       └── toggle-status/
│   │       ├── projects/         # 项目 CRUD
│   │       │   └── [id]/
│   │       ├── issues/           # Issue CRUD
│   │       │   └── [id]/
│   │       ├── skills/           # 技能 CRUD
│   │       │   └── [id]/
│   │       ├── chat/             # 聊天会话与消息
│   │       │   ├── [id]/
│   │       │   │   └── messages/
│   │       │   └── complete/
│   │       ├── dashboard/        # 数据分析端点
│   │       ├── workspaces/       # 工作空间管理
│   │       ├── models/           # 可用 AI 模型列表
│   │       ├── health/           # 健康检查
│   │       ├── setup/            # 初始化设置
│   │       └── seed/             # 演示数据填充
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 基础组件
│   │   ├── views/                # 页面级视图组件
│   │   ├── layout/               # 侧边栏与页面布局
│   │   ├── agents/               # Agent 表单对话框
│   │   ├── projects/             # 项目表单对话框
│   │   ├── skills/               # 技能表单对话框
│   │   ├── issues/               # Issue 表单与详情面板
│   │   └── chat/                 # 聊天消息组件
│   ├── hooks/                    # 自定义 React Hooks
│   ├── lib/                      # 工具函数、API 客户端、数据库客户端、模型供应商
│   ├── store/                    # Zustand 状态管理
│   ├── types/                    # TypeScript 类型定义
│   └── views/                    # 视图包装器
├── mini-services/
│   └── realtime-service/         # Socket.io 实时服务
├── examples/                     # 示例代码
│   └── websocket/
├── .env.example                  # 环境变量模板
└── package.json
```

---

## 📡 API 文档

### Agent

| 方法 | 端点 | 描述 |
|------|------|------|
| `GET` | `/api/agents` | 列出所有 Agent |
| `POST` | `/api/agents` | 创建 Agent |
| `GET` | `/api/agents/[id]` | 获取 Agent 详情 |
| `PUT` | `/api/agents/[id]` | 更新 Agent |
| `DELETE` | `/api/agents/[id]` | 删除 Agent |
| `POST` | `/api/agents/[id]/toggle-status` | 切换 Agent 在线/离线状态 |

### 项目

| 方法 | 端点 | 描述 |
|------|------|------|
| `GET` | `/api/projects` | 列出项目及 Issue 统计 |
| `POST` | `/api/projects` | 创建项目 |
| `GET` | `/api/projects/[id]` | 获取项目详情 |
| `PUT` | `/api/projects/[id]` | 更新项目 |
| `DELETE` | `/api/projects/[id]` | 删除项目 |

### Issue

| 方法 | 端点 | 描述 |
|------|------|------|
| `GET` | `/api/issues` | 列出 Issue（可筛选） |
| `POST` | `/api/issues` | 创建 Issue |
| `GET` | `/api/issues/[id]` | 获取 Issue 详情 |
| `PUT` | `/api/issues/[id]` | 更新 Issue |
| `DELETE` | `/api/issues/[id]` | 删除 Issue |

### 技能

| 方法 | 端点 | 描述 |
|------|------|------|
| `GET` | `/api/skills` | 列出技能及关联 Agent |
| `POST` | `/api/skills` | 创建技能 |
| `GET` | `/api/skills/[id]` | 获取技能详情 |
| `PUT` | `/api/skills/[id]` | 更新技能 |
| `DELETE` | `/api/skills/[id]` | 删除技能 |

### 聊天

| 方法 | 端点 | 描述 |
|------|------|------|
| `GET` | `/api/chat` | 列出聊天会话 |
| `POST` | `/api/chat` | 创建聊天会话 |
| `GET` | `/api/chat/[id]/messages` | 获取会话消息 |
| `POST` | `/api/chat/[id]/messages` | 发送消息 |
| `POST` | `/api/chat/complete` | AI 聊天补全 |

### 其他

| 方法 | 端点 | 描述 |
|------|------|------|
| `GET` | `/api/dashboard` | 工作空间分析与统计数据 |
| `GET` | `/api/workspaces` | 列出工作空间 |
| `POST` | `/api/workspaces` | 创建工作空间 |
| `GET` | `/api/models` | 列出可用 AI 模型 |
| `GET` | `/api/health` | 健康检查 |
| `POST` | `/api/setup` | 初始化工作空间设置 |
| `POST` | `/api/seed` | 填充演示数据 |

---

## 🔄 Agent 编排模式

AgentHub 内置了常见 Agent 编排模式的参考指南：

| 模式 | 描述 |
|------|------|
| **直接调用** | 单个 Agent 端到端处理任务 |
| **流水线** | Agent 顺序链式执行，每个处理上一个的输出 |
| **扇出** | 并行分发给多个 Agent，结果聚合 |
| **路由器** | 分类器 Agent 将任务路由到专门的 Agent |
| **监督者** | 监督者 Agent 分派、监控和协调子 Agent |
| **混合 Agent** | 分层架构，包含提议者和聚合者角色 |

这些模式帮助团队针对不同复杂度设计高效的多 Agent 工作流。

---

## 🤖 多供应商 AI 支持

AgentHub 提供统一的 `chatCompletion` 和 `streamChatCompletion` API，跨所有支持的供应商工作。在环境变量中配置 API 密钥即可动态启用供应商。

```typescript
import { chatCompletion, streamChatCompletion } from '@/lib/model-providers'

// 非流式补全
const response = await chatCompletion({
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  messages: [{ role: 'user', content: 'Hello!' }],
})

// 流式补全
for await (const chunk of streamChatCompletion({
  provider: 'glm',
  model: 'glm-4-plus',
  messages: [{ role: 'user', content: '你好！' }],
})) {
  process.stdout.write(chunk)
}
```

---

## 🗃 数据模型

平台在 Prisma Schema 中定义了 **13 个数据模型**：

| 模型 | 描述 |
|------|------|
| `Workspace` | 团队顶层容器 |
| `User` | 用户账号（邮箱与头像） |
| `Member` | 工作空间成员角色（owner/admin/member） |
| `Agent` | AI Agent 配置（供应商、指令、状态） |
| `Skill` | 可复用技能卡片（分类与内容） |
| `AgentSkill` | Agent 与技能的多对多关联 |
| `Project` | 项目容器（状态与优先级） |
| `Issue` | 任务/Issue 跟踪（完整生命周期） |
| `Comment` | Issue 评论（来自成员和 Agent） |
| `AgentTask` | Agent 执行记录（含 Token 用量） |
| `ChatSession` | 与 Agent 的对话会话 |
| `ChatMessage` | 聊天会话中的单条消息 |
| `ActivityLog` | 工作空间活动审计日志 |

---

## 📸 截图

> 截图即将上线。在此期间，请访问 [在线演示](https://multica-z-ai.vercel.app) 体验平台功能。

---

## 📄 许可证

本项目基于 **MIT 许可证** 开源。

---

<p align="center">
  由 <a href="https://github.com/dav-niu474">dav-niu474</a> 用 ❤️ 构建
</p>
