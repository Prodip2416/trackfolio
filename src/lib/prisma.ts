import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL
  // On Vercel every serverless instance gets its own pool, and Supabase's pooler caps
  // clients (15 in session mode). Keep each instance small and release idle clients
  // quickly; DB_POOL_MAX overrides. Use the TRANSACTION pooler (port 6543) on Vercel.
  const serverless = !!process.env.VERCEL
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX) || (serverless ? 2 : 5),
    idleTimeoutMillis: serverless ? 5000 : 30000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare global {
   
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}
