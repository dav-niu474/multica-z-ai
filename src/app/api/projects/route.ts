import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { resolveWorkspaceId } from '@/lib/auth-utils'

// GET /api/projects?workspaceId=xxx - List projects with issue counts
export async function GET(request: NextRequest) {
  try {
    const workspaceId = await resolveWorkspaceId(request)
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 401 })
    }

    const projects = await db().project.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { issues: true },
        },
        issues: {
          select: { status: true },
        },
        resources: {
          select: { id: true, type: true, name: true, url: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const projectsWithStats = projects.map((project) => {
      const statusCounts: Record<string, number> = {}
      for (const issue of project.issues) {
        statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1
      }
      const doneCount = statusCounts['done'] || 0
      return {
        ...project,
        statusCounts,
        totalIssues: project._count.issues,
        doneCount,
        progress: project._count.issues > 0
          ? Math.round((doneCount / project._count.issues) * 100)
          : 0,
      }
    })

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, icon, status, priority, workspaceId, leadType, leadId } = body

    if (!title || !workspaceId) {
      return NextResponse.json(
        { error: 'Title and workspaceId are required' },
        { status: 400 }
      )
    }

    const project = await db().project.create({
      data: {
        title,
        description: description || null,
        icon: icon || null,
        status: status || 'active',
        priority: priority || 'none',
        leadType: leadType || null,
        leadId: leadId || null,
        workspaceId,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
