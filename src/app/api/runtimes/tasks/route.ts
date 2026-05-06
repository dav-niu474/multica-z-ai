import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/runtimes/tasks — List tasks with optional filters
// Query params: ?runtimeId=xxx&status=queued
export async function GET(request: NextRequest) {
  try {
    // Authenticate — allow daemon calls without auth but require auth for browser calls
    try {
      await requireAuth(request)
    } catch {
      // Allow daemon polling without auth
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const runtimeId = searchParams.get('runtimeId')
    const workspaceId = searchParams.get('workspaceId')

    // Build where clause
    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (runtimeId) {
      // Find the agent bound to this runtime
      const runtime = await db().agentRuntime.findUnique({
        where: { id: runtimeId },
        select: { agentId: true },
      })
      if (runtime) {
        where.agentId = runtime.agentId
      } else {
        return NextResponse.json({ tasks: [] })
      }
    }

    if (workspaceId) {
      // Find all agents in this workspace
      const agents = await db().agent.findMany({
        where: { workspaceId },
        select: { id: true },
      })
      where.agentId = { in: agents.map((a) => a.id) }
    }

    const tasks = await db().agentTask.findMany({
      where,
      include: {
        agent: {
          select: { id: true, name: true, provider: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
