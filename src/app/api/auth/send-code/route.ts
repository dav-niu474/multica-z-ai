import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const rateLimitMap = new Map<string, { count: number; lastSent: number }>()
const codeStore = new Map<string, { code: string; expiresAt: number; email: string }>()
const DEV_CODE = process.env.MULTICA_DEV_CODE || '000000'

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function cleanupExpired() {
  const now = Date.now()
  for (const [key, value] of codeStore.entries()) {
    if (value.expiresAt < now) {
      codeStore.delete(key)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit: 1 code per 60 seconds per email
    const now = Date.now()
    const rateLimit = rateLimitMap.get(normalizedEmail)
    if (rateLimit && now - rateLimit.lastSent < 60000) {
      return NextResponse.json(
        { error: 'Please wait 60 seconds before requesting another code' },
        { status: 429 }
      )
    }

    // Generate 6-digit code
    const code = generateCode()
    const expiresAt = now + 10 * 60 * 1000 // 10 minutes

    // Store code
    codeStore.set(normalizedEmail, { code, expiresAt, email: normalizedEmail })

    // Update rate limit
    rateLimitMap.set(normalizedEmail, { count: 1, lastSent: now })

    // Clean up expired codes
    cleanupExpired()

    // Log code to console for testing
    console.log(`[AUTH] Verification code for ${normalizedEmail}: ${code} (expires in 10 minutes)`)
    console.log(`[AUTH] Dev mode code: ${DEV_CODE}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending verification code:', error)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}
