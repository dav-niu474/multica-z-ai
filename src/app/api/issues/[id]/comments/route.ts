import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth-utils'

// GET /api/issues/[id]/comments - List comments with reactions, ordered by createdAt
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const issue = await db().issue.findUnique({ where: { id } })
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const comments = await db().comment.findMany({
      where: { issueId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/issues/[id]/comments - Create comment + log activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, authorType, authorId, parentId, attachments } = body

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Content or attachments are required' }, { status: 400 })
    }

    const issue = await db().issue.findUnique({ where: { id } })
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const userId = await getCurrentUserId()

    // Resolve author info
    let resolvedAuthorType = authorType || 'member'
    let resolvedAuthorId = authorId || userId || 'system'
    let authorName = ''
    let authorAvatar: string | null = null

    if (resolvedAuthorType === 'member' && resolvedAuthorId) {
      const user = await db().user.findUnique({
        where: { id: resolvedAuthorId },
        select: { name: true, avatarUrl: true },
      })
      if (user) {
        authorName = user.name
        authorAvatar = user.avatarUrl
      }
    } else if (resolvedAuthorType === 'agent' && resolvedAuthorId) {
      const agent = await db().agent.findUnique({
        where: { id: resolvedAuthorId },
        select: { name: true },
      })
      if (agent) {
        authorName = agent.name
      }
    }

    // Validate and sanitize attachments
    let sanitizedAttachments: unknown[] = []
    if (attachments && Array.isArray(attachments)) {
      sanitizedAttachments = attachments
        .filter((a: unknown) => a !== null && typeof a === 'object')
        .map((a: Record<string, unknown>) => ({
          id: typeof a.id === 'string' ? a.id : '',
          name: typeof a.name === 'string' ? a.name : 'unknown',
          url: typeof a.url === 'string' ? a.url : '',
          size: typeof a.size === 'number' ? a.size : 0,
          mimeType: typeof a.mimeType === 'string' ? a.mimeType : 'application/octet-stream',
          createdAt: typeof a.createdAt === 'string' ? a.createdAt : new Date().toISOString(),
        }))
    }

    const comment = await db().comment.create({
      data: {
        content: content || '',
        type: 'comment',
        authorType: resolvedAuthorType,
        authorId: resolvedAuthorId,
        authorName,
        authorAvatar,
        parentId: parentId || null,
        issueId: id,
        workspaceId: issue.workspaceId,
        attachments: JSON.stringify(sanitizedAttachments),
      },
    })

    // Log activity
    await db().activityLog.create({
      data: {
        action: 'commented',
        entityType: 'issue',
        entityId: id,
        actorType: resolvedAuthorType,
        actorId: resolvedAuthorId,
        actorName: authorName,
        actorAvatar: authorAvatar,
        issueId: id,
        workspaceId: issue.workspaceId,
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
