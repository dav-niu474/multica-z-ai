import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // On Vercel, DATABASE_URL is injected as env var at build/runtime.
  // For local dev, it comes from .env files loaded by Next.js.
  //
  // We pass datasourceUrl explicitly because Turbopack may not pass
  // process.env to Prisma's native engine at schema validation time.
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.multicaZai_POSTGRES_URL

  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Please configure it in .env or Vercel dashboard.'
    )
  }

  return new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
