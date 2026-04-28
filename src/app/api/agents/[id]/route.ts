import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/agents/[id] - Get single agent
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agent = await db.agent.findUnique({
      where: { id },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

// PUT /api/agents/[id] - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      description,
      avatar,
      provider,
      instructions,
      maxConcurrent,
      visibility,
      customEnv,
      customArgs,
      mcpConfig,
    } = body

    const existing = await db.agent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const agent = await db.agent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(avatar !== undefined && { avatar }),
        ...(provider !== undefined && { provider }),
        ...(instructions !== undefined && { instructions }),
        ...(maxConcurrent !== undefined && { maxConcurrent }),
        ...(visibility !== undefined && { visibility }),
        ...(customEnv !== undefined && { customEnv }),
        ...(customArgs !== undefined && { customArgs }),
        ...(mcpConfig !== undefined && { mcpConfig }),
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

// DELETE /api/agents/[id] - Delete agent
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.agent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    await db.agent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}
