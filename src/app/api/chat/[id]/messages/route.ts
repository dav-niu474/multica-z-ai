import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/chat/[id]/messages - Get all messages for a chat session
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
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
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}

// POST /api/chat/[id]/messages - Send a message in a chat session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { role, content } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    if (!['user', 'agent', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: user, agent, system' },
        { status: 400 }
      )
    }

    // Verify session exists
    const session = await db.chatSession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    const message = await db.chatMessage.create({
      data: {
        role,
        content,
        sessionId: id,
      },
    })

    // Update session's unreadCount and title if it's the first user message
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (role === 'agent') {
      updateData.unreadCount = { increment: 1 }
    }
    if (!session.title && role === 'user') {
      // Auto-generate title from first user message
      updateData.title =
        content.length > 50 ? content.substring(0, 50) + '...' : content
    }

    await db.chatSession.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
