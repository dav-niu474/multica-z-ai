import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth-utils'

// POST /api/invitations/[id] - Accept invitation (auto-create member)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()

    const invitation = await db().invitation.findUnique({ where: { id } })
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation is already ${invitation.status}` },
        { status: 400 }
      )
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    // Get user by email if no userId
    let targetUserId = userId
    if (!targetUserId) {
      const user = await db().user.findUnique({ where: { email: invitation.email } })
      targetUserId = user?.id || null
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create member
    await db().member.create({
      data: {
        userId: targetUserId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
    })

    // Update invitation status
    const updated = await db().invitation.update({
      where: { id },
      data: { status: 'accepted' },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}

// DELETE /api/invitations/[id] - Decline invitation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invitation = await db().invitation.findUnique({ where: { id } })
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const updated = await db().invitation.update({
      where: { id },
      data: { status: 'declined' },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error declining invitation:', error)
    return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 })
  }
}
