import { db } from '@/lib/db'
import { resolveWorkspaceId } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/activity?entityType=xxx&entityId=xxx&limit=xxx - Activity log with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = await resolveWorkspaceId(request)
    if (!workspaceId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const actorType = searchParams.get('actorType')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: Record<string, unknown> = {
      workspaceId,
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(actorType ? { actorType } : {}),
    }

    const activities = await db().activityLog.findMany({
      where,
      include: {
        issue: {
          select: { id: true, identifier: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activity log:', error)
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
  }
}
