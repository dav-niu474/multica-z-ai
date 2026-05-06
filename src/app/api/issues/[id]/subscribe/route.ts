import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth-utils'

// POST /api/issues/[id]/subscribe - Toggle subscriber
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const issue = await db().issue.findUnique({ where: { id } })
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Check if already subscribed
    const existing = await db().issueSubscriber.findUnique({
      where: {
        issueId_userId: { issueId: id, userId },
      },
    })

    if (existing) {
      await db().issueSubscriber.delete({ where: { id: existing.id } })
      return NextResponse.json({ subscribed: false })
    } else {
      await db().issueSubscriber.create({
        data: { issueId: id, userId },
      })
      return NextResponse.json({ subscribed: true })
    }
  } catch (error) {
    console.error('Error toggling subscription:', error)
    return NextResponse.json({ error: 'Failed to toggle subscription' }, { status: 500 })
  }
}
