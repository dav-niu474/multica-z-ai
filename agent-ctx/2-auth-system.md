---
Task ID: 2
Agent: Main Agent
Task: Implement complete authentication system using NextAuth.js v4 with GitHub provider

Work Log:
- Read worklog.md and existing project structure (prisma schema, db.ts, seed data, existing API routes)
- Created `src/lib/auth.ts` with NextAuth config:
  - GitHub provider (conditional on GITHUB_ID env var)
  - Credentials provider with demo accounts (alex@agenthub.dev/sarah@agenthub.dev/mike@agenthub.dev, password: demo123)
  - JWT session strategy
  - Callbacks: jwt (add userId), session (pass userId), signIn (auto-link user to workspace)
- Created `src/app/api/auth/[...nextauth]/route.ts` with GET/POST handlers
- Created `src/middleware.ts` to protect API routes (allows /api/auth/*, /api/setup, /api/health, /api/seed, /api/models)
- Created `src/lib/auth-utils.ts` with server-side helpers: getAuthSession(), requireAuth(), requireRole(), getCurrentUserId(), getCurrentMembership()
- Created `src/components/auth/auth-provider.tsx` with SessionProvider wrapper
- Created `src/app/login/page.tsx` (server component) + `src/app/login/login-form.tsx` (client component):
  - Clean centered login card with AgentHub branding and Layers icon
  - Email/password form with show/hide password toggle
  - Error display with helpful demo credential hints
  - Loading state with spinner
  - Conditional GitHub OAuth button when configured
- Updated `src/app/layout.tsx` to wrap children with AuthProvider
- Updated `src/app/page.tsx`:
  - Added AuthGuard component (separate from AppContent to avoid hooks-after-return lint error)
  - Shows loading state while checking session
  - Shows "Sign in to continue" prompt with LogIn button when unauthenticated
  - Added sign-out button in desktop sidebar footer
- Added NEXTAUTH_SECRET and NEXTAUTH_URL to .env file
- Fixed React hooks rules-of-hooks error by separating AuthGuard into its own component

Stage Summary:
- Complete auth system implemented with NextAuth v4
- JWT-based sessions for API route compatibility
- Middleware protects all API routes except public ones
- Clean login page at /login with demo credentials
- Main page (/) shows auth-gated content with login prompt
- Sign-out button available in sidebar
- All auth utilities available for server-side use in API routes
- Dev server compiles successfully with no new lint errors
