import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/agents/[id]/tasks - List agent tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const agent = await db().agent.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const tasks = await db().agentTask.findMany({
      where: {
        agentId: id,
        ...(status ? { status } : {}),
      },
      include: {
        issue: {
          select: { id: true, identifier: true, title: true, status: true },
        },
        chatSession: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching agent tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch agent tasks' }, { status: 500 })
  }
}

// POST /api/agents/[id]/tasks - Create task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { issueId, chatSessionId, priority, status } = body

    const agent = await db().agent.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const task = await db().agentTask.create({
      data: {
        agentId: id,
        issueId: issueId || null,
        chatSessionId: chatSessionId || null,
        status: status || 'queued',
        priority: priority || 'none',
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating agent task:', error)
    return NextResponse.json({ error: 'Failed to create agent task' }, { status: 500 })
  }
}
