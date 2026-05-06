import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface CompleteBody {
  output?: string
  failureReason?: string
  tokensUsed?: number
  elapsedMs?: number
  workspaceId?: string
}

// POST /api/runtimes/tasks/[taskId]/complete — Mark a task as completed or failed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const body: CompleteBody = await request.json()
    const { output, failureReason, tokensUsed = 0, elapsedMs, workspaceId } = body

    // Find the task
    const task = await db().agentTask.findUnique({
      where: { id: taskId },
      include: {
        agent: {
          select: { id: true, name: true, workspaceId: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const taskStatus = failureReason ? 'failed' : 'completed'
    const wsId = workspaceId || task.agent.workspaceId

    // Update the task
    const updatedTask = await db().agentTask.update({
      where: { id: taskId },
      data: {
        status: taskStatus,
        output: output || null,
        failureReason: failureReason || null,
        tokensUsed,
        elapsedMs: elapsedMs || null,
        completedAt: new Date(),
      },
    })

    // Create an ActivityLog entry
    await db().activityLog.create({
      data: {
        action: taskStatus === 'completed' ? 'task_completed' : 'task_failed',
        entityType: 'AgentTask',
        entityId: taskId,
        actorType: 'agent',
        actorId: task.agent.id,
        actorName: task.agent.name,
        workspaceId: wsId,
        details: {
          taskId,
          agentId: task.agent.id,
          agentName: task.agent.name,
          status: taskStatus,
          tokensUsed,
          elapsedMs,
          ...(failureReason && { failureReason }),
        },
      },
    })

    return NextResponse.json({
      ok: true,
      task: updatedTask,
    })
  } catch (error) {
    console.error('Error completing task:', error)
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}
