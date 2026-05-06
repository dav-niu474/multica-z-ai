import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/projects/[id] - Full project with resources
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await db().project.findUnique({
      where: { id },
      include: {
        issues: {
          select: { id: true, identifier: true, status: true, priority: true, title: true, position: true },
          orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        },
        resources: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { issues: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const statusCounts: Record<string, number> = {}
    for (const issue of project.issues) {
      statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1
    }
    const doneCount = statusCounts['done'] || 0

    return NextResponse.json({
      ...project,
      statusCounts,
      totalIssues: project._count.issues,
      doneCount,
      progress: project._count.issues > 0
        ? Math.round((doneCount / project._count.issues) * 100)
        : 0,
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, icon, status, priority, leadType, leadId } = body

    const existing = await db().project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = await db().project.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(leadType !== undefined && { leadType }),
        ...(leadId !== undefined && { leadId }),
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db().project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await db().projectResource.deleteMany({ where: { projectId: id } })
    await db().project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
