import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/skills/[id] - Get a single skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const skill = await db().skill.findUnique({
      where: { id },
      include: {
        agents: {
          include: {
            agent: {
              select: { id: true, name: true, avatar: true, provider: true, status: true },
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

// PUT /api/skills/[id] - Update a skill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, content, type, category, source } = body

    const skill = await db().skill.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(type !== undefined ? { type: type || 'skill' } : {}),
        ...(category !== undefined ? { category: category || null } : {}),
        ...(source !== undefined ? { source: source || null } : {}),
      },
    })

    return NextResponse.json(skill)
  } catch (error) {
    console.error('Error updating skill:', error)
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 })
  }
}

// DELETE /api/skills/[id] - Delete a skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db().skill.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting skill:', error)
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
  }
}
