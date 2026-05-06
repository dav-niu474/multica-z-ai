import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/comments/[id] - Update comment content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const existing = await db().comment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const comment = await db().comment.update({
      where: { id },
      data: { content },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

// DELETE /api/comments/[id] - Delete comment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db().comment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    await db().comment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
