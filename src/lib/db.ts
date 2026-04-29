import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // On Vercel, DATABASE_URL and DIRECT_URL are injected as env vars.
  // For local dev, they come from .env files loaded by Next.js.
  // We pass datasourceUrl explicitly to handle Turbopack edge cases
  // where Prisma's engine might not see process.env at schema validation time.
  let url = process.env.DIRECT_URL || process.env.DATABASE_URL

  if (!url) {
    // Last resort: read from .env file directly
    try {
      const envPath = join(process.cwd(), '.env')
      if (existsSync(envPath)) {
        const content = readFileSync(envPath, 'utf-8')
        for (const line of content.split('\n')) {
          const trimmed = line.trim()
          if (trimmed.startsWith('DIRECT_URL=') || trimmed.startsWith('DATABASE_URL=')) {
            const eqIdx = trimmed.indexOf('=')
            const key = trimmed.slice(0, eqIdx)
            const val = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, '')
            if (key === 'DIRECT_URL' || key === 'DATABASE_URL') {
              process.env[key] = val
              if (!process.env.DATABASE_URL) process.env.DATABASE_URL = val
              if (!process.env.DIRECT_URL && key === 'DIRECT_URL') process.env.DIRECT_URL = val
            }
          }
        }
        url = process.env.DIRECT_URL || process.env.DATABASE_URL
      }
    } catch {
      // Ignore file read errors
    }
  }

  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  return new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
