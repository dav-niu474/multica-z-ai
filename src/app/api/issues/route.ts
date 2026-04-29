import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/issues?workspaceId=xxx&status=xxx&projectId=xxx - List issues with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const priority = searchParams.get('priority')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId query parameter is required' },
        { status: 400 }
      )
    }

    const issues = await db().issue.findMany({
      where: {
        workspaceId,
        ...(status && status !== 'all' ? { status } : {}),
        ...(projectId ? { projectId } : {}),
        ...(priority && priority !== 'all' ? { priority } : {}),
      },
      include: {
        project: {
          select: { id: true, name: true, icon: true },
        },
        comments: {
          select: { id: true },
        },
        tasks: {
          select: { id: true, status: true },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(issues)
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}

// POST /api/issues - Create a new issue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      order,
      assigneeType,
      assigneeId,
      creatorType,
      creatorId,
      workspaceId,
      projectId,
      dueDate,
      labels,
    } = body

    if (!title || !workspaceId) {
      return NextResponse.json(
        { error: 'Title and workspaceId are required' },
        { status: 400 }
      )
    }

    const issue = await db().issue.create({
      data: {
        title,
        description: description || null,
        status: status || 'backlog',
        priority: priority || 'none',
        order: order ?? 0,
        assigneeType: assigneeType || null,
        assigneeId: assigneeId || null,
        creatorType: creatorType || 'member',
        creatorId: creatorId || null,
        workspaceId,
        projectId: projectId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels ? JSON.stringify(labels) : null,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(issue, { status: 201 })
  } catch (error) {
    console.error('Error creating issue:', error)
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    )
  }
}
