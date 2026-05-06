import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/issues/batch - Batch update issues
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, updates } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates object is required' }, { status: 400 })
    }

    // Build update data with proper date handling
    const updateData: Record<string, unknown> = { ...updates }
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate as string)
    }

    const result = await db().issue.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error('Error batch updating issues:', error)
    return NextResponse.json({ error: 'Failed to batch update issues' }, { status: 500 })
  }
}

// DELETE /api/issues/batch - Batch delete issues
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    // Clean up related data
    await db().issueToLabel.deleteMany({ where: { issueId: { in: ids } } })
    await db().issueSubscriber.deleteMany({ where: { issueId: { in: ids } } })
    await db().issueDependency.deleteMany({
      where: {
        OR: [
          { fromIssueId: { in: ids } },
          { toIssueId: { in: ids } },
        ],
      },
    })

    const result = await db().issue.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    console.error('Error batch deleting issues:', error)
    return NextResponse.json({ error: 'Failed to batch delete issues' }, { status: 500 })
  }
}
