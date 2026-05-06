import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth-utils'

// GET /api/workspaces/[workspaceId]/invitations - List invitations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params

    const invitations = await db().invitation.findMany({
      where: { id: workspaceId },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedByUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}

// POST /api/workspaces/[workspaceId]/invitations - Create invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const body = await request.json()
    const { email, role } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const userId = await getCurrentUserId()

    // Check workspace exists
    const workspace = await db().workspace.findUnique({ where: { id: workspaceId } })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user already has a pending invitation
    const existingInvitation = await db().invitation.findFirst({
      where: {
        workspaceId,
        email: normalizedEmail,
        status: 'pending',
      },
    })
    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation already exists for this email' },
        { status: 409 }
      )
    }

    // Check if user is already a member
    const existingUser = await db().user.findUnique({
      where: { email: normalizedEmail },
    })
    if (existingUser) {
      const existingMember = await db().member.findFirst({
        where: { userId: existingUser.id, workspaceId },
      })
      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of this workspace' },
          { status: 409 }
        )
      }
    }

    const invitation = await db().invitation.create({
      data: {
        workspaceId,
        email: normalizedEmail,
        role: role || 'member',
        invitedBy: userId || 'system',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }
}
