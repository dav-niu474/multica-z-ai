import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/chat/[id]/read - Mark session as read
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db().chatSession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
    }

    await db().chatSession.update({
      where: { id },
      data: { unreadCount: 0 },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking chat as read:', error)
    return NextResponse.json({ error: 'Failed to mark chat as read' }, { status: 500 })
  }
}
