Task ID: 9
Agent: Routing Refactor Agent

## Summary
Refactored the AgentHub app from a single-page SPA (all views at `/`) to a proper Next.js App Router structure with workspace-based URL routing (`/{workspaceSlug}/...`).

## Files Created
1. **`src/lib/workspace-context.tsx`** - WorkspaceProvider + useWorkspaceContext hook
2. **`src/components/layout/app-layout.tsx`** - Shared layout with URL-based sidebar navigation
3. **`src/app/[workspaceSlug]/layout.tsx`** - Server layout fetching workspace by slug
4. **`src/app/[workspaceSlug]/workspace-layout-client.tsx`** - Client wrapper (I18n + Auth + Workspace + Layout)
5. **`src/app/[workspaceSlug]/page.tsx`** - Redirect to /{slug}/issues
6. **13 page route files** - dashboard, issues, agents, projects, chat, skills, inbox, autopilots, runtimes, members, settings, my-issues

## Files Modified
1. **`src/app/page.tsx`** - Wrapped with WorkspaceProvider, added redirect logic
2. **`src/app/api/workspaces/route.ts`** - Added slug query parameter support
3. **`src/hooks/use-workspace.ts`** - Simplified to use WorkspaceContext

## Key Design Decisions
- **Hybrid approach**: `/` renders the full app with state-based nav (for sandbox); `/{slug}/...` uses URL routing (for Vercel)
- **Server component layout**: Workspace lookup happens server-side for optimal performance
- **WorkspaceContext bridge**: `useWorkspace()` hook delegates to context, ensuring all views work in both routing modes
- **View wrappers**: Page files pass `workspaceId` from context to views that need it as prop
