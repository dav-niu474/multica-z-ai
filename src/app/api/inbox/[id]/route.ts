import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/inbox/[id] - Mark as read / archive
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { read, archived } = body

    const existing = await db().inboxItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 })
    }

    const updated = await db().inboxItem.update({
      where: { id },
      data: {
        ...(read !== undefined && { read }),
        ...(archived !== undefined && { archived }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating inbox item:', error)
    return NextResponse.json({ error: 'Failed to update inbox item' }, { status: 500 })
  }
}
