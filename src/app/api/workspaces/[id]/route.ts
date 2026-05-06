import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth-utils'

// GET /api/workspaces/[id] - Get single workspace
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workspace = await db().workspace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            agents: true,
            issues: true,
            projects: true,
            members: true,
            skills: true,
            chatSessions: true,
            invitations: true,
            autopilots: true,
            runtimes: true,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 })
  }
}

// PUT /api/workspaces/[id] - Update workspace
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, slug, description, context, icon, issuePrefix } = body

    const existing = await db().workspace.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (slug && slug !== existing.slug) {
      const slugExists = await db().workspace.findUnique({ where: { slug } })
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
      }
    }

    const workspace = await db().workspace.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(context !== undefined && { context }),
        ...(icon !== undefined && { icon }),
        ...(issuePrefix !== undefined && { issuePrefix }),
      },
    })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id] - Delete workspace (only owner)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()

    const member = userId
      ? await db().member.findFirst({
          where: { userId, workspaceId: id },
        })
      : null

    if (!member || member.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the workspace owner can delete it' },
        { status: 403 }
      )
    }

    await db().workspace.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
  }
}
