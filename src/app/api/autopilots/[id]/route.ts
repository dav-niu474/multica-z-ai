import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/autopilots/[id] - Full autopilot
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const autopilot = await db().autopilot.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, name: true, provider: true, status: true, isArchived: true },
        },
        triggers: {
          orderBy: { createdAt: 'asc' },
        },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!autopilot) {
      return NextResponse.json({ error: 'Autopilot not found' }, { status: 404 })
    }

    return NextResponse.json(autopilot)
  } catch (error) {
    console.error('Error fetching autopilot:', error)
    return NextResponse.json({ error: 'Failed to fetch autopilot' }, { status: 500 })
  }
}

// PUT /api/autopilots/[id] - Update autopilot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, executionMode, isActive } = body

    const existing = await db().autopilot.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Autopilot not found' }, { status: 404 })
    }

    const autopilot = await db().autopilot.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(executionMode !== undefined && { executionMode }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        agent: {
          select: { id: true, name: true, provider: true },
        },
        triggers: true,
      },
    })

    return NextResponse.json(autopilot)
  } catch (error) {
    console.error('Error updating autopilot:', error)
    return NextResponse.json({ error: 'Failed to update autopilot' }, { status: 500 })
  }
}

// DELETE /api/autopilots/[id] - Delete autopilot
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db().autopilot.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Autopilot not found' }, { status: 404 })
    }

    await db().autopilot.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting autopilot:', error)
    return NextResponse.json({ error: 'Failed to delete autopilot' }, { status: 500 })
  }
}
