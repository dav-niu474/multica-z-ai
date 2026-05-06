import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/runtimes/[id] - Runtime detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const runtime = await db().agentRuntime.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, name: true, provider: true, status: true, description: true },
        },
      },
    })

    if (!runtime) {
      return NextResponse.json({ error: 'Runtime not found' }, { status: 404 })
    }

    return NextResponse.json(runtime)
  } catch (error) {
    console.error('Error fetching runtime:', error)
    return NextResponse.json({ error: 'Failed to fetch runtime' }, { status: 500 })
  }
}

// DELETE /api/runtimes/[id] - Delete runtime
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db().agentRuntime.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Runtime not found' }, { status: 404 })
    }

    await db().agentRuntime.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting runtime:', error)
    return NextResponse.json({ error: 'Failed to delete runtime' }, { status: 500 })
  }
}
