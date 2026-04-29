import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Support multiple Vercel Postgres env var naming conventions
  // Standard: POSTGRES_URL / POSTGRES_PRISMA_URL
  // Prefixed:  multicaZai_POSTGRES_URL / multicaZai_POSTGRES_PRISMA_URL
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.multicaZai_POSTGRES_URL

  const directUrl =
    process.env.DIRECT_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.multicaZai_POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.multicaZai_POSTGRES_URL_NON_POOLING

  if (databaseUrl) {
    // Use PrismaPg adapter for Vercel Postgres (serverless-friendly)
    const connectionString = directUrl || databaseUrl
    const adapter = new PrismaPg({ connectionString })
    return new PrismaClient({ adapter, log: process.env.NODE_ENV === 'development' ? ['error'] : [] })
  }

  // Fallback for local development (SQLite)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
