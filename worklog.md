---
Task ID: 1
Agent: Main Agent
Task: Fix all production bugs - API failures, Edit Project form, Skills/Tools separation, i18n sidebar

Work Log:
- Read Vercel production logs - identified root cause: Prisma schema mismatch (Project table missing workspaceId column)
- Rewrote `/api/setup` route to always DROP + CREATE tables (guarantees schema correctness), creates fresh PrismaClient after DDL, always re-seeds demo data
- Updated `db.ts` to add `createFreshDb()` helper for post-DDL usage
- Rewrote `page.tsx` with robust error handling: setup → workspaces → render, with retry mechanism and error states
- Fixed Edit Project form by adding `key={editingProject?.id ?? 'create-new'}` to force Dialog remount on project change
- Rewrote `skills-view.tsx` with Tabs component: separate "Skills", "Tools", and "All" tabs with counts
- Updated `skill-form-dialog.tsx` to accept `defaultType` prop for tab-aware form defaults
- Added i18n keys for skill/tool distinction in both `en.ts` and `zh.ts`
- Deployed to Vercel production, all 6 API endpoints verified working (200 OK)

Stage Summary:
- All API failures fixed (DROP+CREATE strategy eliminates schema drift)
- Edit Project form populates correctly (key prop forces remount)
- Skills and Tools clearly separated with dedicated tabs
- Sidebar i18n working correctly
- Production deployment at https://multica-z-ai.vercel.app - all endpoints verified
