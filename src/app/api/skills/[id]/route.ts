import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/skills/[id] - Skill with files
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const skill = await db().skill.findUnique({
      where: { id },
      include: {
        files: {
          orderBy: { path: 'asc' },
        },
        agents: {
          include: {
            agent: {
              select: { id: true, name: true, provider: true, status: true, isArchived: true },
            },
          },
        },
        _count: {
          select: { agents: true },
        },
      },
    })

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    return NextResponse.json(skill)
  } catch (error) {
    console.error('Error fetching skill:', error)
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 })
  }
}

// PUT /api/skills/[id] - Update skill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, content, type, category, source } = body

    const existing = await db().skill.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    if (name && name !== existing.name) {
      const duplicate = await db().skill.findFirst({
        where: { workspaceId: existing.workspaceId, name },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Skill with this name already exists' },
          { status: 409 }
        )
      }
    }

    const skill = await db().skill.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category }),
        ...(source !== undefined && { source }),
      },
    })

    return NextResponse.json(skill)
  } catch (error) {
    console.error('Error updating skill:', error)
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 })
  }
}

// DELETE /api/skills/[id] - Delete skill
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db().skill.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    await db().skillFile.deleteMany({ where: { skillId: id } })
    await db().agentSkill.deleteMany({ where: { skillId: id } })
    await db().skill.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting skill:', error)
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
  }
}
