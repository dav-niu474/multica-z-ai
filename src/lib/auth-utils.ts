import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { Session } from "next-auth"

/**
 * Get the current authenticated session (server-side).
 * Returns null if not authenticated.
 */
export async function getAuthSession(): Promise<Session | null> {
  try {
    const session = await getServerSession(authOptions)
    return session
  } catch (error) {
    console.error("Error getting auth session:", error)
    return null
  }
}

/**
 * Require authentication. Throws an error with status 401 if not authenticated.
 * Returns the session if authenticated.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getAuthSession()

  if (!session?.user) {
    throw Object.assign(new Error("Authentication required"), { status: 401 })
  }

  return session
}

/**
 * Get the current user's ID from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getAuthSession()
  if (!session?.user) {
    return null
  }
  return (session.user as { userId?: string }).userId || null
}

/**
 * Require a specific workspace role. Throws if the user doesn't have the required role.
 * Returns the session and member info if authorized.
 */
export async function requireRole(role: "owner" | "admin" | "member"): Promise<{
  session: Session
  userId: string
  member: { id: string; role: string; workspaceId: string }
}> {
  const session = await requireAuth()
  const userId = (session.user as { userId?: string }).userId

  if (!userId) {
    throw Object.assign(new Error("User ID not found in session"), {
      status: 401,
    })
  }

  // Find the user's membership in any workspace
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

  // Role hierarchy: owner > admin > member
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

  return { session, userId, member }
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
