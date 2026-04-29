import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/debug - Debug environment and database connection
export async function GET() {
  const results: Record<string, unknown> = {}

  results.env = {
    DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0, 40)}...` : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  }

  // Test db() function
  try {
    const client = db()
    const url = process.env.DATABASE_URL || 'NOT SET'
    results.step1_url = url.slice(0, 40) + '...'

    // Try raw query first
    const raw = await client.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    results.step2_tables = (raw as Array<{ table_name: string }>).map(r => r.table_name)

    // Try findMany
    const workspaces = await client.workspace.findMany({ take: 1 })
    results.step3_workspaces = `found ${workspaces.length}`
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    results.error = msg.slice(0, 500)
  }

  return NextResponse.json(results)
}
