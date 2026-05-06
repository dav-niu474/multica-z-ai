import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/invitations/my - List my pending invitations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const invitations = await db().invitation.findMany({
      where: {
        email: normalizedEmail,
        status: 'pending',
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        invitedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching my invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}
