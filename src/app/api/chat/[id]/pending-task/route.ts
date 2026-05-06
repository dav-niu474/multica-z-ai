import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/chat/[id]/pending-task - Get pending task for session
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db().chatSession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
    }

    const task = await db().agentTask.findFirst({
      where: {
        chatSessionId: id,
        status: { in: ['queued', 'dispatched', 'running'] },
      },
      include: {
        issue: {
          select: { id: true, identifier: true, title: true },
        },
        agent: {
          select: { id: true, name: true, provider: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!task) {
      return NextResponse.json({ task: null })
    }

    return NextResponse.json({
      task: {
        taskId: task.id,
        issueId: task.issueId,
        issueIdentifier: task.issue?.identifier || null,
        issueTitle: task.issue?.title || null,
        status: task.status,
        createdAt: task.createdAt,
      },
    })
  } catch (error) {
    console.error('Error fetching pending task:', error)
    return NextResponse.json({ error: 'Failed to fetch pending task' }, { status: 500 })
  }
}
