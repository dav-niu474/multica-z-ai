import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth-utils'

// GET /api/workspaces - List workspaces where current user is a member
export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const workspaces = await db().workspace.findMany({
      where: userId
        ? {
            members: {
              some: { userId },
            },
          }
        : undefined,
      include: {
        _count: {
          select: {
            agents: true,
            issues: true,
            projects: true,
            members: true,
            skills: true,
            chatSessions: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspaces', details: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/workspaces - Create a new workspace + auto-create member as owner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, context, icon } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const existing = await db().workspace.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Workspace with this slug already exists' },
        { status: 409 }
      )
    }

    const userId = await getCurrentUserId()

    // If no user authenticated, create workspace without member
    if (!userId) {
      const workspace = await db().workspace.create({
        data: {
          name,
          slug,
          description: description || null,
          context: context || null,
          icon: icon || null,
        },
      })
      return NextResponse.json(workspace, { status: 201 })
    }

    const workspace = await db().workspace.create({
      data: {
        name,
        slug,
        description: description || null,
        context: context || null,
        icon: icon || null,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        _count: {
          select: {
            agents: true,
            issues: true,
            projects: true,
            members: true,
          },
        },
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: 'Failed to create workspace', details: String(error) },
      { status: 500 }
    )
  }
}
