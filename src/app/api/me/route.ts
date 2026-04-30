import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'agenthub-dev-secret-change-in-production'

export async function GET(request: NextRequest) {
  try {
    // Read session token from cookie
    const token = request.cookies.get('next-auth.session-token')?.value
      || request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!token) {
      return NextResponse.json({ user: null, expires: null })
    }

    // Verify and decode the JWT
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))

    return NextResponse.json({
      user: {
        name: payload.name || null,
        email: payload.email || null,
      },
      expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    })
  } catch {
    // Token is invalid or expired
    return NextResponse.json({ user: null, expires: null })
  }
}
