import prisma from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

const MAX_ATTEMPTS = 3

function isSerializationFailure(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  // P2034: write conflict / deadlock; 40001: Postgres serialization_failure
  return e?.code === 'P2034' || e?.code === '40001' || /could not serialize/i.test(e?.message ?? '')
}

/**
 * Runs `fn` in a SERIALIZABLE transaction, retrying on serialization conflicts.
 * Prevents two concurrent writes (e.g. a double-submitted SELL) from both passing
 * an oversell check that only sees their own insert.
 */
export async function serializableTx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: 'Serializable' })
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isSerializationFailure(err)) continue
      throw err
    }
  }
}
