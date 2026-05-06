import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/pins/[id] - Delete pin
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db().pinnedItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    await db().pinnedItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pin:', error)
    return NextResponse.json({ error: 'Failed to delete pin' }, { status: 500 })
  }
}
