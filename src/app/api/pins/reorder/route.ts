import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/pins/reorder - Reorder pins
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, items } = body

    if (!workspaceId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'workspaceId and items array are required' },
        { status: 400 }
      )
    }

    // Update each pin's order
    for (const item of items) {
      if (item.id && typeof item.order === 'number') {
        await db().pinnedItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering pins:', error)
    return NextResponse.json({ error: 'Failed to reorder pins' }, { status: 500 })
  }
}
