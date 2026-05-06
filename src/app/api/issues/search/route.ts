import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/issues/search?q=xxx&workspaceId=xxx - Full-text search across issues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const workspaceId = searchParams.get('workspaceId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!q) {
      return NextResponse.json({ error: 'Search query (q) is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      ...(workspaceId ? { workspaceId } : {}),
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { identifier: { contains: q } },
      ],
      ...(status && status !== 'all' ? { status } : {}),
      ...(priority && priority !== 'all' ? { priority } : {}),
    }

    const skip = (page - 1) * limit

    const [issues, total] = await Promise.all([
      db().issue.findMany({
        where,
        include: {
          project: {
            select: { id: true, title: true, icon: true },
          },
          labels: {
            include: { label: true },
          },
          _count: {
            select: {
              comments: true,
              subscribers: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
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
      query: q,
    })
  } catch (error) {
    console.error('Error searching issues:', error)
    return NextResponse.json({ error: 'Failed to search issues' }, { status: 500 })
  }
}
