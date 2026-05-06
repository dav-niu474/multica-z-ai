import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'agenthub-dev-secret-change-in-production'
const DEV_CODE = process.env.MULTICA_DEV_CODE || '000000'

// Shared reference to the code store (must match send-code)
// In practice these share a module, but for Next.js route isolation we re-import
const codeStore = new Map<string, { code: string; expiresAt: number; email: string }>()

// This is a workaround: since codeStore lives in send-code module,
// we'll use a global to share state
const globalForAuth = globalThis as unknown as {
  verificationCodes: Map<string, { code: string; expiresAt: number; email: string }> | undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Dev mode: accept 000000 or MULTICA_DEV_CODE
    const isDevCode = code === DEV_CODE

    if (!isDevCode) {
      // In non-dev mode, we would check the stored code
      // For this version, we accept any valid 6-digit code in dev mode
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 })
    }

    // Find or create user
    let user = await db().user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      user = await db().user.create({
        data: {
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
        },
      })
    }

    // Generate JWT token (30-day expiry)
    const token = await new SignJWT({
      sub: user.id,
      userId: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode(JWT_SECRET))

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      token,
    })
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 })
  }
}
