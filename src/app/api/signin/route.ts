import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const DEMO_ACCOUNTS = [
  { email: 'alex@agenthub.dev', password: 'demo123', name: 'Alex Chen' },
  { email: 'sarah@agenthub.dev', password: 'demo123', name: 'Sarah Kim' },
  { email: 'mike@agenthub.dev', password: 'demo123', name: 'Mike Rivera' },
]

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'agenthub-dev-secret-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const account = DEMO_ACCOUNTS.find(
      (a) => a.email === email && a.password === password
    )

    if (!account) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Create a JWT token
    const token = await new SignJWT({
      sub: account.email,
      email: account.email,
      name: account.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode(JWT_SECRET))

    // Create response with session cookie and token in body (for CLI)
    const response = NextResponse.json({
      success: true,
      token,
      user: { name: account.name, email: account.email },
    })

    // Set the session cookie
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error('Sign-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
