import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/chat?workspaceId=xxx - List chat sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId query parameter is required' },
        { status: 400 }
      )
    }

    const sessions = await db.chatSession.findMany({
      where: {
        workspaceId,
        isArchived: false,
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            role: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            agent: {
              select: { id: true, name: true, avatar: true, provider: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    )
  }
}

// POST /api/chat - Create a new chat session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, agentId, workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      )
    }

    const session = await db.chatSession.create({
      data: {
        title: title || null,
        agentId: agentId || null,
        workspaceId,
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating chat session:', error)
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    )
  }
}
