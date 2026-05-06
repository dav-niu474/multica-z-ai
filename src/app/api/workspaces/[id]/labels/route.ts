import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/workspaces/[workspaceId]/labels - List labels
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params

    const labels = await db().issueLabel.findMany({
      where: { id: workspaceId },
      include: {
        _count: {
          select: { issues: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(labels)
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 })
  }
}

// POST /api/workspaces/[workspaceId]/labels - Create label
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const body = await request.json()
    const { name, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check for duplicate name in workspace
    const existing = await db().issueLabel.findFirst({
      where: { id: workspaceId, name },
    })
    if (existing) {
      return NextResponse.json({ error: 'Label with this name already exists' }, { status: 409 })
    }

    const label = await db().issueLabel.create({
      data: {
        name,
        color: color || '#6b7280',
        workspaceId,
      },
    })

    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    console.error('Error creating label:', error)
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}
