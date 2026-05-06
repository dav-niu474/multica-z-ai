import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { resolveWorkspaceId } from '@/lib/auth-utils'

// GET /api/agents?workspaceId=xxx&isArchived=false - List agents with skills
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = await resolveWorkspaceId(request)
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 401 })
    }
    const isArchived = searchParams.get('isArchived')

    const agents = await db().agent.findMany({
      where: {
        workspaceId,
        ...(isArchived !== null ? { isArchived: isArchived === 'true' } : { isArchived: false }),
      },
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
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      provider,
      instructions,
      status,
      maxConcurrentTasks,
      visibility,
      model,
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
        provider: provider || 'claude',
        instructions: instructions || null,
        status: status || 'idle',
        maxConcurrentTasks: maxConcurrentTasks ?? 3,
        visibility: visibility || 'workspace',
        model: model || null,
        workspaceId,
        ...(skillIds && skillIds.length > 0
          ? {
              skills: {
                create: skillIds.map((skillId: string) => ({ skillId })),
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
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}
