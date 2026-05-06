import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { resolveWorkspaceId } from '@/lib/auth-utils'

// GET /api/issues?workspaceId=xxx&status=xxx&... - Comprehensive listing with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = await resolveWorkspaceId(request)
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 401 })
    }
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigneeType = searchParams.get('assigneeType')
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')
    const labelIds = searchParams.get('labelIds')
    const include = searchParams.get('include')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const sortBy = searchParams.get('sortBy') || 'position'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      workspaceId,
      ...(status && status !== 'all' ? { status } : {}),
      ...(priority && priority !== 'all' ? { priority } : {}),
      ...(assigneeType ? { assigneeType } : {}),
      ...(projectId ? { projectId } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { identifier: { contains: search } },
        ],
      } : {}),
      ...(labelIds ? {
        labels: {
          some: {
            labelId: { in: labelIds.split(',') },
          },
        },
      } : {}),
    }

    const includeOptions: Record<string, unknown> = {
      project: {
        select: { id: true, title: true, icon: true },
      },
    }

    if (include) {
      const includes = include.split(',')
      if (includes.includes('labels')) {
        includeOptions.labels = {
          include: {
            label: true,
          },
        }
      }
      if (includes.includes('assignee')) {
        // Dynamically include assignee based on assigneeType - not directly possible with Prisma
        // We'll handle this in the response mapping
      }
      if (includes.includes('comments')) {
        includeOptions.comments = {
          select: { id: true },
        }
      }
      if (includes.includes('subscribers')) {
        includeOptions.subscribers = {
          select: { id: true, userId: true },
        }
      }
      if (includes.includes('tasks')) {
        includeOptions.tasks = {
          select: { id: true, status: true },
        }
      }
    }

    const [issues, total] = await Promise.all([
      db().issue.findMany({
        where,
        include: includeOptions,
        orderBy: {
          [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc',
        },
        skip,
        take: limit,
      }),
      db().issue.count({ where }),
    ])

    return NextResponse.json({
      issues,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issues', details: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/issues - Create issue with auto-generated identifier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      position,
      assigneeType,
      assigneeId,
      workspaceId,
      projectId,
      parentIssueId,
      dueDate,
      labelIds,
    } = body

    if (!title || !workspaceId) {
      return NextResponse.json(
        { error: 'Title and workspaceId are required' },
        { status: 400 }
      )
    }

    // Get workspace for issue prefix
    const workspace = await db().workspace.findUnique({ where: { id: workspaceId } })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Generate identifier (e.g., "AH-1")
    const lastIssue = await db().issue.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })

    let nextNumber = 1
    if (lastIssue?.identifier) {
      const parts = lastIssue.identifier.split('-')
      const num = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(num)) {
        nextNumber = num + 1
      }
    }
    const identifier = `${workspace.issuePrefix}-${nextNumber}`

    const issue = await db().issue.create({
      data: {
        identifier,
        title,
        description: description || null,
        status: status || 'backlog',
        priority: priority || 'none',
        position: position ?? 0,
        assigneeType: assigneeType || null,
        assigneeId: assigneeId || null,
        workspaceId,
        projectId: projectId || null,
        parentIssueId: parentIssueId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        ...(labelIds && labelIds.length > 0
          ? {
              labels: {
                create: labelIds.map((labelId: string) => ({ labelId })),
              },
            }
          : {}),
      },
      include: {
        project: {
          select: { id: true, title: true },
        },
        labels: {
          include: { label: true },
        },
      },
    })

    return NextResponse.json(issue, { status: 201 })
  } catch (error) {
    console.error('Error creating issue:', error)
    return NextResponse.json(
      { error: 'Failed to create issue', details: String(error) },
      { status: 500 }
    )
  }
}
