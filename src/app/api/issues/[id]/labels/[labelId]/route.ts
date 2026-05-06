import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/issues/[issueId]/labels/[labelId] - Attach label to issue
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  try {
    const { id: issueId, labelId } = await params

    const issue = await db().issue.findUnique({ where: { id: issueId } })
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const label = await db().issueLabel.findUnique({ where: { id: labelId } })
    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    const existing = await db().issueToLabel.findUnique({
      where: {
        issueId_labelId: { issueId, labelId },
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'Label already attached to issue' }, { status: 409 })
    }

    const issueToLabel = await db().issueToLabel.create({
      data: { issueId, labelId },
      include: { label: true },
    })

    return NextResponse.json(issueToLabel, { status: 201 })
  } catch (error) {
    console.error('Error attaching label:', error)
    return NextResponse.json({ error: 'Failed to attach label' }, { status: 500 })
  }
}

// DELETE /api/issues/[issueId]/labels/[labelId] - Detach label from issue
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  try {
    const { id: issueId, labelId } = await params

    const existing = await db().issueToLabel.findUnique({
      where: {
        issueId_labelId: { issueId, labelId },
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Label not attached to issue' }, { status: 404 })
    }

    await db().issueToLabel.delete({ where: { id: existing.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error detaching label:', error)
    return NextResponse.json({ error: 'Failed to detach label' }, { status: 500 })
  }
}
