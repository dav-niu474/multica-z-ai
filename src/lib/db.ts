import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  // Priority order for database URL:
  // 1. DATABASE_URL (explicitly configured, works for both queries and schema ops)
  // 2. multicaZai_POSTGRES_PRISMA_URL (Vercel Postgres integration, optimized for Prisma)
  // 3. POSTGRES_PRISMA_URL (standard Vercel Postgres integration)
  // 4. multicaZai_POSTGRES_URL_NON_POOLING (Vercel Postgres non-pooling URL)
  // 5. POSTGRES_URL_NON_POOLING
  // 6. multicaZai_POSTGRES_URL (Vercel Postgres custom store pooling URL)
  // 7. POSTGRES_URL (Vercel Postgres pooling URL)
  const url =
    process.env.DATABASE_URL ||
    process.env.multicaZai_POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.multicaZai_POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.multicaZai_POSTGRES_URL ||
    process.env.POSTGRES_URL

  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Please configure it in Vercel dashboard or .env file.'
    )
  }

  return url
}

function createPrismaClient() {
  const url = getDatabaseUrl()
  const isProduction = process.env.NODE_ENV === 'production'

  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: isProduction ? ['error'] : ['error', 'warn'],
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
