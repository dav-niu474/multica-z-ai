import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/members/[id] - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: owner, admin, member' },
        { status: 400 }
      )
    }

    const member = await db().member.findUnique({ where: { id } })
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const updated = await db().member.update({
      where: { id },
      data: { role },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

// DELETE /api/members/[id] - Remove member
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const member = await db().member.findUnique({ where: { id } })
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    await db().member.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
