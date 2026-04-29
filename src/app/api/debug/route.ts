import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/debug - Debug environment and database connection
export async function GET() {
  const results: Record<string, unknown> = {}

  // 1. Env vars
  results.env = {
    DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0, 30)}...` : 'NOT SET',
    POSTGRES_URL: process.env.POSTGRES_URL ? `${process.env.POSTGRES_URL.slice(0, 30)}...` : 'NOT SET',
    multicaZai_POSTGRES_URL: process.env.multicaZai_POSTGRES_URL ? `${process.env.multicaZai_POSTGRES_URL.slice(0, 30)}...` : 'NOT SET',
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY ? `${process.env.NVIDIA_API_KEY.slice(0, 15)}...` : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    VERCEL: process.env.VERCEL || 'NOT SET',
  }

  // 2. Test direct PrismaClient creation (bypass db.ts)
  try {
    const { PrismaClient } = await import('@prisma/client')
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.multicaZai_POSTGRES_URL
    if (url) {
      const prisma = new PrismaClient({ datasourceUrl: url, log: [] })
      const r = await prisma.$queryRaw`SELECT 1 as ok`
      results.directPrisma = `OK: ${JSON.stringify(r)}`
      await prisma.$disconnect()
    } else {
      results.directPrisma = 'SKIP: no URL'
    }
  } catch (e: unknown) {
    results.directPrisma = `ERROR: ${e instanceof Error ? e.message : String(e)}`
  }

  // 3. Test db() function from db.ts
  try {
    const client = db()
    const workspaces = await client.workspace.findMany({ take: 1 })
    results.dbFunction = `OK: found ${workspaces.length} workspace(s)`
  } catch (e: unknown) {
    results.dbFunction = `ERROR: ${e instanceof Error ? e.message : String(e)}`
    if (e instanceof Error) {
      results.dbFunctionStack = e.stack?.slice(0, 500)
    }
  }

  return NextResponse.json(results)
}
