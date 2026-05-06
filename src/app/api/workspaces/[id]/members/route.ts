import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/workspaces/[workspaceId]/members - List members with user info
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params

    const members = await db().member.findMany({
      where: { id: workspaceId },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

// POST /api/workspaces/[workspaceId]/members - Add member to workspace
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const body = await request.json()
    const { userId, role } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Check workspace exists
    const workspace = await db().workspace.findUnique({ where: { id: workspaceId } })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check user exists
    const user = await db().user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check not already a member
    const existing = await db().member.findFirst({
      where: { userId, workspaceId },
    })
    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
    }

    const member = await db().member.create({
      data: {
        userId,
        workspaceId,
        role: role || 'member',
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
