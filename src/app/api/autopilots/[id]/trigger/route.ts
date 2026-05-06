import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// POST /api/autopilots/[id]/trigger - Trigger autopilot run
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const autopilot = await db().autopilot.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, name: true, status: true },
        },
      },
    })

    if (!autopilot) {
      return NextResponse.json({ error: 'Autopilot not found' }, { status: 404 })
    }

    if (!autopilot.isActive) {
      return NextResponse.json({ error: 'Autopilot is not active' }, { status: 400 })
    }

    // Create an autopilot run
    const run = await db().autopilotRun.create({
      data: {
        autopilotId: id,
        status: 'pending',
        triggerKind: 'api',
      },
    })

    // Create a task for the agent
    const task = await db().agentTask.create({
      data: {
        agentId: autopilot.agentId,
        status: 'queued',
        autopilotRunId: run.id,
        priority: 'none',
      },
    })

    // Update run status
    await db().autopilotRun.update({
      where: { id: run.id },
      data: { status: 'running' },
    })

    return NextResponse.json({
      run: {
        id: run.id,
        status: run.status,
        triggerKind: run.triggerKind,
      },
      task: {
        id: task.id,
        status: task.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error triggering autopilot:', error)
    return NextResponse.json({ error: 'Failed to trigger autopilot' }, { status: 500 })
  }
}
