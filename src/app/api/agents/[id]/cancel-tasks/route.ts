import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/agents/[id]/cancel-tasks - Cancel running tasks
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agent = await db().agent.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const result = await db().agentTask.updateMany({
      where: {
        agentId: id,
        status: { in: ['queued', 'running'] },
      },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ cancelled: result.count })
  } catch (error) {
    console.error('Error cancelling agent tasks:', error)
    return NextResponse.json({ error: 'Failed to cancel agent tasks' }, { status: 500 })
  }
}
