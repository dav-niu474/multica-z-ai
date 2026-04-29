# Task 6-b: Dashboard & Agents View Components

## Status: Complete

## Files Created

| File | Description |
|------|-------------|
| `src/types/index.ts` | TypeScript types matching Prisma schema (Workspace, Agent, Issue, Skill, Chat, Activity, Dashboard) |
| `src/hooks/use-workspace.ts` | Shared hook to fetch the first workspace ID from API |
| `src/components/views/dashboard-view.tsx` | Dashboard view with stats cards, agent grid, issue distribution chart, activity feed |
| `src/components/views/agents-view.tsx` | Agents view with card grid, CRUD operations, status toggle, delete confirmation |
| `src/components/agents/agent-form-dialog.tsx` | Agent create/edit dialog with form fields and skill multi-select |

## Files Modified

| File | Change |
|------|--------|
| `src/app/page.tsx` | Replaced placeholder with tab navigation (Dashboard, Agents) using views |

## Design Decisions

- **Workspace ID**: Instead of hardcoding, created `useWorkspace` hook that fetches the first workspace from `/api/workspaces` — CUID IDs are dynamically generated.
- **Dashboard view** fetches from `/api/dashboard?workspaceId=<id>` (returns aggregated stats including agents, so no separate agents fetch needed).
- **Agents view** fetches agents + skills in parallel, re-fetches after any mutation.
- **Agent form dialog** serves both create (POST `/api/agents`) and edit (PUT `/api/agents/[id]`) modes via the `agent?` prop.
- **Status toggle** calls POST `/api/agents/[id]/toggle-status`.
- **Delete** uses AlertDialog for confirmation, then DELETE `/api/agents/[id]`.
- **Recharts** donut chart uses `ChartContainer` + `ChartConfig` from shadcn/ui chart primitives.
- **Color system**: Status (idle=emerald, working=amber, blocked/error=red, offline=gray). Provider (claude=violet, codex=teal, gemini=cyan, custom=orange). No blue/indigo.
- **Responsive**: Mobile-first grid layouts (1 col → 2 col md → 3 col lg for agent cards).
- **Loading states**: Skeleton placeholders match the content shape.
- **Toast notifications**: Uses sonner for success/error feedback on mutations.

## Lint Status
- Zero new errors. Pre-existing 3 errors in `src/hooks/use-socket.ts` (from Task 7) are unrelated.
