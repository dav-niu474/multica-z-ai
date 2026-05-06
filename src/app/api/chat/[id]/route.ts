import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/chat/[id] - Full chat session
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await db().chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            agent: {
              select: { id: true, name: true, provider: true },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching chat session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    )
  }
}

// DELETE /api/chat/[id] - Archive chat session
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db().chatSession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    await db().chatSession.update({
      where: { id },
      data: { isArchived: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error archiving chat session:', error)
    return NextResponse.json(
      { error: 'Failed to archive chat session' },
      { status: 500 }
    )
  }
}
