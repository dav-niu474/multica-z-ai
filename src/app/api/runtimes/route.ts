import { db } from '@/lib/db'
import { resolveWorkspaceId } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/runtimes - List runtimes
export async function GET(request: NextRequest) {
  try {
    const workspaceId = await resolveWorkspaceId(request)
    if (!workspaceId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const runtimes = await db().agentRuntime.findMany({
      where: { workspaceId },
      include: {
        agent: {
          select: { id: true, name: true, provider: true, status: true },
        },
      },
      orderBy: { lastHeartbeat: 'desc' },
    })

    return NextResponse.json(runtimes)
  } catch (error) {
    console.error('Error fetching runtimes:', error)
    return NextResponse.json({ error: 'Failed to fetch runtimes' }, { status: 500 })
  }
}
