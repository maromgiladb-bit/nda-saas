import { PrismaClient } from '@prisma/client'
import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaNeon(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    adapter,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma