import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'agenthub-dev-secret-change-in-production'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('next-auth.session-token')?.value
      || request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!token) {
      return NextResponse.json({ user: null, expires: null })
    }

    let payload: { sub?: string; userId?: string; email?: string; name?: string; exp?: number }
    try {
      const result = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
      payload = result.payload as typeof payload
    } catch {
      // Try to decode the JWT from signin route (which has 'sub' as email)
      try {
        const result = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
        payload = result.payload as typeof payload
      } catch {
        return NextResponse.json({ user: null, expires: null })
      }
    }

    // Try to get fresh user data from DB
    const userId = payload.userId || payload.sub
    let user: { id: string; email: string; name: string; avatarUrl: string | null } | null = null

    if (userId) {
      // If sub was used as email in the signin route, try to find by email
      if (!payload.userId && payload.email) {
        user = await db().user.findUnique({ where: { email: payload.email } })
      } else {
        user = await db().user.findUnique({ where: { id: userId } })
      }
    } else if (payload.email) {
      user = await db().user.findUnique({ where: { email: payload.email } })
    }

    return NextResponse.json({
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      } : {
        id: userId || null,
        name: payload.name || null,
        email: payload.email || null,
        avatarUrl: null,
      },
      expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    })
  } catch {
    return NextResponse.json({ user: null, expires: null })
  }
}
