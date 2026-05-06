import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

interface UpdateTaskBody {
  status: 'completed' | 'failed' | 'running' | 'queued' | 'cancelled'
  output?: string
  failureReason?: string
  tokensUsed?: number
  elapsedMs?: number
  startedAt?: string
}

// PATCH /api/runtimes/tasks/[taskId] — Update a task's status and metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Authenticate — allow daemon calls without auth but require auth for browser calls
    try {
      await requireAuth(request)
    } catch {
      // Allow daemon task updates without auth
    }

    const { taskId } = await params
    const body: UpdateTaskBody = await request.json()
    const { status, output, failureReason, tokensUsed, elapsedMs, startedAt } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['completed', 'failed', 'running', 'queued', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Find the task
    const existingTask = await db().agentTask.findUnique({
      where: { id: taskId },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = { status }

    if (output !== undefined) {
      updateData.output = output || null
    }

    if (failureReason !== undefined) {
      updateData.failureReason = failureReason || null
    }

    if (tokensUsed !== undefined) {
      updateData.tokensUsed = tokensUsed
    }

    if (elapsedMs !== undefined) {
      updateData.elapsedMs = elapsedMs
    }

    // Set startedAt when transitioning to running
    if (status === 'running' && !existingTask.startedAt) {
      updateData.startedAt = startedAt ? new Date(startedAt) : new Date()
    }

    // Set completedAt for terminal statuses
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updateData.completedAt = new Date()
    }

    // Update the task
    const updatedTask = await db().agentTask.update({
      where: { id: taskId },
      data: updateData,
    })

    // Optionally create an ActivityLog for terminal states
    if (status === 'completed' || status === 'failed') {
      try {
        const agent = await db().agent.findUnique({
          where: { id: existingTask.agentId },
          select: { id: true, name: true, workspaceId: true },
        })

        if (agent) {
          await db().activityLog.create({
            data: {
              action: status === 'completed' ? 'task_completed' : 'task_failed',
              entityType: 'AgentTask',
              entityId: taskId,
              actorType: 'agent',
              actorId: agent.id,
              actorName: agent.name,
              workspaceId: agent.workspaceId,
              details: {
                taskId,
                agentId: agent.id,
                agentName: agent.name,
                status,
                tokensUsed: tokensUsed || 0,
                elapsedMs,
                ...(failureReason && { failureReason }),
              },
            },
          })
        }
      } catch {
        // Activity log creation is non-critical
      }
    }

    return NextResponse.json({
      ok: true,
      task: updatedTask,
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
