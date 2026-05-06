import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/labels/[id] - Update label
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, color } = body

    const existing = await db().issueLabel.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    if (name && name !== existing.name) {
      const duplicate = await db().issueLabel.findFirst({
        where: { workspaceId: existing.workspaceId, name },
      })
      if (duplicate) {
        return NextResponse.json({ error: 'Label with this name already exists' }, { status: 409 })
      }
    }

    const label = await db().issueLabel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      },
    })

    return NextResponse.json(label)
  } catch (error) {
    console.error('Error updating label:', error)
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 })
  }
}

// DELETE /api/labels/[id] - Delete label
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db().issueLabel.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    // Remove all issue-to-label associations first
    await db().issueToLabel.deleteMany({ where: { labelId: id } })

    await db().issueLabel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting label:', error)
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 })
  }
}
