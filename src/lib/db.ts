import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.multicaZai_POSTGRES_URL

  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Please configure it in Vercel dashboard.'
    )
  }

  return new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

/**
 * Get a Prisma client instance.
 * In development, reuses a singleton via globalThis (supports hot reload).
 * In production (serverless), creates a new client per cold start.
 */
export function db() {
  if (process.env.NODE_ENV !== 'production') {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    return globalForPrisma.prisma
  }
  // In serverless, create a fresh client to avoid stale connections
  return createPrismaClient()
}
