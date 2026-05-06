import { db } from '@/lib/db'
import { resolveWorkspaceId } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/autopilots?workspaceId=xxx - List autopilots with triggers
export async function GET(request: NextRequest) {
  try {
    const workspaceId = await resolveWorkspaceId(request)
    if (!workspaceId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const autopilots = await db().autopilot.findMany({
      where: { workspaceId },
      include: {
        agent: {
          select: { id: true, name: true, provider: true, status: true },
        },
        triggers: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { runs: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(autopilots)
  } catch (error) {
    console.error('Error fetching autopilots:', error)
    return NextResponse.json({ error: 'Failed to fetch autopilots' }, { status: 500 })
  }
}

// POST /api/autopilots - Create autopilot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, agentId, executionMode, workspaceId, trigger } = body

    if (!name || !agentId || !workspaceId) {
      return NextResponse.json(
        { error: 'Name, agentId, and workspaceId are required' },
        { status: 400 }
      )
    }

    const autopilot = await db().autopilot.create({
      data: {
        name,
        description: description || null,
        agentId,
        executionMode: executionMode || 'create_issue',
        workspaceId,
        ...(trigger ? {
          triggers: {
            create: {
              kind: trigger.kind || 'api',
              cronExpression: trigger.cronExpression || null,
              webhookToken: trigger.webhookToken || null,
              isActive: true,
            },
          },
        } : {}),
      },
      include: {
        agent: {
          select: { id: true, name: true, provider: true },
        },
        triggers: true,
      },
    })

    return NextResponse.json(autopilot, { status: 201 })
  } catch (error) {
    console.error('Error creating autopilot:', error)
    return NextResponse.json({ error: 'Failed to create autopilot' }, { status: 500 })
  }
}
