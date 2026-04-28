import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/agents/[id]/toggle-status - Toggle agent between idle/working
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agent = await db.agent.findUnique({ where: { id } })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const newStatus = agent.status === 'idle' ? 'working' : 'idle'

    const updated = await db.agent.update({
      where: { id },
      data: { status: newStatus },
    })

    return NextResponse.json({
      agent: updated,
      previousStatus: agent.status,
      newStatus,
    })
  } catch (error) {
    console.error('Error toggling agent status:', error)
    return NextResponse.json(
      { error: 'Failed to toggle agent status' },
      { status: 500 }
    )
  }
}
