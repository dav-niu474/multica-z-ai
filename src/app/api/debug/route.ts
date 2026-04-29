import { NextResponse } from 'next/server'

// GET /api/debug - Debug environment and database connection
export async function GET() {
  try {
    const envInfo = {
      DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0, 30)}...` : 'NOT SET',
      POSTGRES_URL: process.env.POSTGRES_URL ? `${process.env.POSTGRES_URL.slice(0, 30)}...` : 'NOT SET',
      multicaZai_POSTGRES_URL: process.env.multicaZai_POSTGRES_URL ? `${process.env.multicaZai_POSTGRES_URL.slice(0, 30)}...` : 'NOT SET',
      NVIDIA_API_KEY: process.env.NVIDIA_API_KEY ? `${process.env.NVIDIA_API_KEY.slice(0, 15)}...` : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      VERCEL: process.env.VERCEL || 'NOT SET',
    }

    // Try database connection
    let dbStatus = 'not tested'
    try {
      const { PrismaClient } = await import('@prisma/client')
      const url =
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.multicaZai_POSTGRES_URL
      if (url) {
        const prisma = new PrismaClient({ datasourceUrl: url, log: [] })
        const result = await prisma.$queryRaw`SELECT 1 as ok`
        dbStatus = `connected (query result: ${JSON.stringify(result)})`
        await prisma.$disconnect()
      } else {
        dbStatus = 'no database URL configured'
      }
    } catch (dbError: unknown) {
      dbStatus = `error: ${dbError instanceof Error ? dbError.message : String(dbError)}`
    }

    return NextResponse.json({ env: envInfo, db: dbStatus })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
