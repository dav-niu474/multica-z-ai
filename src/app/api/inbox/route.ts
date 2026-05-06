import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId, resolveWorkspaceId } from '@/lib/auth-utils'

// GET /api/inbox?workspaceId=xxx - List inbox items for current user
export async function GET(request: NextRequest) {
  try {
    const workspaceId = await resolveWorkspaceId(request)
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 401 })
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const items = await db().inboxItem.findMany({
      where: {
        workspaceId,
        recipientId: userId,
        recipientType: 'member',
        archived: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const unreadCount = await db().inboxItem.count({
      where: {
        workspaceId,
        recipientId: userId,
        recipientType: 'member',
        read: false,
        archived: false,
      },
    })

    return NextResponse.json({ items, unreadCount })
  } catch (error) {
    console.error('Error fetching inbox:', error)
    return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 })
  }
}

// POST /api/inbox - Batch operations (mark all read, archive all)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const where = {
      workspaceId,
      recipientId: userId,
      recipientType: 'member' as const,
      archived: false,
    }

    if (action === 'mark_all_read') {
      const result = await db().inboxItem.updateMany({
        where: { ...where, read: false },
        data: { read: true },
      })
      return NextResponse.json({ updated: result.count })
    }

    if (action === 'archive_all') {
      const result = await db().inboxItem.updateMany({
        where,
        data: { archived: true },
      })
      return NextResponse.json({ updated: result.count })
    }

    return NextResponse.json({ error: 'Invalid action. Use mark_all_read or archive_all' }, { status: 400 })
  } catch (error) {
    console.error('Error performing inbox batch operation:', error)
    return NextResponse.json({ error: 'Failed to perform batch operation' }, { status: 500 })
  }
}
