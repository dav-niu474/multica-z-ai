import { db } from "@/lib/db"
import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "agenthub-dev-secret-change-in-production"
)

/**
 * Verify a JWT token and return the payload.
 * Returns null if verification fails.
 */
async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Get the current authenticated user ID from JWT cookie.
 * Uses JWT from cookie directly (skip NextAuth to avoid JWE errors).
 * Returns null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  // Try JWT from cookie directly (skip NextAuth to avoid JWE errors)
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("next-auth.session-token")?.value
      || cookieStore.get("__Secure-next-auth.session-token")?.value

    if (token) {
      const payload = await verifyToken(token)
      if (!payload) return null

      // sub might be an email (from signin) or a UUID (from verify-code)
      const sub = payload.sub as string
      if (!sub) return null

      // If sub looks like an email, find the user by email
      if (sub.includes('@')) {
        const user = await db().user.findUnique({
          where: { email: sub },
          select: { id: true },
        })
        return user?.id || null
      }

      return sub
    }
  } catch {
    // JWT verification failed
  }

  return null
}

/**
 * Get the current authenticated user from JWT cookie.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  try {
    return db().user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true },
    })
  } catch {
    return null
  }
}

/**
 * Get the current authenticated session (server-side).
 * Returns null if not authenticated.
 */
export async function getAuthSession() {
  return null
}

/**
 * Require authentication. Throws an error with status 401 if not authenticated.
 * Returns the user ID if authenticated.
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()

  if (!userId) {
    throw Object.assign(new Error("Authentication required"), { status: 401 })
  }

  return userId
}

/**
 * Require a specific workspace role. Throws if the user doesn't have the required role.
 * Returns the user ID and member info if authorized.
 */
export async function requireRole(role: "owner" | "admin" | "member"): Promise<{
  userId: string
  member: { id: string; role: string; workspaceId: string }
}> {
  const userId = await getCurrentUserId()

  if (!userId) {
    throw Object.assign(new Error("Authentication required"), { status: 401 })
  }

  const member = await db().member.findFirst({
    where: { userId },
    select: {
      id: true,
      role: true,
      workspaceId: true,
    },
  })

  if (!member) {
    throw Object.assign(
      new Error("No workspace membership found. Please contact an administrator."),
      { status: 403 }
    )
  }

  const roleHierarchy: Record<string, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  }

  if ((roleHierarchy[member.role] || 0) < (roleHierarchy[role] || 0)) {
    throw Object.assign(
      new Error(`Insufficient permissions. Required role: ${role}, your role: ${member.role}`),
      { status: 403 }
    )
  }

  return { userId, member }
}

/**
 * Resolve workspaceId from query params or user's membership.
 * If no workspaceId is provided, uses the user's first workspace membership.
 * Returns null if no workspace found.
 */
export async function resolveWorkspaceId(request: NextRequest): Promise<string | null> {
  // Check query params first
  const { searchParams } = new URL(request.url)
  const queryWsId = searchParams.get('workspaceId')
  if (queryWsId) return queryWsId

  // Check x-workspace-slug header
  const slug = request.headers.get('x-workspace-slug')
  if (slug) {
    const ws = await db().workspace.findUnique({ where: { slug }, select: { id: true } })
    return ws?.id || null
  }

  // Fall back to user's first workspace membership
  const userId = await getCurrentUserId()
  if (!userId) return null

  const member = await db().member.findFirst({
    where: { userId },
    select: { workspaceId: true },
  })
  return member?.workspaceId || null
}

/**
 * Get the current user's membership in their workspace.
 * Returns null if no membership found.
 */
export async function getCurrentMembership() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  return db().member.findFirst({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}
