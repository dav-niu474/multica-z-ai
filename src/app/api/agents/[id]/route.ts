import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/agents/[id] - Full agent with skills
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agent = await db().agent.findUnique({
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
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 })
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
      provider,
      instructions,
      maxConcurrentTasks,
      visibility,
      model,
      mcpConfig,
      skillIds,
    } = body

    const existing = await db().agent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Handle skill updates if provided
    if (skillIds !== undefined) {
      await db().agentSkill.deleteMany({ where: { agentId: id } })
      if (Array.isArray(skillIds) && skillIds.length > 0) {
        await db().agentSkill.createMany({
          data: skillIds.map((skillId: string) => ({ agentId: id, skillId })),
        })
      }
    }

    const agent = await db().agent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(provider !== undefined && { provider }),
        ...(instructions !== undefined && { instructions }),
        ...(maxConcurrentTasks !== undefined && { maxConcurrentTasks }),
        ...(visibility !== undefined && { visibility }),
        ...(model !== undefined && { model }),
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
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

// DELETE /api/agents/[id] - Archive agent (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db().agent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    await db().agent.update({
      where: { id },
      data: { isArchived: true, status: 'offline' },
    })

    return NextResponse.json({ success: true, isArchived: true })
  } catch (error) {
    console.error('Error archiving agent:', error)
    return NextResponse.json({ error: 'Failed to archive agent' }, { status: 500 })
  }
}
