import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/projects?workspaceId=xxx - List projects
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

    const projects = await db().project.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
        issues: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Add computed status counts for each project
    const projectsWithStats = projects.map((project) => {
      const statusCounts: Record<string, number> = {}
      for (const issue of project.issues) {
        statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1
      }
      return {
        ...project,
        statusCounts,
        totalIssues: project._count.issues,
      }
    })

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, icon, status, priority, workspaceId } = body

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: 'Name and workspaceId are required' },
        { status: 400 }
      )
    }

    const project = await db().project.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        status: status || 'planned',
        priority: priority || 'none',
        workspaceId,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
