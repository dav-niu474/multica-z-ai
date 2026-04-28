import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/issues/[id] - Get single issue with full details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const issue = await db.issue.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, icon: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        tasks: {
          include: {
            agent: {
              select: { id: true, name: true, avatar: true, provider: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        activity: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        workspace: {
          select: { id: true, name: true },
        },
      },
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Parse labels from JSON string if present
    const result = {
      ...issue,
      labels: issue.labels ? JSON.parse(issue.labels) : [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching issue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issue' },
      { status: 500 }
    )
  }
}

// PUT /api/issues/[id] - Update issue (status, priority, assignee, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      order,
      assigneeType,
      assigneeId,
      projectId,
      dueDate,
      labels,
    } = body

    const existing = await db.issue.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Log status change activity
    if (status && status !== existing.status) {
      await db.activityLog.create({
        data: {
          action: 'status_changed',
          entityType: 'issue',
          entityId: id,
          actorType: 'member',
          metadata: JSON.stringify({
            from: existing.status,
            to: status,
          }),
          issueId: id,
        },
      })
    }

    // Log priority change activity
    if (priority && priority !== existing.priority) {
      await db.activityLog.create({
        data: {
          action: 'priority_changed',
          entityType: 'issue',
          entityId: id,
          actorType: 'member',
          metadata: JSON.stringify({
            from: existing.priority,
            to: priority,
          }),
          issueId: id,
        },
      })
    }

    // Log assignment change activity
    if (
      (assigneeId !== undefined && assigneeId !== existing.assigneeId) ||
      (assigneeType !== undefined && assigneeType !== existing.assigneeType)
    ) {
      await db.activityLog.create({
        data: {
          action: 'assigned',
          entityType: 'issue',
          entityId: id,
          actorType: 'member',
          metadata: JSON.stringify({
            fromAssignee: existing.assigneeId,
            toAssignee: assigneeId || null,
            assigneeType: assigneeType || existing.assigneeType,
          }),
          issueId: id,
        },
      })
    }

    const issue = await db.issue.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(order !== undefined && { order }),
        ...(assigneeType !== undefined && { assigneeType }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(projectId !== undefined && { projectId }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(labels !== undefined && {
          labels: labels ? JSON.stringify(labels) : null,
        }),
      },
      include: {
        project: {
          select: { id: true, name: true, icon: true },
        },
      },
    })

    const result = {
      ...issue,
      labels: issue.labels ? JSON.parse(issue.labels) : [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating issue:', error)
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    )
  }
}

// DELETE /api/issues/[id] - Delete issue
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.issue.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    await db.issue.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting issue:', error)
    return NextResponse.json(
      { error: 'Failed to delete issue' },
      { status: 500 }
    )
  }
}
