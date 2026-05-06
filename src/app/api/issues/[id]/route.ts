import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/issues/[id] - Full issue with labels, reactions, subscriber count, comment count
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const issue = await db().issue.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, title: true, icon: true },
        },
        labels: {
          include: { label: true },
        },
        subscribers: {
          select: { id: true, userId: true },
        },
        comments: {
          select: { id: true },
        },
        tasks: {
          include: {
            agent: {
              select: { id: true, name: true, provider: true },
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
        parentIssue: {
          select: { id: true, identifier: true, title: true },
        },
        subIssues: {
          select: { id: true, identifier: true, title: true, status: true },
        },
      },
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...issue,
      labelCount: issue.labels.length,
      subscriberCount: issue.subscribers.length,
      commentCount: issue.comments.length,
    })
  } catch (error) {
    console.error('Error fetching issue:', error)
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 })
  }
}

// PUT /api/issues/[id] - Update issue + log activity
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
      position,
      assigneeType,
      assigneeId,
      projectId,
      parentIssueId,
      dueDate,
      labelIds,
    } = body

    const existing = await db().issue.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Log status change activity
    if (status && status !== existing.status) {
      await db().activityLog.create({
        data: {
          action: 'status_changed',
          entityType: 'issue',
          entityId: id,
          actorType: 'member',
          details: { from: existing.status, to: status },
          issueId: id,
          workspaceId: existing.workspaceId,
        },
      })

      // Auto-set closedAt when status is done
      if (status === 'done' && !existing.closedAt) {
        await db().issue.update({
          where: { id },
          data: { closedAt: new Date() },
        })
      } else if (status !== 'done' && existing.closedAt) {
        await db().issue.update({
          where: { id },
          data: { closedAt: null },
        })
      }
    }

    // Log priority change
    if (priority && priority !== existing.priority) {
      await db().activityLog.create({
        data: {
          action: 'priority_changed',
          entityType: 'issue',
          entityId: id,
          actorType: 'member',
          details: { from: existing.priority, to: priority },
          issueId: id,
          workspaceId: existing.workspaceId,
        },
      })
    }

    // Log assignment change
    if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
      await db().activityLog.create({
        data: {
          action: 'assigned',
          entityType: 'issue',
          entityId: id,
          actorType: 'member',
          details: {
            fromAssignee: existing.assigneeId,
            toAssignee: assigneeId || null,
            assigneeType: assigneeType || existing.assigneeType,
          },
          issueId: id,
          workspaceId: existing.workspaceId,
        },
      })
    }

    const updateData: Record<string, unknown> = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(position !== undefined && { position }),
      ...(assigneeType !== undefined && { assigneeType }),
      ...(assigneeId !== undefined && { assigneeId }),
      ...(projectId !== undefined && { projectId }),
      ...(parentIssueId !== undefined && { parentIssueId }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    }

    const issue = await db().issue.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, title: true, icon: true },
        },
        labels: {
          include: { label: true },
        },
      },
    })

    // Handle label updates
    if (labelIds !== undefined && Array.isArray(labelIds)) {
      // Remove existing labels
      await db().issueToLabel.deleteMany({ where: { issueId: id } })
      // Add new labels
      if (labelIds.length > 0) {
        await db().issueToLabel.createMany({
          data: labelIds.map((labelId: string) => ({ issueId: id, labelId })),
        })
      }
      // Re-fetch with labels
      const updated = await db().issue.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, title: true, icon: true } },
          labels: { include: { label: true } },
        },
      })
      if (updated) return NextResponse.json(updated)
    }

    return NextResponse.json(issue)
  } catch (error) {
    console.error('Error updating issue:', error)
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 })
  }
}

// DELETE /api/issues/[id] - Delete issue + clean up related data
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db().issue.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Delete related data explicitly (cascade should handle most)
    await db().issueToLabel.deleteMany({ where: { issueId: id } })
    await db().issueSubscriber.deleteMany({ where: { issueId: id } })
    await db().issueDependency.deleteMany({
      where: { OR: [{ fromIssueId: id }, { toIssueId: id }] },
    })

    await db().issue.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting issue:', error)
    return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 })
  }
}
