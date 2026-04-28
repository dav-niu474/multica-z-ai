import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/workspaces - List all workspaces
export async function GET() {
  try {
    const workspaces = await db.workspace.findMany({
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
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    )
  }
}

// POST /api/workspaces - Create a new workspace
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

    // Check if slug already exists
    const existing = await db.workspace.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Workspace with this slug already exists' },
        { status: 409 }
      )
    }

    const workspace = await db.workspace.create({
      data: {
        name,
        slug,
        description: description || null,
        context: context || null,
        icon: icon || null,
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    )
  }
}
