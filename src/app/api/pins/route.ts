import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/pins?workspaceId=xxx - List pins
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const pins = await db().pinnedItem.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(pins)
  } catch (error) {
    console.error('Error fetching pins:', error)
    return NextResponse.json({ error: 'Failed to fetch pins' }, { status: 500 })
  }
}

// POST /api/pins - Create pin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, itemId, workspaceId } = body

    if (!type || !itemId || !workspaceId) {
      return NextResponse.json(
        { error: 'type, itemId, and workspaceId are required' },
        { status: 400 }
      )
    }

    if (!['issue', 'project'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be issue or project' },
        { status: 400 }
      )
    }

    // Check for existing pin
    const existing = await db().pinnedItem.findFirst({
      where: { workspaceId, type, itemId },
    })
    if (existing) {
      return NextResponse.json({ error: 'Item is already pinned' }, { status: 409 })
    }

    // Get the max order
    const maxPin = await db().pinnedItem.findFirst({
      where: { workspaceId },
      orderBy: { order: 'desc' },
    })
    const order = (maxPin?.order || 0) + 1

    const pin = await db().pinnedItem.create({
      data: { type, itemId, order, workspaceId },
    })

    return NextResponse.json(pin, { status: 201 })
  } catch (error) {
    console.error('Error creating pin:', error)
    return NextResponse.json({ error: 'Failed to create pin' }, { status: 500 })
  }
}
