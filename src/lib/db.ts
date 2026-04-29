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

// Lazy singleton: created on first access, reused afterward
// In Vercel serverless, this ensures env vars are loaded before Prisma init
let _prisma: PrismaClient | undefined

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!_prisma) {
      _prisma = globalForPrisma.prisma ?? createPrismaClient()
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = _prisma
      }
    }
    const value = Reflect.get(_prisma!, prop)
    if (typeof value === 'function') {
      return value.bind(_prisma)
    }
    return value
  },
})
