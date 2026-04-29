import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/skills?workspaceId=xxx&category=xxx - List skills with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const category = searchParams.get('category')

    const skills = await db().skill.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(category && category !== 'all' ? { category } : {}),
      },
      include: {
        agents: {
          include: {
            agent: {
              select: { id: true, name: true, avatar: true, provider: true, status: true },
            },
          },
        },
        _count: {
          select: {
            agents: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(skills)
  } catch (error) {
    console.error('Error fetching skills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

// POST /api/skills - Create a new skill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, content, type, category, source, workspaceId } = body

    if (!name || !content || !workspaceId) {
      return NextResponse.json(
        { error: 'Name, content, and workspaceId are required' },
        { status: 400 }
      )
    }

    const skill = await db().skill.create({
      data: {
        name,
        description: description || null,
        content,
        type: type || 'skill',
        category: category || null,
        source: source || null,
        workspaceId,
      },
    })

    return NextResponse.json(skill, { status: 201 })
  } catch (error) {
    console.error('Error creating skill:', error)
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    )
  }
}
