import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/agents?workspaceId=xxx - List agents by workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId query parameter is required' },
        { status: 400 }
      )
    }

    const agents = await db().agent.findMany({
      where: { workspaceId },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      avatar,
      provider,
      instructions,
      status,
      maxConcurrent,
      visibility,
      workspaceId,
      skillIds,
    } = body

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: 'Name and workspaceId are required' },
        { status: 400 }
      )
    }

    const agent = await db().agent.create({
      data: {
        name,
        description: description || null,
        avatar: avatar || null,
        provider: provider || 'claude',
        instructions: instructions || null,
        status: status || 'idle',
        maxConcurrent: maxConcurrent ?? 3,
        visibility: visibility || 'workspace',
        workspaceId,
        ...(skillIds && skillIds.length > 0
          ? {
              skills: {
                create: skillIds.map((skillId: string) => ({
                  skillId,
                })),
              },
            }
          : {}),
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
