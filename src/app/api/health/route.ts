import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check database connectivity
    const startTime = Date.now()
    const workspaceCount = await db().workspace.count()
    const dbLatency = Date.now() - startTime

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latencyMs: dbLatency,
        workspaceCount,
      },
      version: '1.0.0',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        version: '1.0.0',
      },
      { status: 503 }
    )
  }
}
