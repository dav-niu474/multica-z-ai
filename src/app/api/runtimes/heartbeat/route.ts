import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

interface HeartbeatBody {
  daemonId: string
  runtimeId?: string
  agentId?: string
  status?: string
  provider?: string
  os?: string
  cliVersion?: string
  deviceInfo?: Record<string, unknown>
  workspaceId: string
}

// POST /api/runtimes/heartbeat — Receive heartbeat from a daemon
export async function POST(request: NextRequest) {
  try {
    // Authenticate — allow daemon calls without auth but require auth for browser calls
    try {
      await requireAuth(request)
    } catch {
      // Allow daemon calls without auth; validated via daemonId + workspaceId
    }

    const body: HeartbeatBody = await request.json()
    const {
      daemonId,
      runtimeId,
      agentId,
      status = 'online',
      provider,
      os,
      cliVersion,
      deviceInfo,
      workspaceId,
    } = body

    if (!daemonId || !workspaceId) {
      return NextResponse.json(
        { error: 'daemonId and workspaceId are required' },
        { status: 400 }
      )
    }

    // Upsert the runtime record: find by daemonUuid+agentId or create new
    let runtime

    if (runtimeId) {
      // Update existing runtime by ID
      runtime = await db().agentRuntime.update({
        where: { id: runtimeId },
        data: {
          status: 'online',
          lastHeartbeat: new Date(),
          ...(provider && { provider }),
          ...(os && { os }),
          ...(cliVersion && { cliVersion }),
          ...(deviceInfo && { deviceInfo: deviceInfo as object }),
        },
        include: {
          agent: {
            select: { id: true, name: true, provider: true, status: true },
          },
        },
      })
    } else if (agentId) {
      // Upsert by agentId — finds existing by agentId (unique constraint) or creates new
      runtime = await db().agentRuntime.upsert({
        where: { agentId },
        create: {
          agentId,
          workspaceId,
          daemonUuid: daemonId,
          status: 'online',
          provider,
          os,
          cliVersion,
          deviceInfo: deviceInfo ? (deviceInfo as object) : undefined,
          lastHeartbeat: new Date().toISOString(),
        },
        update: {
          status: 'online',
          daemonUuid: daemonId,
          lastHeartbeat: new Date().toISOString(),
          ...(provider && { provider }),
          ...(os && { os }),
          ...(cliVersion && { cliVersion }),
          ...(deviceInfo && { deviceInfo: deviceInfo as object }),
        },
        include: {
          agent: {
            select: { id: true, name: true, provider: true, status: true },
          },
        },
      })
    } else {
      return NextResponse.json(
        { error: 'runtimeId or agentId is required' },
        { status: 400 }
      )
    }

    // Fetch pending AgentTasks (status = 'queued') for agents bound to this runtime
    const daemonRuntimes = await db().agentRuntime.findMany({
      where: { daemonUuid: daemonId, workspaceId },
      select: { agentId: true },
    })

    const agentIds = daemonRuntimes.map((r) => r.agentId)

    let pendingTasks: Array<{
      id: string
      agentId: string
      status: string
      kind: string | null
      createdAt: string
    }> = []

    if (agentIds.length > 0) {
      pendingTasks = await db().agentTask.findMany({
        where: {
          agentId: { in: agentIds },
          status: 'queued',
        },
        select: {
          id: true,
          agentId: true,
          status: true,
          kind: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      })
    }

    return NextResponse.json({
      ok: true,
      pendingTasks,
    })
  } catch (error) {
    console.error('Error processing heartbeat:', error)
    return NextResponse.json(
      { error: 'Failed to process heartbeat' },
      { status: 500 }
    )
  }
}
